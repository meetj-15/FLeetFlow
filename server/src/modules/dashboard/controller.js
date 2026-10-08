/**
 * Dashboard Controller
 * Handles HTTP requests for role-specific dashboard data
 */

import { getDashboardData } from './dashboardService.js';
import { successResponse } from '../../utils/response.js';

/**
 * Get dashboard data based on authenticated user's role
 * @route GET /api/dashboard
 * @access Private (All authenticated users)
 */
export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const dashboardData = await getDashboardData(userId, userRole);

    successResponse(res, {
      role: userRole,
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};
