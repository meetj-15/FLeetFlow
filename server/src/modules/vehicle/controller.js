import { query, getClient } from '../../config/db.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { notFoundError, businessRuleError, ErrorCodes } from '../../utils/errors.js';
import { VehicleStatus } from '../../utils/constants.js';

/**
 * Get all vehicles with optional filtering
 */
export const getAllVehicles = async (req, res, next) => {
  try {
    const { status, region, type, search } = req.query;

    let queryText = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      queryText += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (region) {
      paramCount++;
      queryText += ` AND region = $${paramCount}`;
      params.push(region);
    }

    if (type) {
      paramCount++;
      queryText += ` AND vehicle_type = $${paramCount}`;
      params.push(type);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (
        registration_no ILIKE $${paramCount} OR 
        vehicle_name ILIKE $${paramCount} OR
        model ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    successResponse(res, { vehicles: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vehicle by ID
 */
export const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw notFoundError('Vehicle');
    }

    successResponse(res, { vehicle: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new vehicle
 */
export const createVehicle = async (req, res, next) => {
  try {
    const {
      registration_no,
      vehicle_name,
      model,
      vehicle_type,
      region,
      max_load_capacity,
      odometer = 0,
      acquisition_cost = 0,
    } = req.body;

    const result = await query(
      `INSERT INTO vehicles (
        registration_no, vehicle_name, model, vehicle_type, region,
        max_load_capacity, odometer, acquisition_cost, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        registration_no,
        vehicle_name,
        model,
        vehicle_type,
        region,
        max_load_capacity,
        odometer,
        acquisition_cost,
        VehicleStatus.AVAILABLE,
      ]
    );

    createdResponse(res, { vehicle: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Update vehicle
 */
export const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      registration_no,
      vehicle_name,
      model,
      vehicle_type,
      region,
      max_load_capacity,
      odometer,
      acquisition_cost,
      status,
    } = req.body;

    // Check if vehicle exists
    const existingVehicle = await query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );

    if (existingVehicle.rows.length === 0) {
      throw notFoundError('Vehicle');
    }

    // Validate status transition if status is being changed
    if (status && status !== existingVehicle.rows[0].status) {
      // Business rule: Cannot change status arbitrarily
      // This validation can be expanded based on allowed transitions
      if (status === VehicleStatus.RETIRED) {
        // Check if vehicle is in active trip or maintenance
        const activeTrips = await query(
          `SELECT id FROM trips 
           WHERE vehicle_id = $1 AND status IN ('Draft', 'Dispatched')`,
          [id]
        );

        const activeMaintenance = await query(
          `SELECT id FROM maintenance_logs 
           WHERE vehicle_id = $1 AND status = 'Active'`,
          [id]
        );

        if (activeTrips.rows.length > 0 || activeMaintenance.rows.length > 0) {
          throw businessRuleError(
            ErrorCodes.RESOURCE_IN_USE,
            'Cannot retire vehicle with active trips or maintenance'
          );
        }
      }
    }

    const result = await query(
      `UPDATE vehicles SET
        registration_no = COALESCE($1, registration_no),
        vehicle_name = COALESCE($2, vehicle_name),
        model = COALESCE($3, model),
        vehicle_type = COALESCE($4, vehicle_type),
        region = COALESCE($5, region),
        max_load_capacity = COALESCE($6, max_load_capacity),
        odometer = COALESCE($7, odometer),
        acquisition_cost = COALESCE($8, acquisition_cost),
        status = COALESCE($9, status)
      WHERE id = $10
      RETURNING *`,
      [
        registration_no,
        vehicle_name,
        model,
        vehicle_type,
        region,
        max_load_capacity,
        odometer,
        acquisition_cost,
        status,
        id,
      ]
    );

    successResponse(res, { vehicle: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete vehicle (with restrictions)
 */
export const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const vehicle = await query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );

    if (vehicle.rows.length === 0) {
      throw notFoundError('Vehicle');
    }

    // Check for active trips
    const activeTrips = await query(
      `SELECT id FROM trips 
       WHERE vehicle_id = $1 AND status IN ('Draft', 'Dispatched')`,
      [id]
    );

    if (activeTrips.rows.length > 0) {
      throw businessRuleError(
        ErrorCodes.RESOURCE_IN_USE,
        'Cannot delete vehicle with active trips. Complete or cancel trips first.'
      );
    }

    // Check for active maintenance
    const activeMaintenance = await query(
      `SELECT id FROM maintenance_logs 
       WHERE vehicle_id = $1 AND status = 'Active'`,
      [id]
    );

    if (activeMaintenance.rows.length > 0) {
      throw businessRuleError(
        ErrorCodes.RESOURCE_IN_USE,
        'Cannot delete vehicle with active maintenance. Close maintenance first.'
      );
    }

    // Soft delete by setting status to Retired (preserving data integrity)
    await query(
      `UPDATE vehicles SET status = $1 WHERE id = $2`,
      [VehicleStatus.RETIRED, id]
    );

    successResponse(res, { 
      message: 'Vehicle retired successfully',
      vehicle_id: id 
    });
  } catch (error) {
    next(error);
  }
};
