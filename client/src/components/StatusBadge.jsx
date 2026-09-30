import React from 'react';
import { StatusColors } from '../utils/constants';
import './StatusBadge.css';

const StatusBadge = ({ status, size = 'md' }) => {
  const colorType = StatusColors[status] || 'secondary';
  
  return (
    <span className={`status-badge status-${colorType} size-${size}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
