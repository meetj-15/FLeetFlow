import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardMetrics } from '../../api/dashboard';
import KpiCard from '../../components/KpiCard';
import StatusBadge from '../../components/StatusBadge';
import './SafetyOfficerDashboard.css';

const SafetyOfficerDashboard = () => {
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
        <p>Loading safety dashboard...</p>
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

  const { safety } = data;

  if (!safety) {
    return (
      <div className="dashboard-error">
        <p>No safety data available</p>
      </div>
    );
  }

  const { 
    totalDrivers, 
    availableDrivers, 
    suspendedDrivers, 
    expiredLicenses, 
    expiringLicenses,
    activeMaintenance,
    vehiclesInShop,
    licenseAlerts,
    driverSafetyScores,
    activeMaintenanceList 
  } = safety;

  // License status chart data
  const validLicenses = totalDrivers - expiredLicenses - expiringLicenses;
  const licenseChartData = [
    { name: 'Valid', count: validLicenses, fill: '#10b981' },
    { name: 'Expiring Soon', count: expiringLicenses, fill: '#f59e0b' },
    { name: 'Expired', count: expiredLicenses, fill: '#ef4444' },
  ];

  return (
    <div className="safety-officer-dashboard">
      <div className="dashboard-header">
        <h1>Safety Officer Dashboard</h1>
        <p className="dashboard-subtitle">Driver compliance and maintenance monitoring</p>
      </div>

      {/* Safety KPIs */}
      <div className="kpi-grid">
        <KpiCard title="Total Drivers" value={totalDrivers} icon="👥" color="primary" />
        <KpiCard title="Available Drivers" value={availableDrivers} icon="✅" color="success" />
        <KpiCard title="Suspended Drivers" value={suspendedDrivers} icon="🚫" color="danger" />
        <KpiCard title="Expired Licenses" value={expiredLicenses} icon="⚠️" color="danger" />
        <KpiCard title="Expiring Soon" value={expiringLicenses} icon="⏰" color="warning" />
      </div>

      <div className="kpi-grid maintenance-kpis">
        <KpiCard title="Active Maintenance" value={activeMaintenance} icon="🔧" color="warning" />
        <KpiCard title="Vehicles In Shop" value={vehiclesInShop} icon="🏭" color="warning" />
      </div>

      {/* Compliance Alerts */}
      {(expiredLicenses > 0 || expiringLicenses > 0 || suspendedDrivers > 0) && (
        <div className="dashboard-alerts">
          {expiredLicenses > 0 && (
            <div className="dash-alert dash-alert-danger">
              ⚠ <strong>{expiredLicenses}</strong> driver{expiredLicenses > 1 ? 's have' : ' has'} an <strong>expired licence</strong> — immediate action required.
            </div>
          )}
          {expiringLicenses > 0 && (
            <div className="dash-alert dash-alert-warning">
              ⚡ <strong>{expiringLicenses}</strong> driver licence{expiringLicenses > 1 ? 's expire' : ' expires'} within 30 days — schedule renewal.
            </div>
          )}
          {suspendedDrivers > 0 && (
            <div className="dash-alert dash-alert-warning">
              🚫 <strong>{suspendedDrivers}</strong> driver{suspendedDrivers > 1 ? 's are' : ' is'} currently <strong>suspended</strong>.
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => window.location.href = '/drivers'}>
            👤 Manage Drivers
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/maintenance'}>
            🔧 Maintenance Logs
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* License Compliance Chart */}
        <div className="dash-card">
          <h2>License Compliance Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={licenseChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6">
                {licenseChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* License Alerts Table */}
        <div className="dash-card wide">
          <h2>License Compliance Alerts</h2>
          {licenseAlerts && licenseAlerts.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>License No</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>License Status</th>
                  </tr>
                </thead>
                <tbody>
                  {licenseAlerts.map((driver) => {
                    const expiryDate = new Date(driver.license_expiry);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    
                    let licenseStatus = 'Valid';
                    let badgeColor = 'success';
                    
                    if (daysUntilExpiry < 0) {
                      licenseStatus = 'Expired';
                      badgeColor = 'danger';
                    } else if (daysUntilExpiry <= 30) {
                      licenseStatus = 'Expiring Soon';
                      badgeColor = 'warning';
                    }

                    return (
                      <tr key={driver.id}>
                        <td>{driver.driver_name || 'N/A'}</td>
                        <td>{driver.license_no}</td>
                        <td>{expiryDate.toLocaleDateString()}</td>
                        <td><StatusBadge status={driver.status} /></td>
                        <td><StatusBadge status={licenseStatus} color={badgeColor} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No license alerts</p>
          )}
        </div>

        {/* Driver Safety Scores */}
        <div className="dash-card wide">
          <h2>Driver Safety Scores (Lowest First)</h2>
          {driverSafetyScores && driverSafetyScores.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>License No</th>
                    <th>Safety Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driverSafetyScores.map((driver) => {
                    const score = driver.safety_score;
                    let scoreClass = 'score-good';
                    if (score < 50) scoreClass = 'score-critical';
                    else if (score < 70) scoreClass = 'score-warning';
                    else if (score < 85) scoreClass = 'score-ok';

                    return (
                      <tr key={driver.id}>
                        <td>{driver.driver_name || 'N/A'}</td>
                        <td>{driver.license_no}</td>
                        <td className={scoreClass}><strong>{score}</strong></td>
                        <td><StatusBadge status={driver.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No safety data available</p>
          )}
        </div>

        {/* Active Maintenance List */}
        <div className="dash-card wide">
          <h2>Active Maintenance</h2>
          {activeMaintenanceList && activeMaintenanceList.length > 0 ? (
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>Duration (days)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMaintenanceList.map((maint) => {
                    const startDate = new Date(maint.start_date);
                    const today = new Date();
                    const durationDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

                    return (
                      <tr key={maint.id}>
                        <td>{maint.vehicle_registration || 'N/A'}</td>
                        <td>{maint.maintenance_type}</td>
                        <td>{startDate.toLocaleDateString()}</td>
                        <td>{durationDays}</td>
                        <td><StatusBadge status={maint.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No active maintenance</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyOfficerDashboard;
