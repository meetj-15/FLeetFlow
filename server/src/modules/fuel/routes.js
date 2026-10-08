import express from 'express';
import { body, query as validateQuery } from 'express-validator';
import {
  getAllFuelLogs,
  getFuelLogById,
  createFuelLog,
} from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../middleware/validator.js';
import { FUEL_WRITE_ROLES } from '../../utils/constants.js';

const router = express.Router();

/**
 * @route   GET /api/fuel
 * @desc    Get all fuel logs with optional filtering
 * @access  Private (Authenticated)
 */
router.get(
  '/',
  authenticate,
  [
    validateQuery('vehicle_id').optional().isUUID(),
    validateQuery('trip_id').optional().isUUID(),
    validate,
  ],
  asyncHandler(getAllFuelLogs)
);

/**
 * @route   GET /api/fuel/:id
 * @desc    Get fuel log by ID
 * @access  Private (Authenticated)
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(getFuelLogById)
);

/**
 * @route   POST /api/fuel
 * @desc    Create fuel log
 * @access  Private (Fleet Manager, Driver)
 */
router.post(
  '/',
  authenticate,
  authorize(...FUEL_WRITE_ROLES),
  [
    body('vehicle_id')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),
    body('trip_id')
      .optional()
      .isUUID()
      .withMessage('Trip ID must be a valid UUID'),
    body('liters')
      .notEmpty()
      .withMessage('Liters is required')
      .isFloat({ gt: 0 })
      .withMessage('Liters must be greater than 0'),
    body('cost')
      .notEmpty()
      .withMessage('Cost is required')
      .isFloat({ min: 0 })
      .withMessage('Cost must be 0 or greater'),
    body('fuel_date')
      .optional()
      .isISO8601()
      .withMessage('Fuel date must be a valid date'),
    validate,
  ],
  asyncHandler(createFuelLog)
);

export default router;
