import { query } from '../../config/db.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { notFoundError } from '../../utils/errors.js';

/**
 * Get all expenses with optional filtering
 */
export const getAllExpenses = async (req, res, next) => {
  try {
    const { category, vehicle_id, trip_id, start_date, end_date } = req.query;

    let queryText = `
      SELECT 
        e.*,
        v.registration_no as vehicle_registration,
        v.vehicle_name,
        t.source,
        t.destination
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN trips t ON e.trip_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      queryText += ` AND e.category = $${paramCount}`;
      params.push(category);
    }

    if (vehicle_id) {
      paramCount++;
      queryText += ` AND e.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
    }

    if (trip_id) {
      paramCount++;
      queryText += ` AND e.trip_id = $${paramCount}`;
      params.push(trip_id);
    }

    if (start_date) {
      paramCount++;
      queryText += ` AND e.expense_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      queryText += ` AND e.expense_date <= $${paramCount}`;
      params.push(end_date);
    }

    queryText += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const result = await query(queryText, params);

    // Calculate total
    const total = result.rows.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    successResponse(res, { 
      expenses: result.rows,
      summary: {
        total_expenses: total,
        count: result.rows.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expense by ID
 */
export const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        e.*,
        v.registration_no as vehicle_registration,
        v.vehicle_name,
        t.source,
        t.destination
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN trips t ON e.trip_id = t.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw notFoundError('Expense');
    }

    successResponse(res, { expense: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Create manual expense
 */
export const createExpense = async (req, res, next) => {
  try {
    const {
      vehicle_id,
      trip_id,
      category,
      amount,
      description,
      expense_date,
    } = req.body;

    // Validate vehicle exists if provided
    if (vehicle_id) {
      const vehicleResult = await query(
        'SELECT id FROM vehicles WHERE id = $1',
        [vehicle_id]
      );

      if (vehicleResult.rows.length === 0) {
        throw notFoundError('Vehicle');
      }
    }

    // Validate trip exists if provided
    if (trip_id) {
      const tripResult = await query(
        'SELECT id FROM trips WHERE id = $1',
        [trip_id]
      );

      if (tripResult.rows.length === 0) {
        throw notFoundError('Trip');
      }
    }

    const result = await query(
      `INSERT INTO expenses (
        vehicle_id, trip_id, category, amount, description, expense_date
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        vehicle_id || null,
        trip_id || null,
        category,
        amount,
        description || null,
        expense_date || new Date().toISOString().split('T')[0],
      ]
    );

    createdResponse(res, { expense: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
