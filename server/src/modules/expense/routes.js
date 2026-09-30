import express from 'express';
import { body, query as validateQuery } from 'express-validator';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
} from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../middleware/validator.js';
import { EXPENSE_READ_ROLES, EXPENSE_WRITE_ROLES, ExpenseCategory } from '../../utils/constants.js';

const router = express.Router();

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses with optional filtering
 * @access  Private (Fleet Manager, Financial Analyst)
 */
router.get(
  '/',
  authenticate,
  authorize(...EXPENSE_READ_ROLES),
  [
    validateQuery('category').optional().trim(),
    validateQuery('vehicle_id').optional().isUUID(),
    validateQuery('trip_id').optional().isUUID(),
    validateQuery('start_date').optional().isISO8601(),
    validateQuery('end_date').optional().isISO8601(),
  ],
  asyncHandler(getAllExpenses)
);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private (Fleet Manager, Financial Analyst)
 */
router.get(
  '/:id',
  authenticate,
  authorize(...EXPENSE_READ_ROLES),
  asyncHandler(getExpenseById)
);

/**
 * @route   POST /api/expenses
 * @desc    Create manual expense
 * @access  Private (Fleet Manager, Financial Analyst)
 */
router.post(
  '/',
  authenticate,
  authorize(...EXPENSE_WRITE_ROLES),
  [
    body('vehicle_id')
      .optional()
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),
    body('trip_id')
      .optional()
      .isUUID()
      .withMessage('Trip ID must be a valid UUID'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(Object.values(ExpenseCategory))
      .withMessage(`Category must be one of: ${Object.values(ExpenseCategory).join(', ')}`),
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0 })
      .withMessage('Amount must be 0 or greater'),
    body('description')
      .optional()
      .trim(),
    body('expense_date')
      .optional()
      .isISO8601()
      .withMessage('Expense date must be a valid date'),
    validate,
  ],
  asyncHandler(createExpense)
);

export default router;
