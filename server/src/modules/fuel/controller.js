import { query, getClient } from '../../config/db.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { notFoundError } from '../../utils/errors.js';
import { ExpenseCategory } from '../../utils/constants.js';

/**
 * Get all fuel logs with optional filtering
 */
export const getAllFuelLogs = async (req, res, next) => {
  try {
    const { vehicle_id, trip_id } = req.query;

    let queryText = `
      SELECT 
        f.*,
        v.registration_no as vehicle_registration,
        v.vehicle_name,
        t.source,
        t.destination
      FROM fuel_logs f
      LEFT JOIN vehicles v ON f.vehicle_id = v.id
      LEFT JOIN trips t ON f.trip_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (vehicle_id) {
      paramCount++;
      queryText += ` AND f.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
    }

    if (trip_id) {
      paramCount++;
      queryText += ` AND f.trip_id = $${paramCount}`;
      params.push(trip_id);
    }

    queryText += ' ORDER BY f.fuel_date DESC, f.created_at DESC';

    const result = await query(queryText, params);

    successResponse(res, { fuelLogs: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get fuel log by ID
 */
export const getFuelLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        f.*,
        v.registration_no as vehicle_registration,
        v.vehicle_name,
        t.source,
        t.destination
      FROM fuel_logs f
      LEFT JOIN vehicles v ON f.vehicle_id = v.id
      LEFT JOIN trips t ON f.trip_id = t.id
      WHERE f.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw notFoundError('Fuel log');
    }

    successResponse(res, { fuelLog: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Create fuel log (with transaction to create expense)
 */
export const createFuelLog = async (req, res, next) => {
  const client = await getClient();

  try {
    const {
      vehicle_id,
      trip_id,
      liters,
      cost,
      fuel_date,
    } = req.body;

    await client.query('BEGIN');

    // Validate vehicle exists
    const vehicleResult = await client.query(
      'SELECT id FROM vehicles WHERE id = $1',
      [vehicle_id]
    );

    if (vehicleResult.rows.length === 0) {
      throw notFoundError('Vehicle');
    }

    // Validate trip exists if provided
    if (trip_id) {
      const tripResult = await client.query(
        'SELECT id FROM trips WHERE id = $1',
        [trip_id]
      );

      if (tripResult.rows.length === 0) {
        throw notFoundError('Trip');
      }
    }

    // Create fuel log
    const fuelResult = await client.query(
      `INSERT INTO fuel_logs (
        vehicle_id, trip_id, liters, cost, fuel_date
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        vehicle_id,
        trip_id || null,
        liters,
        cost,
        fuel_date || new Date().toISOString().split('T')[0],
      ]
    );

    const fuelLog = fuelResult.rows[0];

    // Create corresponding Fuel expense
    await client.query(
      `INSERT INTO expenses (
        vehicle_id, trip_id, category, amount, description, expense_date
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        vehicle_id,
        trip_id || null,
        ExpenseCategory.FUEL,
        cost,
        'Fuel Log Entry',
        fuel_date || new Date().toISOString().split('T')[0],
      ]
    );

    await client.query('COMMIT');

    createdResponse(res, { 
      fuelLog,
      message: 'Fuel log created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
