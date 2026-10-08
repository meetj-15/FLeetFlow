import { query } from '../../config/db.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { notFoundError, validationError } from '../../utils/errors.js';
import { DriverStatus } from '../../utils/constants.js';
import { validateDriver } from './driverValidation.js';

/**
 * Get all drivers with optional filtering
 */
export const getAllDrivers = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let queryText = `
      SELECT d.*, u.name as user_name, u.email as user_email
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      queryText += ` AND d.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (
        d.license_no ILIKE $${paramCount} OR
        d.phone ILIKE $${paramCount} OR
        u.name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    queryText += ' ORDER BY d.created_at DESC';

    const result = await query(queryText, params);

    successResponse(res, { drivers: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available drivers (not on trip, not suspended, valid license)
 */
export const getAvailableDrivers = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT d.*, u.name as user_name, u.email as user_email
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.status = $1
        AND d.license_expiry > CURRENT_DATE
      ORDER BY d.safety_score DESC, d.created_at ASC
    `, [DriverStatus.AVAILABLE]);

    successResponse(res, { drivers: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * Get driver by ID
 */
export const getDriverById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT d.*, u.name as user_name, u.email as user_email
      FROM drivers d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw notFoundError('Driver');
    }

    successResponse(res, { driver: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new driver
 */
export const createDriver = async (req, res, next) => {
  try {
    const {
      user_id,
      license_no,
      license_category,
      license_expiry,
      phone,
      safety_score = 100,
    } = req.body;

    // Validate driver data
    const validation = validateDriver({
      license_no,
      license_category,
      license_expiry,
      safety_score
    });

    if (!validation.valid) {
      const errorMessage = validation.errors.map(e => e.message).join(', ');
      throw validationError(errorMessage, validation.errors);
    }

    const result = await query(
      `INSERT INTO drivers (
        user_id, license_no, license_category, license_expiry,
        phone, safety_score, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        user_id || null,
        license_no,
        license_category,
        license_expiry,
        phone || null,
        safety_score,
        DriverStatus.AVAILABLE,
      ]
    );

    createdResponse(res, { driver: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Update driver
 */
export const updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      license_no,
      license_category,
      license_expiry,
      phone,
      safety_score,
      status,
    } = req.body;

    // Check if driver exists
    const existingDriver = await query(
      'SELECT * FROM drivers WHERE id = $1',
      [id]
    );

    if (existingDriver.rows.length === 0) {
      throw notFoundError('Driver');
    }

    // Validate driver data (only validate fields that are being updated)
    const dataToValidate = {};
    if (license_no !== undefined) dataToValidate.license_no = license_no;
    if (license_category !== undefined) dataToValidate.license_category = license_category;
    if (license_expiry !== undefined) dataToValidate.license_expiry = license_expiry;
    if (safety_score !== undefined) dataToValidate.safety_score = safety_score;

    const validation = validateDriver(dataToValidate);

    if (!validation.valid) {
      const errorMessage = validation.errors.map(e => e.message).join(', ');
      throw validationError(errorMessage, validation.errors);
    }

    const result = await query(
      `UPDATE drivers SET
        license_no = COALESCE($1, license_no),
        license_category = COALESCE($2, license_category),
        license_expiry = COALESCE($3, license_expiry),
        phone = COALESCE($4, phone),
        safety_score = COALESCE($5, safety_score),
        status = COALESCE($6, status)
      WHERE id = $7
      RETURNING *`,
      [
        license_no,
        license_category,
        license_expiry,
        phone,
        safety_score,
        status,
        id,
      ]
    );

    successResponse(res, { driver: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
