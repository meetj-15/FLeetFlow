import { query, getClient } from '../../config/db.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { notFoundError, businessRuleError, ErrorCodes, forbiddenError } from '../../utils/errors.js';
import { TripStatus, VehicleStatus, DriverStatus, UserRoles } from '../../utils/constants.js';
import { isDispatchEligible } from '../driver/driverValidation.js';

/**
 * Get all trips with optional filtering
 * Implements data isolation: Drivers can only see their own trips
 */
export const getAllTrips = async (req, res, next) => {
  try {
    const { status, vehicle_id, driver_id } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let queryText = `
      SELECT 
        t.*,
        v.registration_no as vehicle_registration,
        v.vehicle_name,
        d.license_no as driver_license,
        u.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Data isolation: Drivers can only see their own trips
    if (userRole === UserRoles.DRIVER) {
      // Get driver_id from user_id
      const driverResult = await query(
        'SELECT id FROM drivers WHERE user_id = $1',
        [userId]
      );
      
      if (driverResult.rows.length === 0) {
        throw notFoundError('Driver profile not found for this user');
      }
      
      const userDriverId = driverResult.rows[0].id;
      paramCount++;
      queryText += ` AND t.driver_id = $${paramCount}`;
      params.push(userDriverId);
    }

    if (status) {
      paramCount++;
      queryText += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (vehicle_id) {
      paramCount++;
      queryText += ` AND t.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
    }

    if (driver_id) {
      paramCount++;
      queryText += ` AND t.driver_id = $${paramCount}`;
      params.push(driver_id);
    }

    queryText += ' ORDER BY t.created_at DESC';

    const result = await query(queryText, params);

    successResponse(res, { trips: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trip by ID
 * Implements data isolation: Drivers can only view their own trips
 */
export const getTripById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        t.*,
        v.registration_no as vehicle_registration,
        v.vehicle_name,
        v.vehicle_type,
        d.license_no as driver_license,
        d.user_id as driver_user_id,
        u.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw notFoundError('Trip');
    }

    const trip = result.rows[0];

    // Data isolation: Drivers can only view their own trips
    if (userRole === UserRoles.DRIVER && trip.driver_user_id !== userId) {
      throw forbiddenError('You can only view your own trips');
    }

    successResponse(res, { trip });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new trip
 * Implements data isolation: Drivers can only create trips for themselves
 */
export const createTrip = async (req, res, next) => {
  try {
    const {
      vehicle_id,
      driver_id,
      source,
      destination,
      cargo_weight,
      planned_distance,
      revenue = 0,
      scheduled_date,
    } = req.body;

    const userRole = req.user.role;
    const userId = req.user.id;

    // Data isolation: Drivers can only create trips for themselves
    if (userRole === UserRoles.DRIVER) {
      // Get driver's profile
      const driverResult = await query(
        'SELECT id FROM drivers WHERE user_id = $1',
        [userId]
      );
      
      if (driverResult.rows.length === 0) {
        throw notFoundError('Driver profile not found for this user');
      }
      
      const userDriverId = driverResult.rows[0].id;
      
      // Verify driver is trying to create trip for themselves
      if (driver_id !== userDriverId) {
        throw forbiddenError('Drivers can only create trips for themselves');
      }
    }

    // Validate cargo capacity
    const vehicleResult = await query(
      'SELECT max_load_capacity FROM vehicles WHERE id = $1',
      [vehicle_id]
    );

    if (vehicleResult.rows.length === 0) {
      throw notFoundError('Vehicle');
    }

    const { max_load_capacity } = vehicleResult.rows[0];

    if (cargo_weight > max_load_capacity) {
      throw businessRuleError(
        ErrorCodes.CARGO_EXCEEDS_CAPACITY,
        `Cargo weight (${cargo_weight}) exceeds vehicle capacity (${max_load_capacity})`
      );
    }

    // Validate driver exists
    const driverResult = await query(
      'SELECT id FROM drivers WHERE id = $1',
      [driver_id]
    );

    if (driverResult.rows.length === 0) {
      throw notFoundError('Driver');
    }

    const result = await query(
      `INSERT INTO trips (
        vehicle_id, driver_id, source, destination, cargo_weight,
        planned_distance, revenue, scheduled_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        vehicle_id,
        driver_id,
        source,
        destination,
        cargo_weight,
        planned_distance,
        revenue,
        scheduled_date || null,
        TripStatus.DRAFT,
      ]
    );

    createdResponse(res, { trip: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispatch trip (critical transaction with row locking)
 */
export const dispatchTrip = async (req, res, next) => {
  const client = await getClient();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Lock and fetch trip
    const tripResult = await client.query(
      'SELECT * FROM trips WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (tripResult.rows.length === 0) {
      throw notFoundError('Trip');
    }

    const trip = tripResult.rows[0];

    // Verify trip is in Draft status
    if (trip.status !== TripStatus.DRAFT) {
      throw businessRuleError(
        ErrorCodes.INVALID_STATUS,
        `Cannot dispatch trip with status: ${trip.status}. Trip must be in Draft status.`
      );
    }

    // Lock and fetch vehicle
    const vehicleResult = await client.query(
      'SELECT * FROM vehicles WHERE id = $1 FOR UPDATE',
      [trip.vehicle_id]
    );

    if (vehicleResult.rows.length === 0) {
      throw notFoundError('Vehicle');
    }

    const vehicle = vehicleResult.rows[0];

    // Validate vehicle availability (catches On Trip, In Shop, Retired)
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      const reason =
        vehicle.status === VehicleStatus.RETIRED  ? 'Vehicle has been retired' :
        vehicle.status === VehicleStatus.ON_TRIP  ? 'Vehicle is already on a trip' :
        vehicle.status === VehicleStatus.IN_SHOP  ? 'Vehicle is currently in the workshop' :
        `Vehicle is not available (status: ${vehicle.status})`;
      throw businessRuleError(ErrorCodes.VEHICLE_UNAVAILABLE, reason);
    }

    // Re-validate cargo weight in case vehicle capacity changed since trip creation
    if (parseFloat(trip.cargo_weight) > parseFloat(vehicle.max_load_capacity)) {
      throw businessRuleError(
        ErrorCodes.CARGO_EXCEEDS_CAPACITY,
        `Cargo weight (${trip.cargo_weight}t) exceeds vehicle capacity (${vehicle.max_load_capacity}t)`
      );
    }

    // Lock and fetch driver
    const driverResult = await client.query(
      'SELECT * FROM drivers WHERE id = $1 FOR UPDATE',
      [trip.driver_id]
    );

    if (driverResult.rows.length === 0) {
      throw notFoundError('Driver');
    }

    const driver = driverResult.rows[0];

    // Validate driver dispatch eligibility (license expiry + status)
    const eligibility = isDispatchEligible(driver);
    if (!eligibility.eligible) {
      throw businessRuleError(eligibility.code, eligibility.message);
    }

    // Update trip to Dispatched
    await client.query(
      `UPDATE trips SET
        status = $1,
        dispatch_time = CURRENT_TIMESTAMP,
        start_odometer = $2
      WHERE id = $3`,
      [TripStatus.DISPATCHED, vehicle.odometer, id]
    );

    // Update vehicle to On Trip
    await client.query(
      'UPDATE vehicles SET status = $1 WHERE id = $2',
      [VehicleStatus.ON_TRIP, trip.vehicle_id]
    );

    // Update driver to On Trip
    await client.query(
      'UPDATE drivers SET status = $1 WHERE id = $2',
      [DriverStatus.ON_TRIP, trip.driver_id]
    );

    await client.query('COMMIT');

    // Fetch updated trip
    const updatedTrip = await query(
      'SELECT * FROM trips WHERE id = $1',
      [id]
    );

    successResponse(res, { 
      trip: updatedTrip.rows[0],
      message: 'Trip dispatched successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Complete trip (transaction)
 */
export const completeTrip = async (req, res, next) => {
  const client = await getClient();

  try {
    const { id } = req.params;
    const { actual_distance, end_odometer } = req.body;

    if (!actual_distance || !end_odometer) {
      throw businessRuleError(
        ErrorCodes.VALIDATION_ERROR,
        'Actual distance and end odometer are required to complete trip'
      );
    }

    await client.query('BEGIN');

    // Lock and fetch trip
    const tripResult = await client.query(
      'SELECT * FROM trips WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (tripResult.rows.length === 0) {
      throw notFoundError('Trip');
    }

    const trip = tripResult.rows[0];

    // Verify trip is Dispatched
    if (trip.status !== TripStatus.DISPATCHED) {
      throw businessRuleError(
        ErrorCodes.INVALID_STATUS,
        `Cannot complete trip with status: ${trip.status}. Trip must be Dispatched.`
      );
    }

    // Update trip to Completed
    await client.query(
      `UPDATE trips SET
        status = $1,
        actual_distance = $2,
        end_odometer = $3,
        completed_time = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [TripStatus.COMPLETED, actual_distance, end_odometer, id]
    );

    // Update vehicle - set to Available and update odometer
    await client.query(
      `UPDATE vehicles SET
        status = $1,
        odometer = $2
      WHERE id = $3`,
      [VehicleStatus.AVAILABLE, end_odometer, trip.vehicle_id]
    );

    // Update driver to Available
    await client.query(
      'UPDATE drivers SET status = $1 WHERE id = $2',
      [DriverStatus.AVAILABLE, trip.driver_id]
    );

    await client.query('COMMIT');

    // Fetch updated trip
    const updatedTrip = await query(
      'SELECT * FROM trips WHERE id = $1',
      [id]
    );

    successResponse(res, { 
      trip: updatedTrip.rows[0],
      message: 'Trip completed successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Cancel trip (transaction)
 */
export const cancelTrip = async (req, res, next) => {
  const client = await getClient();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Lock and fetch trip
    const tripResult = await client.query(
      'SELECT * FROM trips WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (tripResult.rows.length === 0) {
      throw notFoundError('Trip');
    }

    const trip = tripResult.rows[0];

    // Verify trip can be cancelled (Draft or Dispatched)
    if (trip.status !== TripStatus.DRAFT && trip.status !== TripStatus.DISPATCHED) {
      throw businessRuleError(
        ErrorCodes.INVALID_STATUS,
        `Cannot cancel trip with status: ${trip.status}`
      );
    }

    // Update trip to Cancelled
    await client.query(
      `UPDATE trips SET
        status = $1,
        cancelled_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [TripStatus.CANCELLED, id]
    );

    // If trip was dispatched, release resources
    if (trip.status === TripStatus.DISPATCHED) {
      // Release vehicle
      await client.query(
        'UPDATE vehicles SET status = $1 WHERE id = $2',
        [VehicleStatus.AVAILABLE, trip.vehicle_id]
      );

      // Release driver
      await client.query(
        'UPDATE drivers SET status = $1 WHERE id = $2',
        [DriverStatus.AVAILABLE, trip.driver_id]
      );
    }

    await client.query('COMMIT');

    // Fetch updated trip
    const updatedTrip = await query(
      'SELECT * FROM trips WHERE id = $1',
      [id]
    );

    successResponse(res, { 
      trip: updatedTrip.rows[0],
      message: 'Trip cancelled successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
