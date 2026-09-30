import express from 'express';
import { body, query as validateQuery } from 'express-validator';
import {
  getAllTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../middleware/validator.js';
import { TRIP_WRITE_ROLES } from '../../utils/constants.js';

const router = express.Router();

/**
 * @route   GET /api/trips
 * @desc    Get all trips with optional filtering
 * @access  Private (Authenticated)
 */
router.get(
  '/',
  authenticate,
  [
    validateQuery('status').optional().trim(),
    validateQuery('vehicle_id').optional().isUUID(),
    validateQuery('driver_id').optional().isUUID(),
  ],
  asyncHandler(getAllTrips)
);

/**
 * @route   GET /api/trips/:id
 * @desc    Get trip by ID
 * @access  Private (Authenticated)
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(getTripById)
);

/**
 * @route   POST /api/trips
 * @desc    Create new trip
 * @access  Private (Fleet Manager, Driver)
 */
router.post(
  '/',
  authenticate,
  authorize(...TRIP_WRITE_ROLES),
  [
    body('vehicle_id')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),
    body('driver_id')
      .notEmpty()
      .withMessage('Driver ID is required')
      .isUUID()
      .withMessage('Driver ID must be a valid UUID'),
    body('source')
      .trim()
      .notEmpty()
      .withMessage('Source is required')
      .isLength({ max: 255 }),
    body('destination')
      .trim()
      .notEmpty()
      .withMessage('Destination is required')
      .isLength({ max: 255 }),
    body('cargo_weight')
      .notEmpty()
      .withMessage('Cargo weight is required')
      .isFloat({ gt: 0 })
      .withMessage('Cargo weight must be greater than 0'),
    body('planned_distance')
      .notEmpty()
      .withMessage('Planned distance is required')
      .isFloat({ gt: 0 })
      .withMessage('Planned distance must be greater than 0'),
    body('revenue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Revenue must be 0 or greater'),
    body('scheduled_date')
      .optional()
      .isISO8601()
      .withMessage('Scheduled date must be a valid date'),
    validate,
  ],
  asyncHandler(createTrip)
);

/**
 * @route   POST /api/trips/:id/dispatch
 * @desc    Dispatch a trip
 * @access  Private (Fleet Manager, Driver)
 */
router.post(
  '/:id/dispatch',
  authenticate,
  authorize(...TRIP_WRITE_ROLES),
  asyncHandler(dispatchTrip)
);

/**
 * @route   POST /api/trips/:id/complete
 * @desc    Complete a trip
 * @access  Private (Fleet Manager, Driver)
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize(...TRIP_WRITE_ROLES),
  [
    body('actual_distance')
      .notEmpty()
      .withMessage('Actual distance is required')
      .isFloat({ gt: 0 })
      .withMessage('Actual distance must be greater than 0'),
    body('end_odometer')
      .notEmpty()
      .withMessage('End odometer is required')
      .isFloat({ min: 0 })
      .withMessage('End odometer must be 0 or greater'),
    validate,
  ],
  asyncHandler(completeTrip)
);

/**
 * @route   POST /api/trips/:id/cancel
 * @desc    Cancel a trip
 * @access  Private (Fleet Manager, Driver)
 */
router.post(
  '/:id/cancel',
  authenticate,
  authorize(...TRIP_WRITE_ROLES),
  asyncHandler(cancelTrip)
);

export default router;
