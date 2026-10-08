import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getDashboardMetrics } from '../../api/dashboard';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import './FleetManagerDashboard.css';

const COLORS = ['#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const fmt = (n) =>
  n === undefined || n === null
    ? '—'
    : parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const FleetManagerDashboard = () => {
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

  const vehicleStatusData = (vehicleStatus || []).map((vs) => ({
    name: vs.status,
    value: parseInt(vs.count),
  }));

  return (
    <div className="fleet-manager-dashboard">
      <div className="dashboard-header">
        <h1>Fleet Manager Dashboard</h1>
        <p className="dashboard-subtitle">Comprehensive fleet operations overview</p>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <KpiCard title="Active Trips" value={kpis.activeTrips} icon="🗺️" color="primary" />
        <KpiCard title="Available Vehicles" value={kpis.availableVehicles} icon="🚚" color="success" />
        <KpiCard title="Vehicles In Shop" value={kpis.vehiclesInShop} icon="🔧" color="warning" />
        <KpiCard title="Total Revenue" value={`$${fmt(kpis.totalRevenue)}`} icon="💰" color="success" />
        <KpiCard title="Total Expenses" value={`$${fmt(kpis.totalExpenses)}`} icon="📊" color="danger" />
        <KpiCard title="Net Profit" value={`$${fmt(kpis.netProfit)}`} icon="📈" color={kpis.netProfit >= 0 ? 'success' : 'danger'} />
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

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => window.location.href = '/trips'}>
            🚚 Create Trip
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/vehicles'}>
            🚙 Add Vehicle
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/drivers'}>
            👤 Add Driver
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Active Trips Table */}
        <div className="dash-card wide">
          <h2>Active Trips</h2>
          {activeTrips && activeTrips.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td>{trip.vehicle_registration || 'N/A'}</td>
                      <td>{trip.driver_name || 'N/A'}</td>
                      <td>{trip.source} → {trip.destination}</td>
                      <td><StatusBadge status={trip.status} /></td>
                      <td>{new Date(trip.dispatch_time).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No active trips</p>
          )}
        </div>

        {/* Monthly Revenue Chart */}
        <div className="dash-card">
          <h2>Monthly Revenue (Last 6 Months)</h2>
          {monthlyData && monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">No revenue data available</p>
          )}
        </div>

        {/* Fleet Status Pie Chart */}
        <div className="dash-card">
          <h2>Fleet Status Distribution</h2>
          {vehicleStatusData && vehicleStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.name}
                  dataKey="value"
                >
                  {vehicleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">No vehicle status data available</p>
          )}
        </div>

        {/* Vehicle Profitability Table */}
        <div className="dash-card wide">
          <h2>Vehicle Profitability (Top 10)</h2>
          {vehicleROI && vehicleROI.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Trips</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Net Profit</th>
                    <th>ROI %</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleROI.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.registration_no}</td>
                      <td>{vehicle.total_trips}</td>
                      <td>${fmt(vehicle.total_revenue)}</td>
                      <td>${fmt(vehicle.total_expenses)}</td>
                      <td className={parseFloat(vehicle.net_profit) >= 0 ? 'profit-positive' : 'profit-negative'}>
                        ${fmt(vehicle.net_profit)}
                      </td>
                      <td className={parseFloat(vehicle.roi_percentage) >= 0 ? 'profit-positive' : 'profit-negative'}>
                        {vehicle.roi_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No profitability data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetManagerDashboard;
