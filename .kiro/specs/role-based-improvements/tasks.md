# Implementation Plan: Role-Based Improvements

## Overview

This implementation plan transforms FleetFlow into a production-ready, role-aware system with proper security, data consistency, and professional user experience. The plan follows 9 phases addressing functional defects, role-based access control, transaction safety, and UI enhancements.

**Technology Stack**: Node.js + Express (backend), React + Vite (frontend), PostgreSQL (database)

---

## Tasks

### Phase 1: License Validation Fix (Priority: Critical)

- [x] 1.1 Update driver validation service to accept any valid date
  - Modify `server/src/modules/driver/driverValidation.js` to remove past date rejection
  - Update `validateDriver()` function to accept any valid calendar date for `license_expiry`
  - Keep validation for invalid date formats only
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 1.2 Add dispatch eligibility check for license expiry
  - Create `isDispatchEligible()` function in `server/src/modules/driver/driverValidation.js`
  - Compare license expiry date to current date (normalized to midnight)
  - Return eligibility object with `eligible`, `code`, and `message` fields
  - Check driver status is "Available"
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 1.3 Update trip dispatch endpoint to enforce license validation
  - Modify `POST /api/trips/:id/dispatch` in `server/src/modules/trip/tripController.js`
  - Call `isDispatchEligible()` before allowing dispatch
  - Return HTTP 400 with error code "LICENSE_EXPIRED" when license is expired
  - Include expiry date in error message
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 1.4 Update frontend driver display to show computed license status
  - Modify `client/src/pages/Drivers.jsx` to compute license status client-side
  - Add `getLicenseStatus()` helper function comparing expiry date to current date
  - Display "Expired" badge in red for past dates
  - Display "Valid" badge in green for current/future dates
  - Display "Expiring Soon" badge in yellow for dates within 30 days
  - _Requirements: 1.7, 1.8_

- [x] 1.5 Write unit tests for license validation logic
  - Create `server/src/modules/driver/__tests__/driverValidation.test.js`
  - Test `validateDriver()` accepts past, present, and future dates
  - Test `validateDriver()` rejects invalid date formats
  - Test `isDispatchEligible()` with expired license (returns false)
  - Test `isDispatchEligible()` with valid license (returns true)
  - Test `isDispatchEligible()` with unavailable driver status
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2_

- [x] 1.6 Checkpoint - Verify license validation behavior
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 2: Backend Authorization Infrastructure (Priority: Critical)

- [x] 2.1 Create authorization middleware
  - Create `server/src/middleware/authorize.js`
  - Implement `authorize(allowedRoles)` middleware factory function
  - Extract user role from `req.user` (set by authentication middleware)
  - Return HTTP 403 Forbidden if role not in `allowedRoles`
  - Pass control to next middleware if authorized
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.7, 27.8_

- [x] 2.2 Apply authorization middleware to all protected routes
  - Update `server/src/modules/vehicle/vehicleRoutes.js` with role requirements
  - Update `server/src/modules/driver/driverRoutes.js` with role requirements
  - Update `server/src/modules/trip/tripRoutes.js` with role requirements
  - Update `server/src/modules/maintenance/maintenanceRoutes.js` with role requirements
  - Update `server/src/modules/fuel/fuelRoutes.js` with role requirements
  - Update `server/src/modules/expense/expenseRoutes.js` with role requirements
  - Fleet Manager: access to all modules
  - Driver: access to dashboard, fuel, own trips
  - Safety Officer: access to dashboard, drivers, maintenance
  - Financial Analyst: access to dashboard, expenses
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8_

- [x] 2.3 Create dashboard service with role-based data aggregation
  - Create `server/src/modules/dashboard/dashboardService.js`
  - Implement `getDashboardData(userId, userRole)` method
  - Implement `getFleetManagerDashboard()` with operational, financial, and safety metrics
  - Implement `getDriverDashboard(userId)` with driver's own trips only
  - Implement `getSafetyOfficerDashboard()` with compliance and maintenance metrics
  - Implement `getFinancialAnalystDashboard()` with revenue, expenses, and profitability
  - _Requirements: 3.1-3.16, 4.1-4.10, 5.1-5.13, 6.1-6.13_

- [x] 2.4 Create dashboard controller and route
  - Create `server/src/modules/dashboard/dashboardController.js`
  - Implement `getDashboard` controller extracting role from `req.user`
  - Call `dashboardService.getDashboardData()` with user role
  - Return role-specific dashboard data
  - Create `server/src/modules/dashboard/dashboardRoutes.js`
  - Add `GET /api/dashboard` route with authentication and authorization for all roles
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.10_

- [x] 2.5 Implement trip data isolation for Driver role
  - Update `server/src/modules/trip/tripService.js`
  - Modify `getTrips(userRole, userId)` to filter by driver_id for Driver role
  - Create `getDriverByUserId(userId)` helper to find driver profile
  - Return all trips for Fleet Manager and Safety Officer roles
  - Update `getTripById(tripId, userRole, userId)` to verify ownership for Driver role
  - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7, 8.8_

- [x] 2.6 Update trip controller to enforce data isolation
  - Modify `server/src/modules/trip/tripController.js`
  - Update `getTrips` to pass `req.user.role` and `req.user.id` to service
  - Update `getTripById` to return HTTP 403 if Driver accesses another driver's trip
  - Update `createTrip` to auto-set driver_id for Driver role users
  - Reject Driver attempts to create trips for other drivers
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2.7 Write integration tests for authorization
  - Create `server/src/middleware/__tests__/authorize.test.js`
  - Test authorization middleware with allowed role (should pass)
  - Test authorization middleware with disallowed role (should return 403)
  - Test authorization middleware with missing user (should return 403)
  - Create `server/src/modules/dashboard/__tests__/dashboardRoutes.test.js`
  - Test dashboard endpoint returns Fleet Manager data for Fleet Manager
  - Test dashboard endpoint returns Driver data for Driver
  - Test dashboard endpoint returns Safety Officer data for Safety Officer
  - Test dashboard endpoint returns Financial Analyst data for Financial Analyst
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 27.2, 27.3, 27.4_
  - NOTE: Deferred - workflow will implement

- [x] 2.8 Checkpoint - Verify authorization enforcement
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 3: Transaction Safety (Priority: High)

- [ ] 3.1 Implement dispatch transaction with row locking
  - Create `server/src/modules/trip/transactionService.js`
  - Implement `dispatchTrip(tripId, vehicleId, driverId)` method
  - Begin database transaction with `pool.connect()` and `BEGIN`
  - Lock trip record with `SELECT * FROM trips WHERE id = $1 FOR UPDATE`
  - Lock vehicle record with `SELECT * FROM vehicles WHERE id = $1 FOR UPDATE`
  - Lock driver record with `SELECT * FROM drivers WHERE id = $1 FOR UPDATE`
  - Validate trip status is "Draft"
  - Validate vehicle status is "Available"
  - Validate driver status is "Available"
  - Call `driverValidation.isDispatchEligible()` for license check
  - Validate cargo weight does not exceed vehicle capacity
  - Update trip status to "Dispatched" and set dispatch_time
  - Update vehicle status to "On Trip"
  - Update driver status to "On Trip"
  - Commit transaction on success, rollback on any failure
  - Release database client in finally block
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.9, 23.1-23.14_

- [ ] 3.2 Implement maintenance transaction services
  - Create `server/src/modules/maintenance/transactionService.js`
  - Implement `openMaintenance(maintenanceData)` method
  - Begin transaction and lock vehicle with FOR UPDATE
  - Validate vehicle status is not "On Trip"
  - Create maintenance log record with status "Active"
  - Update vehicle status to "In Shop"
  - Create corresponding expense record with category "Maintenance"
  - Commit transaction on success, rollback on failure
  - Implement `closeMaintenance(maintenanceId)` method
  - Begin transaction and lock maintenance record
  - Update maintenance status to "Completed"
  - Update vehicle status to "Available"
  - Commit transaction on success, rollback on failure
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10, 20.11_

- [ ] 3.3 Implement fuel logging transaction service
  - Create `server/src/modules/fuel/transactionService.js`
  - Implement `createFuelLog(fuelData)` method
  - Begin database transaction
  - Create fuel_logs record
  - Create corresponding expense record with category "Fuel"
  - Set expense amount equal to fuel cost
  - Link expense to same vehicle_id and trip_id
  - Commit transaction on success, rollback on failure
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9_

- [ ] 3.4 Implement trip completion transaction
  - Add `completeTrip(tripId, actualDistance, endOdometer)` to trip transactionService
  - Begin transaction and lock trip record
  - Validate trip status is "Dispatched"
  - Update trip status to "Completed" and set completed_time
  - Update vehicle status to "Available" and odometer to endOdometer
  - Update driver status to "Available"
  - Commit transaction on success, rollback on failure
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9, 24.10, 24.11_

- [ ] 3.5 Implement trip cancellation transaction
  - Add `cancelTrip(tripId)` to trip transactionService
  - Begin transaction and lock trip record
  - Validate trip status is "Draft" or "Dispatched"
  - Update trip status to "Cancelled" and set cancelled_at timestamp
  - If previous status was "Dispatched", update vehicle status to "Available"
  - If previous status was "Dispatched", update driver status to "Available"
  - Commit transaction on success, rollback on failure
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8, 25.9_

- [ ] 3.6 Update controllers to use transaction services
  - Update `server/src/modules/trip/tripController.js` to call `transactionService.dispatchTrip()`
  - Update dispatch endpoint to handle transaction errors
  - Update complete endpoint to call `transactionService.completeTrip()`
  - Update cancel endpoint to call `transactionService.cancelTrip()`
  - Update `server/src/modules/maintenance/maintenanceController.js` to use transaction service
  - Update `server/src/modules/fuel/fuelController.js` to use transaction service
  - _Requirements: 20.1, 21.1, 22.1, 24.1, 25.1_

- [ ]* 3.7 Write integration tests for transaction safety
  - Create `server/src/modules/trip/__tests__/transactionService.test.js`
  - Test successful dispatch with valid inputs (should update all three entities)
  - Test dispatch with expired license (should rollback)
  - Test dispatch with unavailable vehicle (should rollback)
  - Test dispatch with cargo exceeding capacity (should rollback)
  - Test trip completion with valid inputs (should update all entities)
  - Test trip cancellation for Draft trip (should not update resources)
  - Test trip cancellation for Dispatched trip (should free resources)
  - Create `server/src/modules/maintenance/__tests__/transactionService.test.js`
  - Test open maintenance on Available vehicle (should succeed)
  - Test open maintenance on vehicle On Trip (should rollback)
  - Test close maintenance (should update vehicle and maintenance status)
  - _Requirements: 20.7, 20.11, 21.7, 22.9, 24.11, 25.9_

- [ ] 3.8 Checkpoint - Verify transaction atomicity
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 4: Role-Specific Dashboards (Priority: High)

- [ ] 4.1 Create Fleet Manager dashboard component
  - Create `client/src/components/dashboard/FleetManagerDashboard.jsx`
  - Display operational metrics: active trips, available vehicles, vehicles in shop
  - Display financial metrics: total revenue, total expenses, net profit
  - Display active trips table with route, vehicle, driver, status, dispatch time
  - Display vehicle ROI table with trips, revenue, expenses, net profit, ROI percentage
  - Display license compliance alerts: expired licenses, expiring licenses, suspended drivers
  - Add quick action buttons: "Create Trip", "Add Vehicle", "Schedule Maintenance"
  - _Requirements: 3.1-3.16_

- [ ] 4.2 Create Driver dashboard component
  - Create `client/src/components/dashboard/DriverDashboard.jsx`
  - Display personal metrics: active trips count, completed trips count, total personal revenue
  - Display active trips table (driver's own trips only)
  - Display completed trips table (driver's own trips only)
  - Add quick action button: "Log Fuel"
  - Hide fleet-wide metrics and other drivers' data
  - _Requirements: 4.1-4.10_

- [ ] 4.3 Create Safety Officer dashboard component
  - Create `client/src/components/dashboard/SafetyOfficerDashboard.jsx`
  - Display compliance metrics: expired licenses, expiring licenses, suspended drivers, avg safety score
  - Display maintenance metrics: active maintenance count, vehicles in shop
  - Display expired licenses table with driver name, license number, expiry date
  - Display expiring licenses table (within 30 days)
  - Display active maintenance table with vehicle, type, start date, cost
  - Add quick action buttons: "Add Driver", "Open Maintenance", "Update Driver Status"
  - _Requirements: 5.1-5.13_

- [ ] 4.4 Create Financial Analyst dashboard component
  - Create `client/src/components/dashboard/FinancialAnalystDashboard.jsx`
  - Display financial metrics: total revenue, total expenses, net profit, expense trend percentage
  - Display expenses by category pie chart
  - Display vehicle profitability table with vehicle, revenue, expenses, net profit
  - Display top 5 expense categories
  - Add quick action buttons: "Add Expense", "Export Financial Report"
  - Hide operational details like driver names or vehicle assignments
  - _Requirements: 6.1-6.13_

- [ ] 4.5 Update main Dashboard component with role routing
  - Modify `client/src/pages/Dashboard.jsx`
  - Use `useAuth()` hook to get current user role
  - Implement role-based component selection in render
  - Render `<FleetManagerDashboard />` for Fleet Manager role
  - Render `<DriverDashboard />` for Driver role
  - Render `<SafetyOfficerDashboard />` for Safety Officer role
  - Render `<FinancialAnalystDashboard />` for Financial Analyst role
  - Add loading state while fetching dashboard data
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 4.6 Create dashboard API integration
  - Create `client/src/api/dashboard.js`
  - Implement `getDashboard()` function calling `GET /api/dashboard`
  - Include JWT token in Authorization header
  - Handle 401 (redirect to login) and 403 (show forbidden message) errors
  - Return parsed dashboard data
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.10_

- [ ] 4.7 Add skeleton loaders for dashboard loading states
  - Create `client/src/components/dashboard/DashboardSkeleton.jsx`
  - Create skeleton components for KPI cards
  - Create skeleton components for data tables
  - Create skeleton components for charts
  - Display appropriate skeletons based on role
  - _Requirements: 15.1, 15.2, 15.3_

- [ ]* 4.8 Write component tests for dashboard rendering
  - Create `client/src/components/dashboard/__tests__/FleetManagerDashboard.test.jsx`
  - Test renders operational metrics correctly
  - Test renders financial metrics correctly
  - Test renders active trips table
  - Test renders vehicle ROI table
  - Create similar test files for Driver, Safety Officer, and Financial Analyst dashboards
  - Test each dashboard renders appropriate sections for role
  - _Requirements: 3.1-3.16, 4.1-4.10, 5.1-5.13, 6.1-6.13_

- [ ] 4.9 Checkpoint - Verify role-specific dashboard rendering
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 5: Role-Based Navigation (Priority: Medium)

- [ ] 5.1 Create role-based navigation configuration
  - Update `client/src/components/AppLayout.jsx`
  - Define `ROLE_NAVIGATION` constant mapping roles to nav items
  - Fleet Manager: Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel, Expenses
  - Driver: Dashboard, Fuel
  - Safety Officer: Dashboard, Drivers, Maintenance
  - Financial Analyst: Dashboard, Expenses
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 5.2 Implement navigation menu component
  - Create `NavigationMenu` component in AppLayout.jsx
  - Use `useAuth()` to get current user role
  - Filter navigation items based on `ROLE_NAVIGATION[userRole]`
  - Render only permitted navigation links
  - Display current user role in header
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_

- [ ] 5.3 Create RoleRoute component for frontend protection
  - Create `client/src/routes/RoleRoute.jsx`
  - Accept `allowedRoles` prop array
  - Use `useAuth()` to get current user role
  - Render children if role is in allowedRoles
  - Redirect to `/forbidden` if role not allowed
  - _Requirements: 9.6_

- [ ] 5.4 Create Forbidden page
  - Create `client/src/pages/Forbidden.jsx`
  - Display "Access Denied" message
  - Explain user doesn't have permission for this module
  - Provide link to return to dashboard
  - _Requirements: 9.6_

- [ ] 5.5 Update route definitions with role protection
  - Modify `client/src/App.jsx` or router configuration
  - Wrap `/vehicles` route with `<RoleRoute allowedRoles={['Fleet Manager']} />`
  - Wrap `/drivers` route with `<RoleRoute allowedRoles={['Fleet Manager', 'Safety Officer']} />`
  - Wrap `/trips` route with `<RoleRoute allowedRoles={['Fleet Manager', 'Safety Officer']} />`
  - Wrap `/maintenance` route with `<RoleRoute allowedRoles={['Fleet Manager', 'Safety Officer']} />`
  - Wrap `/fuel` route with `<RoleRoute allowedRoles={['Fleet Manager', 'Driver']} />`
  - Wrap `/expenses` route with `<RoleRoute allowedRoles={['Fleet Manager', 'Financial Analyst']} />`
  - _Requirements: 9.6_

- [ ]* 5.6 Write tests for role-based navigation
  - Create `client/src/components/__tests__/AppLayout.test.jsx`
  - Test Fleet Manager sees all navigation items
  - Test Driver sees only Dashboard and Fuel
  - Test Safety Officer sees Dashboard, Drivers, Maintenance
  - Test Financial Analyst sees Dashboard and Expenses
  - Create `client/src/routes/__tests__/RoleRoute.test.jsx`
  - Test allowed role renders children
  - Test disallowed role redirects to Forbidden
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_

- [ ] 5.7 Checkpoint - Verify role-based navigation behavior
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 6: Professional UI - Design System (Priority: Medium)

- [ ] 6.1 Define color palette CSS variables
  - Create or update `client/src/index.css`
  - Define teal/emerald primary color palette (--color-primary-50 through --color-primary-900)
  - Define slate secondary color palette (--color-secondary-50 through --color-secondary-900)
  - Define status colors: success (green), warning (amber), danger (red), info (blue)
  - Define background colors: --bg-primary, --bg-secondary, --bg-tertiary
  - Define text colors: --text-primary, --text-secondary, --text-tertiary
  - Use `--color-primary-500: #14b8a6` as primary brand color
  - _Requirements: 12.1, 12.2, 12.3, 12.8_

- [ ] 6.2 Load custom web fonts
  - Add Google Fonts link for Inter font family in `client/index.html`
  - Load weights: 300, 400, 500, 600, 700
  - Define --font-sans CSS variable with Inter font stack
  - Define --font-mono CSS variable with monospace font stack
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 6.3 Update global typography styles
  - Define font size variables (--text-xs through --text-4xl) in index.css
  - Define font weight variables (--font-light through --font-bold)
  - Define line height variables (--leading-tight, --leading-normal, --leading-relaxed)
  - Apply font-family: var(--font-sans) to body
  - Style h1-h6 with appropriate sizes, weights, and line heights
  - _Requirements: 13.4, 13.5, 13.6, 13.7_

- [ ] 6.4 Create spacing scale
  - Define spacing CSS variables in index.css
  - Create consistent spacing scale (e.g., --space-1: 0.25rem through --space-16: 4rem)
  - _Requirements: 14.4_

- [ ] 6.5 Update Button component with design system
  - Modify `client/src/components/Button.jsx` and `Button.css`
  - Use var(--color-primary-500) for primary button background
  - Use var(--color-primary-600) for primary button hover
  - Add smooth transitions (200ms ease) for hover effects
  - Implement hover transform: translateY(-1px)
  - Style disabled state with var(--color-secondary-300)
  - Apply consistent border-radius and padding
  - _Requirements: 14.5, 14.8_

- [ ] 6.6 Update card components with design system
  - Modify card styling across all components using cards
  - Apply background: var(--bg-primary)
  - Add box-shadow for depth
  - Use consistent border-radius: 0.75rem
  - Add hover effects with elevated shadow
  - Apply consistent padding using spacing scale
  - _Requirements: 14.1, 14.4_

- [ ] 6.7 Update DataTable component with design system
  - Modify `client/src/components/DataTable.jsx` and `DataTable.css`
  - Use color variables for table headers and borders
  - Add alternating row colors or hover effects
  - Update text colors using --text-primary, --text-secondary
  - Add smooth transitions for row hover
  - _Requirements: 14.6_

- [ ] 6.8 Update form components with design system
  - Modify `client/src/components/FormField.jsx` and `FormField.css`
  - Style input fields with design system colors
  - Implement clear focus states using primary color
  - Use consistent border-radius and padding
  - Apply label styling with appropriate typography
  - _Requirements: 14.7_

- [ ] 6.9 Checkpoint - Verify consistent design system application
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 7: Professional UI - Enhanced Components (Priority: Medium)

- [ ] 7.1 Create Toast notification system
  - Create `client/src/components/Toast.jsx` and `Toast.css`
  - Implement Toast component with type prop (success, error, warning, info)
  - Add icon based on type
  - Implement auto-dismiss with setTimeout (3s for success, 5s for error)
  - Add manual dismiss button
  - Style with box-shadow and border-left accent color
  - Implement slideIn animation using @keyframes
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.9, 17.10_

- [ ] 7.2 Create ToastContainer and context
  - Create `client/src/context/ToastContext.jsx`
  - Implement ToastProvider with toast state management
  - Provide `showToast(type, message)` function
  - Create ToastContainer component rendering active toasts
  - Stack multiple toasts vertically with gap
  - Position container fixed at top-right or bottom-right
  - _Requirements: 17.8, 17.9_

- [ ] 7.3 Integrate toast notifications in API calls
  - Update all API wrapper functions in `client/src/api/*.js`
  - Show success toast on successful create/update/delete operations
  - Show error toast on API errors with descriptive messages
  - Use toast for license expiry dispatch errors
  - Use toast for authorization errors (403)
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 7.4 Create Skeleton loader components
  - Create `client/src/components/SkeletonLoader.jsx` and `SkeletonLoader.css`
  - Implement base skeleton with shimmer animation using @keyframes
  - Create skeleton variants: table, kpi, line
  - Apply linear-gradient background for shimmer effect
  - Use design system colors for skeleton backgrounds
  - _Requirements: 15.1, 15.2, 15.7_

- [ ] 7.5 Create Empty state component
  - Create `client/src/components/EmptyState.jsx` and `EmptyState.css`
  - Accept props: icon, title, description, action
  - Render icon with appropriate size
  - Display title as h3 and description as paragraph
  - Render action button if provided
  - Center content with adequate padding
  - _Requirements: 16.1, 16.2, 16.3, 16.6_

- [ ] 7.6 Add empty states to data tables
  - Update DataTable component to accept emptyState prop
  - Render EmptyState when data array is empty
  - Add contextual empty states for each module:
    - Vehicles: "No vehicles yet. Add your first vehicle to get started."
    - Drivers: "No drivers registered. Add a driver to begin dispatch operations."
    - Trips: "No trips found. Create a trip to start tracking."
    - Maintenance: "No maintenance records. Open maintenance when service is needed."
    - Fuel: "No fuel logs yet. Log fuel to track consumption."
    - Expenses: "No expenses recorded. Add an expense to track costs."
  - Include action buttons in empty states where appropriate
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 7.7 Add loading states with skeleton screens
  - Replace generic spinners in dashboard with skeleton loaders
  - Show skeleton KPI cards while loading dashboard metrics
  - Show skeleton table rows while loading data tables
  - Show skeleton charts while loading chart data
  - _Requirements: 15.1, 15.2, 15.3_

- [ ]* 7.8 Write tests for UI components
  - Create `client/src/components/__tests__/Toast.test.jsx`
  - Test success toast auto-dismisses after 3 seconds
  - Test error toast auto-dismisses after 5 seconds
  - Test manual dismiss button closes toast
  - Create `client/src/components/__tests__/EmptyState.test.jsx`
  - Test empty state renders icon, title, description
  - Test empty state renders action button when provided
  - _Requirements: 17.5, 17.6, 17.7, 16.1, 16.2, 16.3_

- [ ] 7.9 Checkpoint - Verify enhanced UI components
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 8: Professional UI - Charts and Visualizations (Priority: Low)

- [ ] 8.1 Install and configure Recharts
  - Verify recharts is already in `client/package.json` dependencies
  - If not present, add recharts: `npm install recharts`
  - Create chart wrapper components using design system colors
  - _Requirements: 19.1, 19.2, 19.3_

- [ ] 8.2 Create chart components for Fleet Manager dashboard
  - Create `client/src/components/charts/MonthlyRevenueChart.jsx`
  - Implement BarChart with monthly revenue data for last 6 months
  - Create `client/src/components/charts/FleetStatusPieChart.jsx`
  - Implement PieChart showing vehicle status distribution
  - Create `client/src/components/charts/ExpensesByCategoryChart.jsx`
  - Implement BarChart showing expenses by category
  - Use colors from design system (var(--color-primary-500), etc.)
  - Add tooltips showing exact values on hover
  - Label axes appropriately with units
  - _Requirements: 19.1, 19.2, 19.4, 19.5, 19.9, 3.9, 3.10, 3.11_

- [ ] 8.3 Create chart components for Safety Officer dashboard
  - Create `client/src/components/charts/SafetyScoreDistributionChart.jsx`
  - Implement BarChart showing distribution of driver safety scores
  - Group scores into ranges (0-20, 21-40, 41-60, 61-80, 81-100)
  - Use warning colors (amber/red) for low score ranges
  - _Requirements: 19.1, 19.4, 19.5, 5.10_

- [ ] 8.4 Create chart components for Financial Analyst dashboard
  - Create `client/src/components/charts/MonthlyExpensesChart.jsx`
  - Implement BarChart with monthly expenses for last 6 months
  - Create `client/src/components/charts/RevenueVsExpensesChart.jsx`
  - Implement LineChart comparing monthly revenue vs expenses
  - Create `client/src/components/charts/ExpensesPieChart.jsx`
  - Implement PieChart showing expense category breakdown with percentages
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 6.4, 6.5, 6.6_

- [ ] 8.5 Make charts responsive
  - Wrap all chart components in ResponsiveContainer from Recharts
  - Set container width to "100%" and height to appropriate pixel value
  - Test charts resize properly on different screen sizes
  - _Requirements: 19.7_

- [ ] 8.6 Add chart empty states
  - Update each chart component to check if data is empty
  - Render EmptyState component when no data available
  - Use descriptive messages: "No revenue data available for the selected period"
  - _Requirements: 19.8_

- [ ] 8.7 Format chart values
  - Implement number formatters for currency (revenue, expenses)
  - Add thousand separators using toLocaleString()
  - Format percentages with 1-2 decimal places
  - Format dates consistently in chart labels
  - _Requirements: 19.10_

- [ ] 8.8 Checkpoint - Verify chart rendering and interactivity
  - Ensure all tests pass, ask the user if questions arise.

---

### Phase 9: Seed Data and Testing (Priority: Medium)

- [ ] 9.1 Update seed script with users for all four roles
  - Modify `server/database/seed.js` or equivalent seed script
  - Create user with role "Fleet Manager" (email: fleetmanager@fleetflow.com, password: hashed)
  - Create user with role "Driver" (email: driver@fleetflow.com, password: hashed)
  - Create user with role "Safety Officer" (email: safety@fleetflow.com, password: hashed)
  - Create user with role "Financial Analyst" (email: analyst@fleetflow.com, password: hashed)
  - Hash all passwords using bcrypt before insertion
  - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.6_

- [ ] 9.2 Create driver profile for Driver user
  - Add corresponding driver profile record in drivers table for Driver user
  - Link driver record to user via user_id foreign key or email
  - Set license_expiry to a valid future date
  - Set status to "Available"
  - Set safety_score to reasonable value (e.g., 85)
  - _Requirements: 28.5_

- [ ] 9.3 Create sample data demonstrating role differences
  - Create at least 5 vehicles with various statuses (Available, On Trip, In Shop)
  - Create at least 3 drivers with various license expiry dates (expired, valid, expiring soon)
  - Create at least 5 trips assigned to different drivers
  - Create at least 3 active maintenance records
  - Create at least 10 fuel logs linked to trips and vehicles
  - Create at least 15 expense records across all categories
  - Ensure Driver user has at least 2 trips assigned to them
  - _Requirements: 28.7_

- [ ] 9.4 Add expired and expiring license examples
  - Create driver record with license_expiry set to 30 days ago (expired)
  - Create driver record with license_expiry set to 15 days from now (expiring soon)
  - Create driver record with license_expiry set to 1 year from now (valid)
  - _Requirements: 28.7_

- [ ] 9.5 Document test user credentials
  - Update README.md with "Test Users" section
  - List credentials for Fleet Manager, Driver, Safety Officer, Financial Analyst
  - Document default password or password pattern
  - Add instructions for running seed script
  - _Requirements: 28.8_

- [ ]* 9.6 Run full end-to-end test suite
  - Create `server/src/__tests__/e2e/roleBasedFeatures.test.js`
  - Test: Login as Fleet Manager, access dashboard, verify all metrics visible
  - Test: Login as Driver, access dashboard, verify only own trips visible
  - Test: Login as Driver, attempt to access /vehicles, verify 403 Forbidden
  - Test: Login as Safety Officer, access drivers page, verify expired licenses highlighted
  - Test: Create driver with past license expiry, verify record created
  - Test: Attempt dispatch with expired license driver, verify rejection
  - Test: Open maintenance on Available vehicle, verify transaction commits
  - Test: Attempt open maintenance on vehicle On Trip, verify transaction rollback
  - _Requirements: 28.7, 29.25, 29.26_

- [ ] 9.7 Checkpoint - Verify complete system functionality
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- All transaction operations use PostgreSQL row-level locking (SELECT FOR UPDATE)
- All role-based access control is enforced at backend via authorization middleware
- Frontend role filtering is for UX only; backend is the security boundary
- Design system uses teal/emerald palette (#14b8a6) not generic blue
- Toast notifications auto-dismiss: success 3s, error 5s
- Dashboard data varies by role: Fleet Manager (all data), Driver (own trips only), Safety Officer (compliance), Financial Analyst (financial only)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1"] },
    { "id": 2, "tasks": ["1.5", "2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5", "3.1"] },
    { "id": 4, "tasks": ["2.6", "2.7", "3.2", "3.3"] },
    { "id": 5, "tasks": ["3.4", "3.5"] },
    { "id": 6, "tasks": ["3.6", "3.7", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 7, "tasks": ["4.5", "4.6", "4.7", "5.1"] },
    { "id": 8, "tasks": ["4.8", "5.2", "5.3", "5.4"] },
    { "id": 9, "tasks": ["5.5", "5.6", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 10, "tasks": ["6.5", "6.6", "6.7", "6.8"] },
    { "id": 11, "tasks": ["7.1", "7.2"] },
    { "id": 12, "tasks": ["7.3", "7.4", "7.5"] },
    { "id": 13, "tasks": ["7.6", "7.7", "7.8"] },
    { "id": 14, "tasks": ["8.1"] },
    { "id": 15, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 16, "tasks": ["8.5", "8.6", "8.7"] },
    { "id": 17, "tasks": ["9.1", "9.2"] },
    { "id": 18, "tasks": ["9.3", "9.4", "9.5"] },
    { "id": 19, "tasks": ["9.6"] }
  ]
}
```
