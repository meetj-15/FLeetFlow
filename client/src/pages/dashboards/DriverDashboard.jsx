import React, { useState, useEffect } from 'react';
import { getDashboardMetrics } from '../../api/dashboard';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/dashboard.css';

const fmt = (n) =>
  n === undefined || n === null
    ? '—'
    : parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DriverDashboard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setData(await getDashboardMetrics());
    } catch {
      setError('Failed to load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="dash-full-loading">
      <div className="dash-spinner" />
      <p>Loading your dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="dash-full-error">
      <p>{error}</p>
      <button className="dash-retry-btn" onClick={load}>Retry</button>
    </div>
  );

  if (!data) return null;

  // API shape: { personal, activeTripsList, completedTripsList }
  const personal           = data.personal          || {};
  const activeTripsList    = data.activeTripsList    || [];
  const completedTripsList = data.completedTripsList || [];

  const { activeTrips = 0, completedTrips = 0, personalRevenue = 0 } = personal;

  return (
    <div className="dash-root">
      {/* Header */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h1>My Dashboard</h1>
          <p>Your personal trip performance and activity</p>
        </div>
        <button className="dash-refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* Personal KPIs */}
      <div className="dash-kpi-grid">
        <KpiCard title="Active Trips"     value={activeTrips}               icon="🗺️" color="primary" />
        <KpiCard title="Completed Trips"  value={completedTrips}            icon="✅" color="success" />
        <KpiCard title="My Total Revenue" value={`$${fmt(personalRevenue)}`} icon="💰" color="success" />
      </div>

      {/* Quick actions */}
      <div className="dash-actions-card">
        <p className="dash-actions-title">⚡ Quick Actions</p>
        <div className="dash-action-btns">
          <button className="dash-btn dash-btn-primary" onClick={() => window.location.href = '/trips'}>🚚 My Trips</button>
          <button className="dash-btn dash-btn-ghost"   onClick={() => window.location.href = '/fuel'}>⛽ Log Fuel</button>
        </div>
      </div>

      {/* Grid */}
      <div className="dash-grid">

        {/* Active trips */}
        <div className="dash-card dash-col-12">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">🗺️</span> My Active Trips</h2>
            {activeTripsList.length > 0 && (
              <span className="dash-card-badge">{activeTripsList.length} active</span>
            )}
          </div>
          {activeTripsList.length > 0 ? (
            <div className="dash-table-wrap">
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
                  {activeTripsList.map(trip => (
                    <tr key={trip.id}>
                      <td><strong>{trip.vehicle_registration || '—'}</strong></td>
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
            <div className="dash-empty">
              <span className="dash-empty-icon">🗺️</span>
              <span className="dash-empty-text">No active trips right now</span>
            </div>
          )}
        </div>

        {/* Completed trips */}
        <div className="dash-card dash-col-12">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">✅</span> Recent Completed Trips</h2>
            <span className="dash-card-badge">Last 10</span>
          </div>
          {completedTripsList.length > 0 ? (
            <div className="dash-table-wrap">
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
                  {completedTripsList.map(trip => (
                    <tr key={trip.id}>
                      <td><strong>{trip.vehicle_registration || '—'}</strong></td>
                      <td>{trip.source} → {trip.destination}</td>
                      <td>{new Date(trip.completed_time).toLocaleDateString()}</td>
                      <td>{trip.actual_distance ? `${trip.actual_distance} km` : '—'}</td>
                      <td className="text-profit">${fmt(trip.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">✅</span>
              <span className="dash-empty-text">No completed trips yet</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DriverDashboard;
