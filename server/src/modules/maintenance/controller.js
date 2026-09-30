import { query, getClient } from '../../config/db.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { notFoundError, businessRuleError, ErrorCodes } from '../../utils/errors.js';
import { MaintenanceStatus, VehicleStatus, ExpenseCategory } from '../../utils/constants.js';

/**
 * Get all maintenance logs with optional filtering
 */
export const getAllMaintenance = async (req, res, next) => {
  try {
    const { status, vehicle_id } = req.query;

    let queryText = `
      SELECT 
        m.*,
        v.registration_no as vehicle_registration,
        v.vehicle_name
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      queryText += ` AND m.status = $${paramCount}`;
      params.push(status);
    }

    if (vehicle_id) {
      paramCount++;
      queryText += ` AND m.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
    }

    queryText += ' ORDER BY m.start_date DESC, m.created_at DESC';

    const result = await query(queryText, params);

    successResponse(res, { maintenance: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get maintenance log by ID
 */
export const getMaintenanceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        m.*,
        v.registration_no as vehicle_registration,
        v.vehicle_name,
        v.status as vehicle_status
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw notFoundError('Maintenance log');
    }

    successResponse(res, { maintenance: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Open maintenance (create with transaction to update vehicle and create expense)
 */
export const openMaintenance = async (req, res, next) => {
  const client = await getClient();

  try {
    const {
      vehicle_id,
      maintenance_type,
      description,
      cost,
      start_date,
    } = req.body;

    await client.query('BEGIN');

    // Lock and fetch vehicle
    const vehicleResult = await client.query(
      'SELECT * FROM vehicles WHERE id = $1 FOR UPDATE',
      [vehicle_id]
    );

    if (vehicleResult.rows.length === 0) {
      throw notFoundError('Vehicle');
    }

    const vehicle = vehicleResult.rows[0];

    // Business rule: Cannot open maintenance for vehicle on trip
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw businessRuleError(
        ErrorCodes.VEHICLE_ON_TRIP,
        'Cannot open maintenance for vehicle that is on a trip'
      );
    }

    // Create maintenance log
    const maintenanceResult = await client.query(
      `INSERT INTO maintenance_logs (
        vehicle_id, maintenance_type, description, cost, start_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        vehicle_id,
        maintenance_type,
        description || null,
        cost || 0,
        start_date || new Date().toISOString().split('T')[0],
        MaintenanceStatus.ACTIVE,
      ]
    );

    const maintenance = maintenanceResult.rows[0];

    // Update vehicle to In Shop
    await client.query(
      'UPDATE vehicles SET status = $1 WHERE id = $2',
      [VehicleStatus.IN_SHOP, vehicle_id]
    );

    // Create corresponding Maintenance expense
    await client.query(
      `INSERT INTO expenses (
        vehicle_id, category, amount, description, expense_date
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        vehicle_id,
        ExpenseCategory.MAINTENANCE,
        cost || 0,
        `${maintenance_type} - Maintenance Record`,
        start_date || new Date().toISOString().split('T')[0],
      ]
    );

    await client.query('COMMIT');

    createdResponse(res, { 
      maintenance,
      message: 'Maintenance opened successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Close maintenance (transaction)
 */
export const closeMaintenance = async (req, res, next) => {
  const client = await getClient();

  try {
    const { id } = req.params;
    const { end_date } = req.body;

    await client.query('BEGIN');

    // Lock and fetch maintenance
    const maintenanceResult = await client.query(
      'SELECT * FROM maintenance_logs WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (maintenanceResult.rows.length === 0) {
      throw notFoundError('Maintenance log');
    }

    const maintenance = maintenanceResult.rows[0];

    // Verify maintenance is Active
    if (maintenance.status !== MaintenanceStatus.ACTIVE) {
      throw businessRuleError(
        ErrorCodes.INVALID_STATUS,
        `Cannot close maintenance with status: ${maintenance.status}`
      );
    }

    // Update maintenance to Completed
    await client.query(
      `UPDATE maintenance_logs SET
        status = $1,
        end_date = $2
      WHERE id = $3`,
      [
        MaintenanceStatus.COMPLETED,
        end_date || new Date().toISOString().split('T')[0],
        id,
      ]
    );

    // Fetch vehicle to check if it's retired
    const vehicleResult = await client.query(
      'SELECT status FROM vehicles WHERE id = $1',
      [maintenance.vehicle_id]
    );

    const vehicle = vehicleResult.rows[0];

    // Return vehicle to Available (unless it's Retired)
    if (vehicle.status !== VehicleStatus.RETIRED) {
      await client.query(
        'UPDATE vehicles SET status = $1 WHERE id = $2',
        [VehicleStatus.AVAILABLE, maintenance.vehicle_id]
      );
    }

    await client.query('COMMIT');

    // Fetch updated maintenance
    const updatedMaintenance = await query(
      'SELECT * FROM maintenance_logs WHERE id = $1',
      [id]
    );

    successResponse(res, { 
      maintenance: updatedMaintenance.rows[0],
      message: 'Maintenance closed successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
