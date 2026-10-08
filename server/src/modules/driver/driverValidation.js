/**
 * Driver validation service
 * Handles validation logic for driver creation, updates, and dispatch eligibility
 */

import { DriverStatus } from '../../utils/constants.js';

/**
 * Check if a value is a valid date
 * @param {any} dateValue - Value to check
 * @returns {boolean} True if valid date
 */
export const isValidDate = (dateValue) => {
  if (!dateValue) return false;
  
  const date = new Date(dateValue);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validate driver data for creation or update
 * @param {Object} driverData - Driver information
 * @returns {Object} Validation result with valid flag and errors array
 */
export const validateDriver = (driverData) => {
  const errors = [];

  // Validate license_expiry: accept any valid calendar date (past, present, or future)
  if (driverData.license_expiry !== undefined) {
    if (!isValidDate(driverData.license_expiry)) {
      errors.push({
        field: 'license_expiry',
        message: 'Please enter a valid date'
      });
    }
    // DO NOT reject dates in the past - this is intentional per requirements
  }

  // Validate license_no
  if (driverData.license_no !== undefined) {
    if (!driverData.license_no || typeof driverData.license_no !== 'string' || driverData.license_no.trim() === '') {
      errors.push({
        field: 'license_no',
        message: 'License number is required'
      });
    }
  }

  // Validate license_category
  if (driverData.license_category !== undefined) {
    if (!driverData.license_category || typeof driverData.license_category !== 'string' || driverData.license_category.trim() === '') {
      errors.push({
        field: 'license_category',
        message: 'License category is required'
      });
    }
  }

  // Validate safety_score if provided
  if (driverData.safety_score !== undefined && driverData.safety_score !== null) {
    const score = Number(driverData.safety_score);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.push({
        field: 'safety_score',
        message: 'Safety score must be between 0 and 100'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Check if driver is eligible for dispatch
 * @param {Object} driver - Driver record with license_expiry and status
 * @returns {Object} Eligibility result with eligible flag, code, and message
 */
export const isDispatchEligible = (driver) => {
  // Normalize dates to midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDate = new Date(driver.license_expiry);
  expiryDate.setHours(0, 0, 0, 0);

  // Check if license is expired (expiry date is before today)
  if (expiryDate < today) {
    const formattedDate = driver.license_expiry.split('T')[0]; // Format as YYYY-MM-DD
    return {
      eligible: false,
      code: 'LICENSE_EXPIRED',
      message: `Driver license expired on ${formattedDate} - cannot dispatch`
    };
  }

  // Check if driver status is Available
  if (driver.status !== DriverStatus.AVAILABLE) {
    return {
      eligible: false,
      code: 'DRIVER_UNAVAILABLE',
      message: 'Driver is not available for dispatch'
    };
  }

  // Driver is eligible for dispatch
  return {
    eligible: true,
    code: null,
    message: null
  };
};
