import React from 'react';
import { StatusColors } from '../utils/constants';
import './StatusBadge.css';

const StatusBadge = ({ status, size = 'md', variant }) => {
  // Use explicit variant if provided, otherwise look up from StatusColors
  const colorType = variant || StatusColors[status] || 'secondary';
  
  return (
    <span className={`status-badge status-${colorType} size-${size}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
