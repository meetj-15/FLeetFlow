import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRoles } from '../utils/constants';
import FleetManagerDashboard from './dashboards/FleetManagerDashboard';
import DriverDashboard from './dashboards/DriverDashboard';
import SafetyOfficerDashboard from './dashboards/SafetyOfficerDashboard';
import FinancialAnalystDashboard from './dashboards/FinancialAnalystDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case UserRoles.FLEET_MANAGER:
      return <FleetManagerDashboard />;
    case UserRoles.DRIVER:
      return <DriverDashboard />;
    case UserRoles.SAFETY_OFFICER:
      return <SafetyOfficerDashboard />;
    case UserRoles.FINANCIAL_ANALYST:
      return <FinancialAnalystDashboard />;
    default:
      return (
        <div className="dashboard-error">
          <p>Invalid user role: {user.role}</p>
        </div>
      );
  }
};

export default Dashboard;
          <h3 className="dash-card-title">Active Trips</h3>
          {activeTrips.length === 0 ? (
            <p className="dash-empty">No active trips</p>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrips.map((t) => (
                    <tr key={t.id}>
                      <td>{t.source} → {t.destination}</td>
                      <td>{t.vehicle_registration} <span className="dash-sub">{t.vehicle_name}</span></td>
                      <td>{t.driver_name || t.driver_license}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>
                        {t.dispatch_time
                          ? new Date(t.dispatch_time).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monthly Revenue Chart */}
        {monthlyData.length > 0 && (
          <div className="dash-card">
            <h3 className="dash-card-title">Monthly Revenue (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Vehicle Status Pie */}
        <div className="dash-card">
          <h3 className="dash-card-title">Fleet Status</h3>
          {vehicleStatus.length === 0 ? (
            <p className="dash-empty">No vehicles</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={vehicleStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                  labelLine={false}
                >
                  {vehicleStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expenses by Category */}
        {expensesByCategory.length > 0 && (
          <div className="dash-card">
            <h3 className="dash-card-title">Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expensesByCategory} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Completed Trips */}
        <div className="dash-card">
          <h3 className="dash-card-title">Recent Completed Trips</h3>
          {recentCompletedTrips.length === 0 ? (
            <p className="dash-empty">No completed trips yet</p>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Revenue</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompletedTrips.map((t) => (
                    <tr key={t.id}>
                      <td>{t.source} → {t.destination}</td>
                      <td>{t.vehicle_registration}</td>
                      <td className="revenue">${fmt(t.revenue)}</td>
                      <td>
                        {t.completed_time
                          ? new Date(t.completed_time).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Vehicle ROI */}
        {vehicleROI.length > 0 && (
          <div className="dash-card wide">
            <h3 className="dash-card-title">Vehicle Profitability</h3>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Trips</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Net Profit</th>
                    <th>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleROI.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.registration_no}</strong><br />
                        <span className="dash-sub">{v.vehicle_name}</span>
                      </td>
                      <td>{v.completed_trips}</td>
                      <td>${fmt(v.total_revenue)}</td>
                      <td>${fmt(v.total_expenses)}</td>
                      <td className={v.net_profit >= 0 ? 'profit-pos' : 'profit-neg'}>
                        ${fmt(v.net_profit)}
                      </td>
                      <td>{v.roi_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
