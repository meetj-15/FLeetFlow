/**
 * Unit Tests: Driver Validation Logic
 * Tests license validation and dispatch eligibility checks
 */

import { describe, test, expect } from '@jest/globals';
import { isDispatchEligible, validateDriver } from '../driverValidation.js';
import { DriverStatus } from '../../../utils/constants.js';

describe('Driver Validation', () => {
  describe('validateDriver()', () => {
    test('should accept past date for license_expiry', () => {
      const driverData = {
        license_expiry: '2020-01-01'
      };
      
      const result = validateDriver(driverData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept present date for license_expiry', () => {
      const today = new Date().toISOString().split('T')[0];
      const driverData = {
        license_expiry: today
      };
      
      const result = validateDriver(driverData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept future date for license_expiry', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const driverData = {
        license_expiry: futureDateStr
      };
      
      const result = validateDriver(driverData);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid date format', () => {
      const driverData = {
        license_expiry: 'not-a-date'
      };
      
      const result = validateDriver(driverData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('license_expiry');
      expect(result.errors[0].message).toBe('Please enter a valid date');
    });

    test('should reject empty string as invalid date', () => {
      const driverData = {
        license_expiry: ''
      };
      
      const result = validateDriver(driverData);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Please enter a valid date');
    });
  });

  describe('isDispatchEligible()', () => {
    test('should return eligible true for valid license and Available status', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const driver = {
        license_expiry: futureDateStr,
        status: DriverStatus.AVAILABLE
      };
      
      const result = isDispatchEligible(driver);
      
      expect(result.eligible).toBe(true);
      expect(result.code).toBeNull();
      expect(result.message).toBeNull();
    });

    test('should return eligible true for license expiring today', () => {
      const today = new Date().toISOString().split('T')[0];
      
      const driver = {
        license_expiry: today,
        status: DriverStatus.AVAILABLE
      };
      
      const result = isDispatchEligible(driver);
      
      expect(result.eligible).toBe(true);
      expect(result.code).toBeNull();
    });

    test('should return eligible false for expired license', () => {
      const pastDate = new Date('2020-01-01');
      const pastDateStr = pastDate.toISOString().split('T')[0];
      
      const driver = {
        license_expiry: pastDateStr,
        status: DriverStatus.AVAILABLE
      };
      
      const result = isDispatchEligible(driver);
      
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('LICENSE_EXPIRED');
      expect(result.message).toContain('Driver license expired on');
      expect(result.message).toContain('cannot dispatch');
    });

    test('should return eligible false for unavailable driver status (On Trip)', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const driver = {
        license_expiry: futureDateStr,
        status: DriverStatus.ON_TRIP
      };
      
      const result = isDispatchEligible(driver);
      
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('DRIVER_UNAVAILABLE');
      expect(result.message).toBe('Driver is not available for dispatch');
    });

    test('should return eligible false for suspended driver', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const driver = {
        license_expiry: futureDateStr,
        status: DriverStatus.SUSPENDED
      };
      
      const result = isDispatchEligible(driver);
      
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('DRIVER_UNAVAILABLE');
      expect(result.message).toBe('Driver is not available for dispatch');
    });

    test('should prioritize license expiry check over status check', () => {
      const pastDate = new Date('2020-01-01');
      const pastDateStr = pastDate.toISOString().split('T')[0];
      
      const driver = {
        license_expiry: pastDateStr,
        status: DriverStatus.SUSPENDED
      };
      
      const result = isDispatchEligible(driver);
      
      expect(result.eligible).toBe(false);
      expect(result.code).toBe('LICENSE_EXPIRED');
    });
  });
});
