import React from 'react';
import './Button.css';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  fullWidth = false,
  ariaLabel,
  ...props
}) => {
  const isInteractionDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''}`}
      onClick={onClick}
      disabled={isInteractionDisabled}
      aria-disabled={isInteractionDisabled}
      aria-label={ariaLabel}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2 a 10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        </span>
      )}
      <span className={loading ? 'btn-label-hidden' : 'btn-label'}>
        {children}
      </span>
    </button>
  );
};

export default Button;