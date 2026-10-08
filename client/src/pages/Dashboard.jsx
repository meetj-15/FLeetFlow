import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getDashboardMetrics } from '../api/dashboard';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const fmt = (n) =>
  n === undefined || n === null
    ? '—'
    : parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getDashboardMetrics();
      setData(result);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={load} className="btn-retry">Retry</button>
      </div>
    );
  }

  const { kpis, activeTrips, vehicleStatus, recentCompletedTrips, expensesByCategory, monthlyRevenue, vehicleROI } = data;

  const monthlyData = [...(monthlyRevenue || [])].reverse().map((m) => ({
    name: new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: parseFloat(m.revenue),
    trips: m.trip_count,
  }));

  return (
    <div className="dashboard">
      {/* KPI Row */}
      <div className="kpi-grid">
        <KpiCard title="Active Trips"        value={kpis.activeTrips}           icon="🗺️"  color="primary" />
        <KpiCard title="Available Vehicles"  value={kpis.availableVehicles}     icon="🚚"  color="success" />
        <KpiCard title="Vehicles In Shop"    value={kpis.vehiclesInShop}        icon="🔧"  color="warning" />
        <KpiCard title="Total Revenue"       value={`$${fmt(kpis.totalRevenue)}`} icon="💰" color="success" />
        <KpiCard title="Total Expenses"      value={`$${fmt(kpis.totalExpenses)}`} icon="📊" color="danger" />
        <KpiCard title="Net Profit"          value={`$${fmt(kpis.netProfit)}`}  icon="📈"  color={kpis.netProfit >= 0 ? 'success' : 'danger'} />
      </div>

      {/* Licence / driver warnings */}
      {(kpis.expiredLicences > 0 || kpis.expiringLicences > 0 || kpis.suspendedDrivers > 0) && (
        <div className="dashboard-alerts">
          {kpis.expiredLicences > 0 && (
            <div className="dash-alert dash-alert-danger">
              ⚠ <strong>{kpis.expiredLicences}</strong> driver{kpis.expiredLicences > 1 ? 's have' : ' has'} an <strong>expired licence</strong> — cannot be dispatched.
            </div>
          )}
          {kpis.expiringLicences > 0 && (
            <div className="dash-alert dash-alert-warning">
              ⚡ <strong>{kpis.expiringLicences}</strong> driver licence{kpis.expiringLicences > 1 ? 's expire' : ' expires'} within 30 days — renewal required.
            </div>
          )}
          {kpis.suspendedDrivers > 0 && (
            <div className="dash-alert dash-alert-warning">
              🚫 <strong>{kpis.suspendedDrivers}</strong> driver{kpis.suspendedDrivers > 1 ? 's are' : ' is'} currently <strong>suspended</strong>.
            </div>
          )}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Active Trips Table */}
        <div className="dash-card wide">
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
