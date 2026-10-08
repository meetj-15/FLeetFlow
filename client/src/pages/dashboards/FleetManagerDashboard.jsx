import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getDashboardMetrics } from '../../api/dashboard';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/dashboard.css';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const FleetManagerDashboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setData(await getDashboardMetrics());
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="dash-full-loading">
      <div className="dash-spinner" />
      <p>Loading dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="dash-full-error">
      <p>{error}</p>
      <button className="dash-retry-btn" onClick={load}>Retry</button>
    </div>
  );

  if (!data) return null;

  // API shape: { operational, financial, safety, activeTripsList, vehicleRoi, licenseAlerts }
  const operational    = data.operational    || {};
  const safety         = data.safety         || {};
  const activeTripsList = data.activeTripsList || [];
  const vehicleRoi     = data.vehicleRoi      || [];

  // Vehicle status chart derived from operational counts
  const vehicleStatusData = [
    { name: 'Available', value: operational.availableVehicles || 0 },
    { name: 'On Trip',   value: operational.activeTrips       || 0 },
    { name: 'In Shop',   value: operational.vehiclesInShop    || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="dash-root">
      {/* Header */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h1>Fleet Operations</h1>
          <p>Real-time overview of your fleet's operational status</p>
        </div>
        <button className="dash-refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* Operational KPIs only — no financials, no safety scores */}
      <div className="dash-kpi-grid">
        <KpiCard title="Active Trips"       value={operational.activeTrips        ?? '—'} icon="🗺️" color="primary" />
        <KpiCard title="Available Vehicles" value={operational.availableVehicles  ?? '—'} icon="🚚" color="success" />
        <KpiCard title="Vehicles In Shop"   value={operational.vehiclesInShop     ?? '—'} icon="🔧" color="warning" />
        <KpiCard title="Available Drivers"  value={operational.availableDrivers   ?? '—'} icon="👤" color="info"    />
      </div>

      {/* Compliance banners (read-only, no detail) */}
      {(safety.expiredLicenses > 0 || safety.expiringLicenses > 0 || safety.suspendedDrivers > 0) && (
        <div className="dash-alerts">
          {safety.expiredLicenses > 0 && (
            <div className="dash-alert dash-alert-danger">
              <span className="dash-alert-icon">⚠️</span>
              <span><strong>{safety.expiredLicenses}</strong> driver{safety.expiredLicenses > 1 ? 's have' : ' has'} an expired licence — contact the Safety Officer.</span>
            </div>
          )}
          {safety.expiringLicenses > 0 && (
            <div className="dash-alert dash-alert-warning">
              <span className="dash-alert-icon">⏰</span>
              <span><strong>{safety.expiringLicenses}</strong> licence{safety.expiringLicenses > 1 ? 's expire' : ' expires'} within 30 days — contact the Safety Officer.</span>
            </div>
          )}
          {safety.suspendedDrivers > 0 && (
            <div className="dash-alert dash-alert-warning">
              <span className="dash-alert-icon">🚫</span>
              <span><strong>{safety.suspendedDrivers}</strong> driver{safety.suspendedDrivers > 1 ? 's are' : ' is'} currently suspended.</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="dash-actions-card">
        <p className="dash-actions-title">⚡ Quick Actions</p>
        <div className="dash-action-btns">
          <button className="dash-btn dash-btn-primary"  onClick={() => window.location.href = '/trips'}>🗺️ Create Trip</button>
          <button className="dash-btn dash-btn-teal"     onClick={() => window.location.href = '/vehicles'}>🚚 Add Vehicle</button>
          <button className="dash-btn dash-btn-ghost"    onClick={() => window.location.href = '/drivers'}>👤 Manage Drivers</button>
          <button className="dash-btn dash-btn-ghost"    onClick={() => window.location.href = '/maintenance'}>🔧 Maintenance</button>
        </div>
      </div>

      {/* Main grid */}
      <div className="dash-grid">

        {/* Active trips table */}
        <div className="dash-card dash-col-8">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">🗺️</span> Active Trips</h2>
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
                    <th>Driver</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTripsList.map(trip => (
                    <tr key={trip.id}>
                      <td><strong>{trip.vehicle_registration || '—'}</strong></td>
                      <td>{trip.driver_name || '—'}</td>
                      <td>{trip.source} → {trip.destination}</td>
                      <td><StatusBadge status={trip.status} /></td>
                      <td>{new Date(trip.dispatch_time).toLocaleDateString()}</td>
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

        {/* Fleet status pie */}
        <div className="dash-card dash-col-4">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">🚚</span> Fleet Status</h2>
          </div>
          {vehicleStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={vehicleStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {vehicleStatusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">🚚</span>
              <span className="dash-empty-text">No vehicle data</span>
            </div>
          )}
        </div>

        {/* Vehicle trips summary */}
        <div className="dash-card dash-col-12">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">📋</span> Vehicle Trip Summary</h2>
          </div>
          {vehicleRoi.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Total Trips</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleRoi.map(v => (
                    <tr key={v.id}>
                      <td><strong>{v.registration_no}</strong><br /><span style={{fontSize:'12px',color:'#94a3b8'}}>{v.vehicle_name}</span></td>
                      <td>{v.total_trips}</td>
                      <td><StatusBadge status={v.total_trips > 0 ? 'Active' : 'Idle'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">📋</span>
              <span className="dash-empty-text">No vehicle data available</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FleetManagerDashboard;
