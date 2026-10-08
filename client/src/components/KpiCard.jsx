import React from 'react';
import './KpiCard.css';

const KpiCard = ({ title, value, icon, trend, color = 'primary' }) => {
  const displayValue = value !== undefined && value !== null ? value : '—';

  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-header">
        <div className="kpi-icon-wrap">
          <span className="kpi-icon">{icon}</span>
        </div>
        <span className="kpi-title">{title}</span>
      </div>
      <div className="kpi-value">{displayValue}</div>
      {trend && (
        <div className={`kpi-trend ${trend.type}`}>
          {trend.type === 'up' ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
