import { query } from '../../config/db.js';
import { successResponse } from '../../utils/response.js';
import { TripStatus, VehicleStatus, DriverStatus } from '../../utils/constants.js';

/**
 * Get dashboard metrics and KPIs
 */
export const getDashboardMetrics = async (req, res, next) => {
  try {
    // Active trips count
    const activeTripsResult = await query(
      `SELECT COUNT(*) as count FROM trips WHERE status IN ($1, $2)`,
      [TripStatus.DRAFT, TripStatus.DISPATCHED]
    );
    const activeTrips = parseInt(activeTripsResult.rows[0].count);

    // Available vehicles count
    const availableVehiclesResult = await query(
      `SELECT COUNT(*) as count FROM vehicles WHERE status = $1`,
      [VehicleStatus.AVAILABLE]
    );
    const availableVehicles = parseInt(availableVehiclesResult.rows[0].count);

    // Vehicles in shop count
    const inShopVehiclesResult = await query(
      `SELECT COUNT(*) as count FROM vehicles WHERE status = $1`,
      [VehicleStatus.IN_SHOP]
    );
    const vehiclesInShop = parseInt(inShopVehiclesResult.rows[0].count);

    // Suspended drivers count
    const suspendedDriversResult = await query(
      `SELECT COUNT(*) as count FROM drivers WHERE status = $1`,
      [DriverStatus.SUSPENDED]
    );
    const suspendedDrivers = parseInt(suspendedDriversResult.rows[0].count);

    // Drivers with licence expiring within 30 days (not yet expired)
    const expiringLicencesResult = await query(
      `SELECT COUNT(*) as count FROM drivers
       WHERE license_expiry > CURRENT_DATE
         AND license_expiry <= CURRENT_DATE + INTERVAL '30 days'`
    );
    const expiringLicences = parseInt(expiringLicencesResult.rows[0].count);

    // Drivers with already-expired licences
    const expiredLicencesResult = await query(
      `SELECT COUNT(*) as count FROM drivers
       WHERE license_expiry <= CURRENT_DATE`
    );
    const expiredLicences = parseInt(expiredLicencesResult.rows[0].count);

    // Completed trips revenue
    const revenueResult = await query(
      `SELECT COALESCE(SUM(revenue), 0) as total_revenue 
       FROM trips WHERE status = $1`,
      [TripStatus.COMPLETED]
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);

    // Total expenses
    const expensesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses`
    );
    const totalExpenses = parseFloat(expensesResult.rows[0].total_expenses);

    // Net profit
    const netProfit = totalRevenue - totalExpenses;

    // Active trips with details
    const activeTripsListResult = await query(`
      SELECT 
        t.id,
        t.source,
        t.destination,
        t.status,
        t.dispatch_time,
        v.registration_no as vehicle_registration,
        v.vehicle_name,
        d.license_no as driver_license,
        u.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE t.status IN ($1, $2)
      ORDER BY t.dispatch_time DESC NULLS LAST, t.created_at DESC
      LIMIT 10
    `, [TripStatus.DRAFT, TripStatus.DISPATCHED]);

    // Vehicle utilization by status
    const vehicleStatusResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM vehicles
      GROUP BY status
      ORDER BY count DESC
    `);

    // Recent completed trips
    const recentTripsResult = await query(`
      SELECT 
        t.id,
        t.source,
        t.destination,
        t.revenue,
        t.completed_time,
        v.registration_no as vehicle_registration
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.status = $1
      ORDER BY t.completed_time DESC
      LIMIT 5
    `, [TripStatus.COMPLETED]);

    // Per-vehicle profitability/ROI
    const vehicleROIResult = await query(`
      SELECT 
        v.id,
        v.registration_no,
        v.vehicle_name,
        v.acquisition_cost,
        COALESCE(SUM(t.revenue), 0) as total_revenue,
        COALESCE(
          (SELECT SUM(e.amount) 
           FROM expenses e 
           WHERE e.vehicle_id = v.id), 
          0
        ) as total_expenses,
        COALESCE(SUM(t.revenue), 0) - COALESCE(
          (SELECT SUM(e.amount) 
           FROM expenses e 
           WHERE e.vehicle_id = v.id), 
          0
        ) as net_profit,
        COUNT(t.id) FILTER (WHERE t.status = $1) as completed_trips
      FROM vehicles v
      LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = $1
      GROUP BY v.id, v.registration_no, v.vehicle_name, v.acquisition_cost
      ORDER BY net_profit DESC
      LIMIT 10
    `, [TripStatus.COMPLETED]);

    // Calculate ROI percentage for each vehicle
    const vehicleROI = vehicleROIResult.rows.map(v => ({
      ...v,
      roi_percentage: v.acquisition_cost > 0 
        ? ((parseFloat(v.net_profit) / parseFloat(v.acquisition_cost)) * 100).toFixed(2)
        : 0,
      total_revenue: parseFloat(v.total_revenue),
      total_expenses: parseFloat(v.total_expenses),
      net_profit: parseFloat(v.net_profit),
      acquisition_cost: parseFloat(v.acquisition_cost),
      completed_trips: parseInt(v.completed_trips),
    }));

    // Expenses by category
    const expensesByCategoryResult = await query(`
      SELECT 
        category,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM expenses
      GROUP BY category
      ORDER BY total DESC
    `);

    const expensesByCategory = expensesByCategoryResult.rows.map(e => ({
      category: e.category,
      total: parseFloat(e.total),
      count: parseInt(e.count),
    }));

    // Monthly revenue trend (last 6 months)
    const monthlyRevenueResult = await query(`
      SELECT 
        DATE_TRUNC('month', completed_time) as month,
        COALESCE(SUM(revenue), 0) as revenue,
        COUNT(*) as trip_count
      FROM trips
      WHERE status = $1 
        AND completed_time >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', completed_time)
      ORDER BY month DESC
    `, [TripStatus.COMPLETED]);

    const monthlyRevenue = monthlyRevenueResult.rows.map(m => ({
      month: m.month,
      revenue: parseFloat(m.revenue),
      trip_count: parseInt(m.trip_count),
    }));

    successResponse(res, {
      kpis: {
        activeTrips,
        availableVehicles,
        vehiclesInShop,
        totalRevenue,
        totalExpenses,
        netProfit,
        suspendedDrivers,
        expiringLicences,
        expiredLicences,
      },
      activeTrips: activeTripsListResult.rows,
      vehicleStatus: vehicleStatusResult.rows.map(v => ({
        status: v.status,
        count: parseInt(v.count),
      })),
      recentCompletedTrips: recentTripsResult.rows.map(t => ({
        ...t,
        revenue: parseFloat(t.revenue),
      })),
      vehicleROI,
      expensesByCategory,
      monthlyRevenue,
    });
  } catch (error) {
    next(error);
  }
};
