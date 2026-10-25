import React from 'react';
import './KpiCard.css';

const KpiCard = ({ title, value, icon, trend, color = 'primary' }) => {
  return (
    <div className={`kpi-card kpi-card-${color}`}>
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {icon && <span className="kpi-icon" aria-hidden="true">{icon}</span>}
      </div>
      <div className="kpi-body">
        <span className="kpi-value">{value}</span>
        {trend && (
          <div className={`kpi-trend trend-${trend.type}`} aria-label={`Trend: ${trend.type} ${trend.value}`}>
            <span className="trend-arrow" aria-hidden="true">
              {trend.type === 'up' ? '↑' : trend.type === 'down' ? '↓' : '→'}
            </span>
            <span className="trend-text">{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;