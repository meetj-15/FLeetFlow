/**
 * Authorization Middleware Integration Tests
 * Tests role-based access control and 403 rejection
 */

import { describe, test, expect } from '@jest/globals';
import { authorize } from '../authorize.js';
import { UserRoles } from '../../utils/constants.js';

// Mock function helper
const createMockNext = () => {
  const calls = [];
  const fn = (arg) => calls.push(arg);
  fn.calls = calls;
  fn.mock = {
    calls: calls.map(c => [c]),
  };
  return fn;
};

describe('Authorization Middleware', () => {
  describe('authorize() middleware', () => {
    test('should allow Fleet Manager to access Fleet Manager endpoint', () => {
      const req = { user: { id: '123', role: UserRoles.FLEET_MANAGER } };
      const res = {};
      const next = createMockNext();

      authorize(UserRoles.FLEET_MANAGER)(req, res, next);

      expect(next.calls.length).toBe(1);
      expect(next.calls[0]).toBeUndefined(); // No error
    });

    test('should reject Driver from Fleet Manager endpoint with 403', () => {
      const req = { user: { id: '123', role: UserRoles.DRIVER } };
      const res = {};
      const next = createMockNext();

      authorize(UserRoles.FLEET_MANAGER)(req, res, next);

      expect(next.calls.length).toBe(1);
      expect(next.calls[0]).toBeDefined();
      expect(next.calls[0].statusCode).toBe(403);
      expect(next.calls[0].message).toContain('Access denied');
    });

    test('should reject Safety Officer from Financial Analyst endpoint', () => {
      const req = { user: { id: '123', role: UserRoles.SAFETY_OFFICER } };
      const res = {};
      const next = createMockNext();

      authorize(UserRoles.FINANCIAL_ANALYST)(req, res, next);

      expect(next.calls.length).toBe(1);
      expect(next.calls[0]).toBeDefined();
      expect(next.calls[0].statusCode).toBe(403);
    });

    test('should allow multiple roles when array is provided', () => {
      const req = { user: { id: '123', role: UserRoles.DRIVER } };
      const res = {};
      const next = createMockNext();

      authorize(UserRoles.FLEET_MANAGER, UserRoles.DRIVER)(req, res, next);

      expect(next.calls.length).toBe(1);
      expect(next.calls[0]).toBeUndefined(); // No error
    });

    test('should reject when user role not in allowed roles array', () => {
      const req = { user: { id: '123', role: UserRoles.FINANCIAL_ANALYST } };
      const res = {};
      const next = createMockNext();

      authorize(UserRoles.FLEET_MANAGER, UserRoles.DRIVER)(req, res, next);

      expect(next.calls.length).toBe(1);
      expect(next.calls[0]).toBeDefined();
      expect(next.calls[0].statusCode).toBe(403);
    });

    test('should reject when user is missing from request', () => {
      const req = {}; // No user
      const res = {};
      const next = createMockNext();

      authorize(UserRoles.FLEET_MANAGER)(req, res, next);

      expect(next.calls.length).toBe(1);
      expect(next.calls[0]).toBeDefined();
      expect(next.calls[0].statusCode).toBe(403); // forbiddenError returns 403
    });
  });

  describe('Role-specific access matrix', () => {
    test('Fleet Manager can access all roles', () => {
      const req = { user: { id: '123', role: UserRoles.FLEET_MANAGER } };
      const next1 = createMockNext();
      const next2 = createMockNext();
      const next3 = createMockNext();
      const next4 = createMockNext();

      // Test Fleet Manager can access each endpoint type
      authorize(UserRoles.FLEET_MANAGER)(req, {}, next1);
      authorize(UserRoles.DRIVER)(req, {}, next2);
      authorize(UserRoles.SAFETY_OFFICER)(req, {}, next3);
      authorize(UserRoles.FINANCIAL_ANALYST)(req, {}, next4);

      // All should succeed (called without error)
      expect(next1.calls[0]).toBeUndefined();
      expect(next2.calls[0]).toBeUndefined();
      expect(next3.calls[0]).toBeUndefined();
      expect(next4.calls[0]).toBeUndefined();
    });

    test('Driver can only access Driver-specific endpoints', () => {
      const req = { user: { id: '123', role: UserRoles.DRIVER } };

      // Should succeed for Driver role
      let next = createMockNext();
      authorize(UserRoles.DRIVER)(req, {}, next);
      expect(next.calls[0]).toBeUndefined();

      // Should fail for Fleet Manager
      next = createMockNext();
      authorize(UserRoles.FLEET_MANAGER)(req, {}, next);
      expect(next.calls[0]?.statusCode).toBe(403);

      // Should fail for Safety Officer
      next = createMockNext();
      authorize(UserRoles.SAFETY_OFFICER)(req, {}, next);
      expect(next.calls[0]?.statusCode).toBe(403);

      // Should fail for Financial Analyst
      next = createMockNext();
      authorize(UserRoles.FINANCIAL_ANALYST)(req, {}, next);
      expect(next.calls[0]?.statusCode).toBe(403);
    });

    test('Safety Officer cannot access financial endpoints', () => {
      const req = { user: { id: '123', role: UserRoles.SAFETY_OFFICER } };
      const next = createMockNext();

      authorize(UserRoles.FINANCIAL_ANALYST)(req, {}, next);

      expect(next.calls[0]).toBeDefined();
      expect(next.calls[0].statusCode).toBe(403);
    });

    test('Financial Analyst cannot access operational endpoints', () => {
      const req = { user: { id: '123', role: UserRoles.FINANCIAL_ANALYST } };

      // Should fail for Driver operations
      let next = createMockNext();
      authorize(UserRoles.DRIVER)(req, {}, next);
      expect(next.calls[0]?.statusCode).toBe(403);

      // Should fail for Safety Officer operations
      next = createMockNext();
      authorize(UserRoles.SAFETY_OFFICER)(req, {}, next);
      expect(next.calls[0]?.statusCode).toBe(403);
    });
  });
});
