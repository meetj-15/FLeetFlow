import express from 'express';
import { getDashboardMetrics } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/validator.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard metrics and KPIs
 * @access  Private (Authenticated)
 */
router.get(
  '/',
  authenticate,
  asyncHandler(getDashboardMetrics)
);

export default router;
