import React, { useId } from 'react';
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
  helpText,
  ...props
}) => {
  const generatedId = useId();
  const fieldId = name || generatedId;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value,
      onChange,
      required,
      disabled,
      placeholder,
      'aria-invalid': Boolean(error),
      'aria-describedby': `${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined,
      className: `form-control ${error ? 'is-invalid' : ''}`,
      ...props
    };

    if (type === 'select') {
      return (
        <select {...commonProps}>
          <option value="">Select {label || 'an option'}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return <textarea {...commonProps} rows={rows} />;
    }

    return <input {...commonProps} type={type} />;
  };

  return (
    <div className={`form-field-group ${error ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="required-star" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className="input-wrapper">
        {renderInput()}
      </div>
      {helpText && !error && (
        <span id={helpId} className="form-help-text">
          {helpText}
        </span>
      )}
      {error && (
        <span id={errorId} className="form-error-msg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default FormField;