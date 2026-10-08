/**
 * Dashboard Routes
 * API endpoints for role-specific dashboard data
 */

import express from 'express';
import { getDashboard } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/validator.js';
import { DASHBOARD_READ_ROLES } from '../../utils/constants.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get role-specific dashboard data
 * @access  Private (All roles: Fleet Manager, Driver, Safety Officer, Financial Analyst)
 */
router.get(
  '/',
  authenticate,
  authorize(...DASHBOARD_READ_ROLES),
  asyncHandler(getDashboard)
);

export default router;
