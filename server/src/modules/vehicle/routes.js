import express from 'express';
import { body, query as validateQuery } from 'express-validator';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../middleware/validator.js';
import { VEHICLE_WRITE_ROLES } from '../../utils/constants.js';

const router = express.Router();

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with optional filtering
 * @access  Private (Authenticated)
 */
router.get(
  '/',
  authenticate,
  [
    validateQuery('status').optional().trim(),
    validateQuery('region').optional().trim(),
    validateQuery('type').optional().trim(),
    validateQuery('search').optional().trim(),
  ],
  asyncHandler(getAllVehicles)
);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Private (Authenticated)
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(getVehicleById)
);

/**
 * @route   POST /api/vehicles
 * @desc    Create new vehicle
 * @access  Private (Fleet Manager)
 */
router.post(
  '/',
  authenticate,
  authorize(...VEHICLE_WRITE_ROLES),
  [
    body('registration_no')
      .trim()
      .notEmpty()
      .withMessage('Registration number is required')
      .isLength({ max: 50 })
      .withMessage('Registration number must not exceed 50 characters'),
    body('vehicle_name')
      .trim()
      .notEmpty()
      .withMessage('Vehicle name is required')
      .isLength({ max: 255 })
      .withMessage('Vehicle name must not exceed 255 characters'),
    body('model')
      .optional()
      .trim()
      .isLength({ max: 255 }),
    body('vehicle_type')
      .trim()
      .notEmpty()
      .withMessage('Vehicle type is required'),
    body('region')
      .trim()
      .notEmpty()
      .withMessage('Region is required'),
    body('max_load_capacity')
      .notEmpty()
      .withMessage('Maximum load capacity is required')
      .isFloat({ gt: 0 })
      .withMessage('Maximum load capacity must be greater than 0'),
    body('odometer')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Odometer must be 0 or greater'),
    body('acquisition_cost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Acquisition cost must be 0 or greater'),
    validate,
  ],
  asyncHandler(createVehicle)
);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update vehicle
 * @access  Private (Fleet Manager)
 */
router.put(
  '/:id',
  authenticate,
  authorize(...VEHICLE_WRITE_ROLES),
  [
    body('registration_no')
      .optional()
      .trim()
      .isLength({ max: 50 }),
    body('vehicle_name')
      .optional()
      .trim()
      .isLength({ max: 255 }),
    body('model')
      .optional()
      .trim()
      .isLength({ max: 255 }),
    body('vehicle_type')
      .optional()
      .trim(),
    body('region')
      .optional()
      .trim(),
    body('max_load_capacity')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Maximum load capacity must be greater than 0'),
    body('odometer')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Odometer must be 0 or greater'),
    body('acquisition_cost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Acquisition cost must be 0 or greater'),
    body('status')
      .optional()
      .trim(),
    validate,
  ],
  asyncHandler(updateVehicle)
);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete/retire vehicle
 * @access  Private (Fleet Manager)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(...VEHICLE_WRITE_ROLES),
  asyncHandler(deleteVehicle)
);

export default router;
