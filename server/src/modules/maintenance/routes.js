import express from 'express';
import { body, query as validateQuery } from 'express-validator';
import {
  getAllMaintenance,
  getMaintenanceById,
  openMaintenance,
  closeMaintenance,
} from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../middleware/validator.js';
import { MAINTENANCE_WRITE_ROLES } from '../../utils/constants.js';

const router = express.Router();

/**
 * @route   GET /api/maintenance
 * @desc    Get all maintenance logs with optional filtering
 * @access  Private (Authenticated)
 */
router.get(
  '/',
  authenticate,
  [
    validateQuery('status').optional().trim(),
    validateQuery('vehicle_id').optional().isUUID(),
  ],
  asyncHandler(getAllMaintenance)
);

/**
 * @route   GET /api/maintenance/:id
 * @desc    Get maintenance log by ID
 * @access  Private (Authenticated)
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(getMaintenanceById)
);

/**
 * @route   POST /api/maintenance
 * @desc    Open new maintenance
 * @access  Private (Fleet Manager, Safety Officer)
 */
router.post(
  '/',
  authenticate,
  authorize(...MAINTENANCE_WRITE_ROLES),
  [
    body('vehicle_id')
      .notEmpty()
      .withMessage('Vehicle ID is required')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),
    body('maintenance_type')
      .trim()
      .notEmpty()
      .withMessage('Maintenance type is required')
      .isLength({ max: 100 }),
    body('description')
      .optional()
      .trim(),
    body('cost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost must be 0 or greater'),
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    validate,
  ],
  asyncHandler(openMaintenance)
);

/**
 * @route   PUT /api/maintenance/:id/close
 * @desc    Close maintenance
 * @access  Private (Fleet Manager, Safety Officer)
 */
router.put(
  '/:id/close',
  authenticate,
  authorize(...MAINTENANCE_WRITE_ROLES),
  [
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    validate,
  ],
  asyncHandler(closeMaintenance)
);

export default router;
