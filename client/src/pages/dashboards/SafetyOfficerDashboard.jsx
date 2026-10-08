import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { getDashboardMetrics } from '../../api/dashboard';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import '../../styles/dashboard.css';

const SafetyOfficerDashboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setData(await getDashboardMetrics());
    } catch {
      setError('Failed to load safety dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="dash-full-loading">
      <div className="dash-spinner" />
      <p>Loading safety dashboard…</p>
    </div>
  );

  if (error) return (
    <div className="dash-full-error">
      <p>{error}</p>
      <button className="dash-retry-btn" onClick={load}>Retry</button>
    </div>
  );

  if (!data) return null;

  // API shape: { compliance, maintenance, licenseCompliance, activeMaintenanceList, driverSafetyScores }
  const compliance     = data.compliance     || {};
  const maintenance    = data.maintenance    || {};
  const licenseAlerts  = data.licenseCompliance    || [];
  const driverScores   = data.driverSafetyScores   || [];
  const activeMaintList = data.activeMaintenanceList || [];

  const {
    totalDrivers = 0, availableDrivers = 0, suspendedDrivers = 0,
    expiredLicenses = 0, expiringLicenses = 0,
  } = compliance;

  const { activeMaintenance = 0, vehiclesInShop = 0 } = maintenance;

  const validLicenses = Math.max(0, totalDrivers - expiredLicenses - expiringLicenses);
  const licenseChartData = [
    { name: 'Valid',         count: validLicenses,    fill: '#10b981' },
    { name: 'Expiring Soon', count: expiringLicenses, fill: '#f59e0b' },
    { name: 'Expired',       count: expiredLicenses,  fill: '#ef4444' },
  ];

  const getScoreClass = (s) => {
    if (s < 50) return 'score-critical';
    if (s < 70) return 'score-bad';
    if (s < 85) return 'score-ok';
    return 'score-good';
  };

  const getScoreColor = (s) => {
    if (s < 50) return '#ef4444';
    if (s < 70) return '#f97316';
    if (s < 85) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="dash-root">
      {/* Header */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <h1>Safety &amp; Compliance</h1>
          <p>Driver licences, safety scores and maintenance tracking</p>
        </div>
        <button className="dash-refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* Driver KPIs */}
      <div className="dash-kpi-grid">
        <KpiCard title="Total Drivers"     value={totalDrivers}      icon="👥" color="primary" />
        <KpiCard title="Available"         value={availableDrivers}  icon="✅" color="success" />
        <KpiCard title="Suspended"         value={suspendedDrivers}  icon="🚫" color="danger"  />
        <KpiCard title="Expired Licences"  value={expiredLicenses}   icon="⚠️" color="danger"  />
        <KpiCard title="Expiring (30 d)"   value={expiringLicenses}  icon="⏰" color="warning" />
        <KpiCard title="Active Maintenance" value={activeMaintenance} icon="🔧" color="warning" />
        <KpiCard title="Vehicles In Shop"  value={vehiclesInShop}    icon="🏭" color="warning" />
      </div>

      {/* Compliance alerts */}
      {(expiredLicenses > 0 || expiringLicenses > 0 || suspendedDrivers > 0) && (
        <div className="dash-alerts">
          {expiredLicenses > 0 && (
            <div className="dash-alert dash-alert-danger">
              <span className="dash-alert-icon">🚨</span>
              <span><strong>{expiredLicenses}</strong> driver{expiredLicenses > 1 ? 's have' : ' has'} an <strong>expired licence</strong> — cannot be dispatched. Immediate action required.</span>
            </div>
          )}
          {expiringLicenses > 0 && (
            <div className="dash-alert dash-alert-warning">
              <span className="dash-alert-icon">⚡</span>
              <span><strong>{expiringLicenses}</strong> licence{expiringLicenses > 1 ? 's expire' : ' expires'} within 30 days — schedule renewal now.</span>
            </div>
          )}
          {suspendedDrivers > 0 && (
            <div className="dash-alert dash-alert-warning">
              <span className="dash-alert-icon">🚫</span>
              <span><strong>{suspendedDrivers}</strong> driver{suspendedDrivers > 1 ? 's are' : ' is'} currently <strong>suspended</strong>.</span>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="dash-actions-card">
        <p className="dash-actions-title">⚡ Quick Actions</p>
        <div className="dash-action-btns">
          <button className="dash-btn dash-btn-primary" onClick={() => window.location.href = '/drivers'}>👤 Manage Drivers</button>
          <button className="dash-btn dash-btn-ghost"   onClick={() => window.location.href = '/maintenance'}>🔧 Maintenance Logs</button>
        </div>
      </div>

      {/* Main grid */}
      <div className="dash-grid">

        {/* Licence compliance chart */}
        <div className="dash-card dash-col-4">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">📊</span> Licence Status</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={licenseChartData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {licenseChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Licence alerts table */}
        <div className="dash-card dash-col-8">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">📋</span> Licence Compliance Alerts</h2>
            {licenseAlerts.length > 0 && (
              <span className="dash-card-badge">{licenseAlerts.length} records</span>
            )}
          </div>
          {licenseAlerts.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Licence No</th>
                    <th>Expiry</th>
                    <th>Days Left</th>
                    <th>Status</th>
                    <th>Licence</th>
                  </tr>
                </thead>
                <tbody>
                  {licenseAlerts.map(d => {
                    const expiry = new Date(d.license_expiry);
                    const daysLeft = Math.ceil((expiry - new Date()) / 86400000);
                    const ls = daysLeft < 0 ? 'Expired' : daysLeft <= 30 ? 'Expiring Soon' : 'Valid';
                    const lv = daysLeft < 0 ? 'danger' : daysLeft <= 30 ? 'warning' : 'success';
                    return (
                      <tr key={d.id}>
                        <td><strong>{d.driver_name || '—'}</strong></td>
                        <td>{d.license_no}</td>
                        <td>{expiry.toLocaleDateString()}</td>
                        <td style={{ color: daysLeft < 0 ? '#ef4444' : daysLeft <= 30 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                        </td>
                        <td><StatusBadge status={d.status} /></td>
                        <td><StatusBadge status={ls} variant={lv} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">✅</span>
              <span className="dash-empty-text">All licences are valid</span>
            </div>
          )}
        </div>

        {/* Driver safety scores */}
        <div className="dash-card dash-col-6">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">🛡️</span> Driver Safety Scores</h2>
            <span className="dash-card-badge">Lowest first</span>
          </div>
          {driverScores.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driverScores.map(d => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.driver_name || '—'}</strong><br />
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{d.license_no}</span>
                      </td>
                      <td>
                        <div className="score-bar-wrap">
                          <span className={getScoreClass(d.safety_score)}>{d.safety_score}</span>
                          <div className="score-bar">
                            <div
                              className="score-bar-fill"
                              style={{ width: `${d.safety_score}%`, background: getScoreColor(d.safety_score) }}
                            />
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={d.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">🛡️</span>
              <span className="dash-empty-text">No safety score data</span>
            </div>
          )}
        </div>

        {/* Active maintenance */}
        <div className="dash-card dash-col-6">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span className="dash-card-title-icon">🔧</span> Active Maintenance</h2>
            {activeMaintList.length > 0 && (
              <span className="dash-card-badge">{activeMaintList.length} open</span>
            )}
          </div>
          {activeMaintList.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Started</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMaintList.map(m => {
                    const start = new Date(m.start_date);
                    const days  = Math.ceil((new Date() - start) / 86400000);
                    return (
                      <tr key={m.id}>
                        <td><strong>{m.vehicle_registration || '—'}</strong></td>
                        <td>{m.maintenance_type}</td>
                        <td>{start.toLocaleDateString()}</td>
                        <td style={{ color: days > 14 ? '#ef4444' : '#64748b', fontWeight: days > 14 ? 700 : 400 }}>
                          {days}d
                        </td>
                        <td><StatusBadge status={m.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-empty">
              <span className="dash-empty-icon">🔧</span>
              <span className="dash-empty-text">No active maintenance</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SafetyOfficerDashboard;
