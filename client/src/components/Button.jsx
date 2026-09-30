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
}) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
