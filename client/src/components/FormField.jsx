import React from 'react';
import './FormField.css';

const FormField = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
  error,
  placeholder,
  options,
  disabled = false,
  rows = 3,
}) => {
  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={error ? 'error' : ''}
        >
          <option value="">Select {label}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={error ? 'error' : ''}
        />
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'error' : ''}
      />
    );
  };

  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default FormField;
