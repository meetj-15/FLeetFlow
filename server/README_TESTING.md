# FleetFlow Testing Guide

## Overview

This document describes the testing infrastructure and strategy for FleetFlow.

## Testing Framework

- **Framework**: Jest 29.x
- **API Testing**: Supertest 6.x
- **Test Type**: ESM (ECMAScript Modules)

## Test Structure

```
server/src/
├── utils/
│   └── __tests__/
│       └── validation.test.js        # Unit tests for utilities
├── modules/
│   ├── auth/
│   │   └── __tests__/
│   │       └── auth.test.js          # Integration tests for auth API
│   ├── trip/
│   │   └── __tests__/
│   │       └── dispatch.test.js      # Business rule tests for dispatch
│   └── maintenance/
│       └── __tests__/
│           └── maintenance.test.js   # Maintenance workflow tests
```

## Running Tests

### Run All Tests
```bash
cd server
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- validation.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="dispatch"
```

## Test Categories

### 1. Unit Tests
**Purpose**: Test individual functions and utilities in isolation

**Location**: `src/utils/__tests__/`

**Examples**:
- Validation helpers
- Date formatting
- Status transition logic
- Calculation functions

**Coverage Target**: 80%+

### 2. Integration Tests
**Purpose**: Test API endpoints end-to-end with database

**Location**: `src/modules/[module]/__tests__/`

**Examples**:
- Authentication flows
- CRUD operations
- Multi-step workflows

**Coverage Target**: Core business flows 100%

### 3. Business Rule Tests
**Purpose**: Verify critical business rules from SRS

**Location**: `src/modules/[module]/__tests__/`

**Focus Areas**:
- Dispatch eligibility (BR-01)
- Cargo capacity enforcement (BR-02)
- Concurrent dispatch prevention (BR-03)
- State transitions (BR-04)
- Resource release on completion/cancellation (BR-05, BR-06)
- Maintenance restrictions (BR-07)
- Automatic expense creation (BR-08)

**Coverage Target**: 100%

### 4. Database Tests
**Purpose**: Test database constraints and transactions

**Examples**:
- Foreign key constraints
- Unique constraints
- Check constraints
- Transaction rollback
- Concurrent operations

**Coverage Target**: All constraints verified

## Test Data Setup

### Using Seed Data
```bash
# Reset database and load seed data
psql -U postgres -d fleetflow_test -f database/schema.sql
psql -U postgres -d fleetflow_test -f database/seed.sql
```

### Test Database Configuration
Create `.env.test` file:
```env
NODE_ENV=test
DATABASE_URL=postgresql://username:password@localhost:5432/fleetflow_test
JWT_SECRET=test-secret-key
```

## Writing Tests

### Example: Unit Test
```javascript
import { describe, test, expect } from '@jest/globals';
import { isValidUUID } from '../validation.js';

describe('isValidUUID', () => {
  test('should return true for valid UUID', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  test('should return false for invalid UUID', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
  });
});
```

### Example: API Integration Test
```javascript
import request from 'supertest';
import app from '../../../app.js';

describe('POST /api/auth/login', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
  });
});
```

### Example: Business Rule Test
```javascript
describe('Dispatch Eligibility', () => {
  test('should reject dispatch when license expired', async () => {
    // Create driver with expired license
    const driver = await createTestDriver({ license_expiry: '2020-01-01' });
    
    // Attempt dispatch
    const response = await request(app)
      .post(`/api/trips/${tripId}/dispatch`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('LICENSE_EXPIRED');
  });
});
```

## Critical Acceptance Scenarios

These scenarios MUST pass before declaring the system complete:

### Scenario 1: Concurrent Dispatch Prevention
```javascript
test('should prevent concurrent dispatch of same vehicle', async () => {
  // Simulate two simultaneous dispatch requests
  const [result1, result2] = await Promise.all([
    dispatchTrip(trip1Id),
    dispatchTrip(trip2Id) // Both use same vehicle
  ]);
  
  // Only one should succeed
  const successes = [result1, result2].filter(r => r.status === 200);
  expect(successes).toHaveLength(1);
});
```

### Scenario 2: Expired License Rejection
```javascript
test('should reject dispatch of driver with expired license', async () => {
  const response = await dispatchTrip(tripWithExpiredDriverId);
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('LICENSE_EXPIRED');
});
```

### Scenario 3: Cargo Capacity Enforcement
```javascript
test('should reject trip creation when cargo exceeds capacity', async () => {
  const response = await request(app)
    .post('/api/trips')
    .send({
      vehicle_id: vehicleId, // max_load_capacity: 10000
      cargo_weight: 15000,   // Exceeds capacity
      ...otherFields
    });
  
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('CARGO_EXCEEDS_CAPACITY');
});
```

### Scenario 4: Maintenance on Active Trip
```javascript
test('should reject maintenance on vehicle On Trip', async () => {
  const response = await request(app)
    .post('/api/maintenance')
    .send({
      vehicle_id: vehicleOnTripId,
      ...maintenanceData
    });
  
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VEHICLE_UNAVAILABLE');
});
```

### Scenario 5: Trip Completion Releases Resources
```javascript
test('should complete trip and release resources', async () => {
  const response = await request(app)
    .post(`/api/trips/${tripId}/complete`)
    .send({ actual_distance: 450, end_odometer: 152800 });
  
  expect(response.status).toBe(200);
  
  // Verify states
  const trip = await getTrip(tripId);
  const vehicle = await getVehicle(trip.vehicle_id);
  const driver = await getDriver(trip.driver_id);
  
  expect(trip.status).toBe('Completed');
  expect(vehicle.status).toBe('Available');
  expect(driver.status).toBe('Available');
  expect(vehicle.odometer).toBe(152800);
});
```

### Scenario 6: Trip Cancellation Releases Resources
```javascript
test('should cancel dispatched trip and release resources', async () => {
  const response = await request(app)
    .post(`/api/trips/${dispatchedTripId}/cancel`);
  
  expect(response.status).toBe(200);
  
  const trip = await getTrip(dispatchedTripId);
  const vehicle = await getVehicle(trip.vehicle_id);
  const driver = await getDriver(trip.driver_id);
  
  expect(trip.status).toBe('Cancelled');
  expect(vehicle.status).toBe('Available');
  expect(driver.status).toBe('Available');
});
```

### Scenario 7: Fuel/Maintenance Expense Auto-Creation
```javascript
test('should create fuel expense when logging fuel', async () => {
  const fuelResponse = await request(app)
    .post('/api/fuel')
    .send({
      vehicle_id: vehicleId,
      liters: 100,
      cost: 150,
      fuel_date: '2024-01-20'
    });
  
  const fuelId = fuelResponse.body.data.id;
  
  // Verify expense was created
  const expenses = await getExpenses({ category: 'Fuel' });
  const fuelExpense = expenses.find(e => e.amount === 150);
  
  expect(fuelExpense).toBeDefined();
  expect(fuelExpense.category).toBe('Fuel');
  expect(fuelExpense.amount).toBe(150);
});
```

## Test Coverage Requirements

### Minimum Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| Business Rules | 100% | Critical |
| API Endpoints | 90% | High |
| Controllers | 85% | High |
| Utilities | 80% | Medium |
| Overall | 80% | High |

### Viewing Coverage Report
After running `npm run test:coverage`:
```bash
# Open HTML report
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
xdg-open coverage/lcov-report/index.html # Linux
```

## Best Practices

### 1. Test Naming
- Use descriptive test names: `should reject dispatch when license expired`
- Follow pattern: `should [expected behavior] when [condition]`

### 2. Test Isolation
- Each test should be independent
- Clean up test data after each test
- Don't rely on test execution order

### 3. Test Data
- Use factory functions for creating test data
- Avoid hard-coded IDs
- Reset database state between tests

### 4. Assertions
- Test one thing per test when possible
- Use specific matchers: `toHaveLength()`, `toHaveProperty()`
- Assert error codes, not just status codes

### 5. Async Testing
- Always use `async/await` for API tests
- Don't forget to `await` assertions
- Set appropriate timeouts for slow operations

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:12
        env:
          POSTGRES_DB: fleetflow_test
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

## Debugging Tests

### Run Single Test in Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand auth.test.js
```

### VS Code Debug Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/server/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## Known Issues & Limitations

1. **Database Reset**: Tests currently require manual database reset. Consider adding automatic fixtures.

2. **Test Data**: Seed data may conflict with test data. Use separate test database.

3. **Concurrent Tests**: Some tests cannot run in parallel due to database state. Use `--runInBand` for sequential execution.

4. **Skip Status**: Many tests are marked `.skip()` pending database configuration. Remove `.skip` when test database is ready.

## Next Steps

1. **Set up test database**: Create `fleetflow_test` database
2. **Configure test environment**: Create `.env.test` file
3. **Remove `.skip` from tests**: Enable tests one module at a time
4. **Add test factories**: Create helper functions for test data
5. **Set up CI/CD**: Automate test runs on push/PR
6. **Add E2E tests**: Use Playwright or Cypress for frontend tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- FleetFlow Context.md - Business Rules reference
- FleetFlow TRACEABILITY.md - Requirements coverage

---

**Last Updated**: 2024-01-20  
**Maintainer**: Development Team
