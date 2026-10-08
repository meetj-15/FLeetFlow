import express from 'express';
import { body, query as validateQuery } from 'express-validator';
import {
  getAllDrivers,
  getAvailableDrivers,
  getDriverById,
  createDriver,
  updateDriver,
} from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../middleware/validator.js';
import { DRIVER_READ_ROLES, DRIVER_WRITE_ROLES, SAFETY_SCORE_MIN, SAFETY_SCORE_MAX } from '../../utils/constants.js';

const router = express.Router();

/**
 * @route   GET /api/drivers
 * @desc    Get all drivers with optional filtering
 * @access  Private (Fleet Manager, Safety Officer)
 */
router.get(
  '/',
  authenticate,
  authorize(...DRIVER_READ_ROLES),
  [
    validateQuery('status').optional().trim(),
    validateQuery('search').optional().trim(),
  ],
  asyncHandler(getAllDrivers)
);

/**
 * @route   GET /api/drivers/available
 * @desc    Get available drivers (valid license, not on trip, not suspended)
 * @access  Private (Fleet Manager, Safety Officer)
 */
router.get(
  '/available',
  authenticate,
  authorize(...DRIVER_READ_ROLES),
  asyncHandler(getAvailableDrivers)
);

/**
 * @route   GET /api/drivers/:id
 * @desc    Get driver by ID
 * @access  Private (Fleet Manager, Safety Officer)
 */
router.get(
  '/:id',
  authenticate,
  authorize(...DRIVER_READ_ROLES),
  asyncHandler(getDriverById)
);

/**
 * @route   POST /api/drivers
 * @desc    Create new driver
 * @access  Private (Fleet Manager, Safety Officer)
 */
router.post(
  '/',
  authenticate,
  authorize(...DRIVER_WRITE_ROLES),
  [
    body('user_id')
      .optional()
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    body('license_no')
      .trim()
      .notEmpty()
      .withMessage('License number is required')
      .isLength({ max: 50 })
      .withMessage('License number must not exceed 50 characters'),
    body('license_category')
      .trim()
      .notEmpty()
      .withMessage('License category is required')
      .isLength({ max: 50 })
      .withMessage('License category must not exceed 50 characters'),
    body('license_expiry')
      .notEmpty()
      .withMessage('License expiry date is required')
      .isISO8601()
      .withMessage('License expiry must be a valid date'),
    body('phone')
      .optional()
      .trim()
      .isLength({ min: 10, max: 20 })
      .withMessage('Phone number must be between 10 and 20 characters'),
    body('safety_score')
      .optional()
      .isInt({ min: SAFETY_SCORE_MIN, max: SAFETY_SCORE_MAX })
      .withMessage(`Safety score must be between ${SAFETY_SCORE_MIN} and ${SAFETY_SCORE_MAX}`),
    validate,
  ],
  asyncHandler(createDriver)
);

/**
 * @route   PUT /api/drivers/:id
 * @desc    Update driver
 * @access  Private (Fleet Manager, Safety Officer)
 */
router.put(
  '/:id',
  authenticate,
  authorize(...DRIVER_WRITE_ROLES),
  [
    body('license_no')
      .optional()
      .trim()
      .isLength({ max: 50 }),
    body('license_category')
      .optional()
      .trim()
      .isLength({ max: 50 }),
    body('license_expiry')
      .optional()
      .isISO8601()
      .withMessage('License expiry must be a valid date'),
    body('phone')
      .optional()
      .trim()
      .isLength({ min: 10, max: 20 })
      .withMessage('Phone number must be between 10 and 20 characters'),
    body('safety_score')
      .optional()
      .isInt({ min: SAFETY_SCORE_MIN, max: SAFETY_SCORE_MAX })
      .withMessage(`Safety score must be between ${SAFETY_SCORE_MIN} and ${SAFETY_SCORE_MAX}`),
    body('status')
      .optional()
      .trim(),
    validate,
  ],
  asyncHandler(updateDriver)
);

export default router;
