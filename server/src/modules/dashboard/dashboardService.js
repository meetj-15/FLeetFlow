/**
 * Dashboard Service
 * Provides role-specific dashboard data aggregation
 */

import { query } from '../../config/db.js';
import { UserRoles, TripStatus, VehicleStatus, DriverStatus } from '../../utils/constants.js';

/**
 * Get dashboard data based on user role
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Role-specific dashboard data
 */
export const getDashboardData = async (userId, userRole) => {
  switch (userRole) {
    case UserRoles.FLEET_MANAGER:
      return await getFleetManagerDashboard();
    case UserRoles.DRIVER:
      return await getDriverDashboard(userId);
    case UserRoles.SAFETY_OFFICER:
      return await getSafetyOfficerDashboard();
    case UserRoles.FINANCIAL_ANALYST:
      return await getFinancialAnalystDashboard();
    default:
      throw new Error(`Invalid role: ${userRole}`);
  }
};

/**
 * Get Fleet Manager dashboard with comprehensive metrics
 * @returns {Promise<Object>} Fleet Manager dashboard data
 */
export const getFleetManagerDashboard = async () => {
  // Operational metrics
  const activeTripsResult = await query(
    `SELECT COUNT(*) as count FROM trips WHERE status = $1`,
    [TripStatus.DISPATCHED]
  );
  const activeTrips = parseInt(activeTripsResult.rows[0].count);

  const availableVehiclesResult = await query(
    `SELECT COUNT(*) as count FROM vehicles WHERE status = $1`,
    [VehicleStatus.AVAILABLE]
  );
  const availableVehicles = parseInt(availableVehiclesResult.rows[0].count);

  const vehiclesInShopResult = await query(
    `SELECT COUNT(*) as count FROM vehicles WHERE status = $1`,
    [VehicleStatus.IN_SHOP]
  );
  const vehiclesInShop = parseInt(vehiclesInShopResult.rows[0].count);

  const availableDriversResult = await query(
    `SELECT COUNT(*) as count FROM drivers WHERE status = $1`,
    [DriverStatus.AVAILABLE]
  );
  const availableDrivers = parseInt(availableDriversResult.rows[0].count);

  // Financial metrics
  const totalRevenueResult = await query(
    `SELECT COALESCE(SUM(revenue), 0) as total FROM trips WHERE status = $1`,
    [TripStatus.COMPLETED]
  );
  const totalRevenue = parseFloat(totalRevenueResult.rows[0].total);

  const totalExpensesResult = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses`
  );
  const totalExpenses = parseFloat(totalExpensesResult.rows[0].total);

  const netProfit = totalRevenue - totalExpenses;

  // Safety and compliance metrics
  const suspendedDriversResult = await query(
    `SELECT COUNT(*) as count FROM drivers WHERE status = $1`,
    [DriverStatus.SUSPENDED]
  );
  const suspendedDrivers = parseInt(suspendedDriversResult.rows[0].count);

  const expiringLicensesResult = await query(
    `SELECT COUNT(*) as count FROM drivers
     WHERE license_expiry > CURRENT_DATE
       AND license_expiry <= CURRENT_DATE + INTERVAL '30 days'`
  );
  const expiringLicenses = parseInt(expiringLicensesResult.rows[0].count);

  const expiredLicensesResult = await query(
    `SELECT COUNT(*) as count FROM drivers
     WHERE license_expiry <= CURRENT_DATE`
  );
  const expiredLicenses = parseInt(expiredLicensesResult.rows[0].count);

  // Active trips list with details
  const activeTripsListResult = await query(
    `SELECT 
       t.id,
       t.source,
       t.destination,
       t.status,
       t.dispatch_time,
       t.revenue,
       v.registration_no as vehicle_registration,
       v.vehicle_name,
       d.license_no as driver_license,
       u.name as driver_name
     FROM trips t
     LEFT JOIN vehicles v ON t.vehicle_id = v.id
     LEFT JOIN drivers d ON t.driver_id = d.id
     LEFT JOIN users u ON d.user_id = u.id
     WHERE t.status = $1
     ORDER BY t.dispatch_time DESC
     LIMIT 10`,
    [TripStatus.DISPATCHED]
  );
  const activeTripsList = activeTripsListResult.rows;

  // Vehicle ROI analysis
  const vehicleRoiResult = await query(
    `SELECT 
       v.id,
       v.registration_no,
       v.vehicle_name,
       COUNT(DISTINCT t.id) as total_trips,
       COALESCE(SUM(t.revenue), 0) as total_revenue,
       COALESCE(SUM(e.amount), 0) as total_expenses,
       COALESCE(SUM(t.revenue), 0) - COALESCE(SUM(e.amount), 0) as net_profit,
       CASE 
         WHEN v.acquisition_cost > 0 THEN 
           ROUND(((COALESCE(SUM(t.revenue), 0) - COALESCE(SUM(e.amount), 0)) / v.acquisition_cost * 100)::numeric, 2)
         ELSE 0
       END as roi_percentage
     FROM vehicles v
     LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = $1
     LEFT JOIN expenses e ON v.id = e.vehicle_id
     GROUP BY v.id, v.registration_no, v.vehicle_name, v.acquisition_cost
     ORDER BY net_profit DESC
     LIMIT 10`,
    [TripStatus.COMPLETED]
  );
  const vehicleRoi = vehicleRoiResult.rows;

  // License compliance alerts
  const licenseAlertsResult = await query(
    `SELECT 
       d.id,
       d.license_no,
       d.license_expiry,
       d.status,
       u.name as driver_name,
       u.email as driver_email,
       CASE 
         WHEN d.license_expiry <= CURRENT_DATE THEN 'expired'
         WHEN d.license_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
         ELSE 'valid'
       END as license_status
     FROM drivers d
     LEFT JOIN users u ON d.user_id = u.id
     WHERE d.license_expiry <= CURRENT_DATE + INTERVAL '30 days'
       OR d.status = $1
     ORDER BY d.license_expiry ASC`,
    [DriverStatus.SUSPENDED]
  );
  const licenseAlerts = licenseAlertsResult.rows;

  return {
    operational: {
      activeTrips,
      availableVehicles,
      vehiclesInShop,
      availableDrivers,
    },
    financial: {
      totalRevenue,
      totalExpenses,
      netProfit,
    },
    safety: {
      suspendedDrivers,
      expiringLicenses,
      expiredLicenses,
    },
    activeTripsList,
    vehicleRoi,
    licenseAlerts,
  };
};

/**
 * Get Driver dashboard with personal metrics only
 * @param {string} userId - Driver's user ID
 * @returns {Promise<Object>} Driver dashboard data
 */
export const getDriverDashboard = async (userId) => {
  // Find driver record by user_id
  const driverResult = await query(
    `SELECT id FROM drivers WHERE user_id = $1`,
    [userId]
  );

  if (driverResult.rows.length === 0) {
    throw new Error('Driver profile not found for this user');
  }

  const driverId = driverResult.rows[0].id;

  // Personal metrics
  const activeTripsResult = await query(
    `SELECT COUNT(*) as count FROM trips WHERE driver_id = $1 AND status = $2`,
    [driverId, TripStatus.DISPATCHED]
  );
  const activeTrips = parseInt(activeTripsResult.rows[0].count);

  const completedTripsResult = await query(
    `SELECT COUNT(*) as count FROM trips WHERE driver_id = $1 AND status = $2`,
    [driverId, TripStatus.COMPLETED]
  );
  const completedTrips = parseInt(completedTripsResult.rows[0].count);

  const personalRevenueResult = await query(
    `SELECT COALESCE(SUM(revenue), 0) as total FROM trips 
     WHERE driver_id = $1 AND status = $2`,
    [driverId, TripStatus.COMPLETED]
  );
  const personalRevenue = parseFloat(personalRevenueResult.rows[0].total);

  // Active trips list (driver's own trips only)
  const activeTripsListResult = await query(
    `SELECT 
       t.id,
       t.source,
       t.destination,
       t.status,
       t.dispatch_time,
       t.revenue,
       t.cargo_weight,
       v.registration_no as vehicle_registration,
       v.vehicle_name
     FROM trips t
     LEFT JOIN vehicles v ON t.vehicle_id = v.id
     WHERE t.driver_id = $1 AND t.status = $2
     ORDER BY t.dispatch_time DESC`,
    [driverId, TripStatus.DISPATCHED]
  );
  const activeTripsList = activeTripsListResult.rows;

  // Completed trips list (driver's own trips only)
  const completedTripsListResult = await query(
    `SELECT 
       t.id,
       t.source,
       t.destination,
       t.status,
       t.dispatch_time,
       t.completed_time,
       t.revenue,
       t.actual_distance,
       v.registration_no as vehicle_registration,
       v.vehicle_name
     FROM trips t
     LEFT JOIN vehicles v ON t.vehicle_id = v.id
     WHERE t.driver_id = $1 AND t.status = $2
     ORDER BY t.completed_time DESC
     LIMIT 10`,
    [driverId, TripStatus.COMPLETED]
  );
  const completedTripsList = completedTripsListResult.rows;

  return {
    personal: {
      activeTrips,
      completedTrips,
      personalRevenue,
    },
    activeTripsList,
    completedTripsList,
  };
};

/**
 * Get Safety Officer dashboard with compliance and maintenance metrics
 * @returns {Promise<Object>} Safety Officer dashboard data
 */
export const getSafetyOfficerDashboard = async () => {
  // Compliance metrics
  const totalDriversResult = await query(
    `SELECT COUNT(*) as count FROM drivers`
  );
  const totalDrivers = parseInt(totalDriversResult.rows[0].count);

  const availableDriversResult = await query(
    `SELECT COUNT(*) as count FROM drivers WHERE status = $1`,
    [DriverStatus.AVAILABLE]
  );
  const availableDrivers = parseInt(availableDriversResult.rows[0].count);

  const suspendedDriversResult = await query(
    `SELECT COUNT(*) as count FROM drivers WHERE status = $1`,
    [DriverStatus.SUSPENDED]
  );
  const suspendedDrivers = parseInt(suspendedDriversResult.rows[0].count);

  const expiredLicensesResult = await query(
    `SELECT COUNT(*) as count FROM drivers WHERE license_expiry <= CURRENT_DATE`
  );
  const expiredLicenses = parseInt(expiredLicensesResult.rows[0].count);

  const expiringLicensesResult = await query(
    `SELECT COUNT(*) as count FROM drivers
     WHERE license_expiry > CURRENT_DATE
       AND license_expiry <= CURRENT_DATE + INTERVAL '30 days'`
  );
  const expiringLicenses = parseInt(expiringLicensesResult.rows[0].count);

  // Maintenance metrics
  const activeMaintenanceResult = await query(
    `SELECT COUNT(*) as count FROM maintenance WHERE status = 'Active'`
  );
  const activeMaintenance = parseInt(activeMaintenanceResult.rows[0].count);

  const vehiclesInShopResult = await query(
    `SELECT COUNT(*) as count FROM vehicles WHERE status = $1`,
    [VehicleStatus.IN_SHOP]
  );
  const vehiclesInShop = parseInt(vehiclesInShopResult.rows[0].count);

  // License compliance details
  const licenseComplianceResult = await query(
    `SELECT 
       d.id,
       d.license_no,
       d.license_category,
       d.license_expiry,
       d.status,
       d.safety_score,
       u.name as driver_name,
       u.email as driver_email,
       CASE 
         WHEN d.license_expiry <= CURRENT_DATE THEN 'expired'
         WHEN d.license_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
         ELSE 'valid'
       END as license_status
     FROM drivers d
     LEFT JOIN users u ON d.user_id = u.id
     ORDER BY d.license_expiry ASC`
  );
  const licenseCompliance = licenseComplianceResult.rows;

  // Active maintenance list
  const activeMaintenanceListResult = await query(
    `SELECT 
       m.id,
       m.maintenance_type,
       m.description,
       m.status,
       m.start_date,
       m.cost,
       v.registration_no as vehicle_registration,
       v.vehicle_name
     FROM maintenance m
     LEFT JOIN vehicles v ON m.vehicle_id = v.id
     WHERE m.status = 'Active'
     ORDER BY m.start_date DESC`
  );
  const activeMaintenanceList = activeMaintenanceListResult.rows;

  // Driver safety scores
  const driverSafetyScoresResult = await query(
    `SELECT 
       d.id,
       d.license_no,
       d.safety_score,
       d.status,
       u.name as driver_name,
       COUNT(DISTINCT t.id) as total_trips
     FROM drivers d
     LEFT JOIN users u ON d.user_id = u.id
     LEFT JOIN trips t ON d.id = t.driver_id AND t.status = $1
     GROUP BY d.id, d.license_no, d.safety_score, d.status, u.name
     ORDER BY d.safety_score ASC
     LIMIT 10`,
    [TripStatus.COMPLETED]
  );
  const driverSafetyScores = driverSafetyScoresResult.rows;

  return {
    compliance: {
      totalDrivers,
      availableDrivers,
      suspendedDrivers,
      expiredLicenses,
      expiringLicenses,
    },
    maintenance: {
      activeMaintenance,
      vehiclesInShop,
    },
    licenseCompliance,
    activeMaintenanceList,
    driverSafetyScores,
  };
};

/**
 * Get Financial Analyst dashboard with revenue, expenses, and profitability metrics
 * @returns {Promise<Object>} Financial Analyst dashboard data
 */
export const getFinancialAnalystDashboard = async () => {
  // Revenue metrics
  const totalRevenueResult = await query(
    `SELECT COALESCE(SUM(revenue), 0) as total FROM trips WHERE status = $1`,
    [TripStatus.COMPLETED]
  );
  const totalRevenue = parseFloat(totalRevenueResult.rows[0].total);

  const totalTripsResult = await query(
    `SELECT COUNT(*) as count FROM trips WHERE status = $1`,
    [TripStatus.COMPLETED]
  );
  const totalTrips = parseInt(totalTripsResult.rows[0].count);

  const avgRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;

  // Expense metrics
  const totalExpensesResult = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses`
  );
  const totalExpenses = parseFloat(totalExpensesResult.rows[0].total);

  const expensesByCategoryResult = await query(
    `SELECT 
       category,
       COALESCE(SUM(amount), 0) as total,
       COUNT(*) as count
     FROM expenses
     GROUP BY category
     ORDER BY total DESC`
  );
  const expensesByCategory = expensesByCategoryResult.rows;

  // Profitability
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Revenue by vehicle
  const revenueByVehicleResult = await query(
    `SELECT 
       v.id,
       v.registration_no,
       v.vehicle_name,
       COUNT(DISTINCT t.id) as total_trips,
       COALESCE(SUM(t.revenue), 0) as total_revenue,
       COALESCE(AVG(t.revenue), 0) as avg_revenue_per_trip
     FROM vehicles v
     LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = $1
     GROUP BY v.id, v.registration_no, v.vehicle_name
     HAVING COUNT(DISTINCT t.id) > 0
     ORDER BY total_revenue DESC
     LIMIT 10`,
    [TripStatus.COMPLETED]
  );
  const revenueByVehicle = revenueByVehicleResult.rows;

  // Recent expenses
  const recentExpensesResult = await query(
    `SELECT 
       e.id,
       e.category,
       e.amount,
       e.description,
       e.expense_date,
       v.registration_no as vehicle_registration,
       t.source as trip_source,
       t.destination as trip_destination
     FROM expenses e
     LEFT JOIN vehicles v ON e.vehicle_id = v.id
     LEFT JOIN trips t ON e.trip_id = t.id
     ORDER BY e.expense_date DESC
     LIMIT 10`
  );
  const recentExpenses = recentExpensesResult.rows;

  // Vehicle profitability (ROI)
  const vehicleProfitabilityResult = await query(
    `SELECT 
       v.id,
       v.registration_no,
       v.vehicle_name,
       v.acquisition_cost,
       COUNT(DISTINCT t.id) as total_trips,
       COALESCE(SUM(t.revenue), 0) as total_revenue,
       COALESCE(SUM(e.amount), 0) as total_expenses,
       COALESCE(SUM(t.revenue), 0) - COALESCE(SUM(e.amount), 0) as net_profit,
       CASE 
         WHEN v.acquisition_cost > 0 THEN 
           ROUND(((COALESCE(SUM(t.revenue), 0) - COALESCE(SUM(e.amount), 0)) / v.acquisition_cost * 100)::numeric, 2)
         ELSE 0
       END as roi_percentage
     FROM vehicles v
     LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = $1
     LEFT JOIN expenses e ON v.id = e.vehicle_id
     GROUP BY v.id, v.registration_no, v.vehicle_name, v.acquisition_cost
     ORDER BY net_profit DESC
     LIMIT 10`,
    [TripStatus.COMPLETED]
  );
  const vehicleProfitability = vehicleProfitabilityResult.rows;

  return {
    revenue: {
      totalRevenue,
      totalTrips,
      avgRevenuePerTrip,
    },
    expenses: {
      totalExpenses,
      expensesByCategory,
    },
    profitability: {
      netProfit,
      profitMargin,
    },
    revenueByVehicle,
    recentExpenses,
    vehicleProfitability,
  };
};
