import React from 'react';
import './KpiCard.css';

const KpiCard = ({ title, value, icon, trend, color = 'primary' }) => {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-header">
        <span className="kpi-icon">{icon}</span>
        <span className="kpi-title">{title}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {trend && (
        <div className={`kpi-trend ${trend.type}`}>
          {trend.type === 'up' ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
