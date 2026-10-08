import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardMetrics } from '../../api/dashboard';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import './DriverDashboard.css';

const fmt = (n) =>
  n === undefined || n === null
    ? '—'
    : parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DriverDashboard = () => {
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
        <p>Loading your dashboard...</p>
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

  const { personal } = data;

  if (!personal) {
    return (
      <div className="dashboard-error">
        <p>No personal data available</p>
      </div>
    );
  }

  const { activeTrips, completedTrips, personalRevenue, activeTripsList, completedTripsList } = personal;

  // Aggregate completed trips by month for chart
  const monthlyCompletions = {};
  (completedTripsList || []).forEach((trip) => {
    const monthKey = new Date(trip.completed_time).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyCompletions[monthKey] = (monthlyCompletions[monthKey] || 0) + 1;
  });

  const completionChartData = Object.keys(monthlyCompletions).map((month) => ({
    name: month,
    trips: monthlyCompletions[month],
  }));

  return (
    <div className="driver-dashboard">
      <div className="dashboard-header">
        <h1>My Dashboard</h1>
        <p className="dashboard-subtitle">Your personal trip performance and activity</p>
      </div>

      {/* Personal KPIs */}
      <div className="kpi-grid">
        <KpiCard title="My Active Trips" value={activeTrips || 0} icon="🗺️" color="primary" />
        <KpiCard title="My Completed Trips" value={completedTrips || 0} icon="✅" color="success" />
        <KpiCard title="My Total Revenue" value={`$${fmt(personalRevenue || 0)}`} icon="💰" color="success" />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => window.location.href = '/trips'}>
            🚚 View My Trips
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/fuel'}>
            ⛽ Log Fuel
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* My Active Trips */}
        <div className="dash-card wide">
          <h2>My Active Trips</h2>
          {activeTripsList && activeTripsList.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Dispatched</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTripsList.map((trip) => (
                    <tr key={trip.id}>
                      <td>{trip.vehicle_registration || 'N/A'}</td>
                      <td>{trip.source} → {trip.destination}</td>
                      <td><StatusBadge status={trip.status} /></td>
                      <td>{new Date(trip.dispatch_time).toLocaleDateString()}</td>
                      <td>${fmt(trip.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No active trips</p>
          )}
        </div>

        {/* My Recent Completed Trips */}
        <div className="dash-card wide">
          <h2>My Recent Completed Trips (Last 10)</h2>
          {completedTripsList && completedTripsList.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Route</th>
                    <th>Completed</th>
                    <th>Distance</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTripsList.map((trip) => (
                    <tr key={trip.id}>
                      <td>{trip.vehicle_registration || 'N/A'}</td>
                      <td>{trip.source} → {trip.destination}</td>
                      <td>{new Date(trip.completed_time).toLocaleDateString()}</td>
                      <td>{trip.actual_distance} km</td>
                      <td>${fmt(trip.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No completed trips</p>
          )}
        </div>

        {/* Trip Completion Trend */}
        {completionChartData && completionChartData.length > 0 && (
          <div className="dash-card">
            <h2>My Trip Completions</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completionChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="trips" stroke="#14b8a6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
