import React from 'react';
import './InlineError.css';

/**
 * InlineError Component
 * Displays field-level or action-level error messages
 * 
 * @param {string} message - Error message to display
 * @param {string} className - Additional CSS classes
 */
const InlineError = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`inline-error ${className}`} role="alert">
      <span className="error-icon">⚠</span>
      <span className="error-message">{message}</span>
    </div>
  );
};

export default InlineError;
