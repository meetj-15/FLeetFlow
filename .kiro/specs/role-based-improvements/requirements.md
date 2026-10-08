# Requirements Document: Role-Based Improvements

## Introduction

This specification defines critical improvements to the FleetFlow Transport Operations Management System to address functional defects, enhance role-based access control, implement role-specific dashboards, and improve the user interface. The system currently treats all authenticated users similarly regardless of role, contains validation bugs that prevent accurate data entry, and lacks professional UI polish. These improvements will transform FleetFlow into a truly role-aware system with appropriate data isolation, tailored workflows, and a professional user experience.

## Glossary

- **System**: The FleetFlow Transport Operations Management System
- **User**: Any authenticated person using the system
- **Fleet_Manager**: User with Fleet Manager role who has full operational control
- **Driver_User**: User with Driver role who manages their own trips and fuel entries
- **Safety_Officer**: User with Safety Officer role who manages driver compliance and maintenance
- **Financial_Analyst**: User with Financial Analyst role who analyzes costs and revenue
- **License_Expiry_Date**: The actual expiration date printed on a driver's physical license document
- **Dispatch_Operation**: The process of assigning a vehicle and driver to a trip and changing status to Dispatched
- **Role_Specific_Dashboard**: A dashboard view showing only data and actions relevant to a specific user role
- **License_Status**: The computed state (Valid or Expired) based on comparing License_Expiry_Date to current date
- **Trip_Owner**: The driver assigned to a specific trip
- **Active_License**: A driver license where License_Expiry_Date is today or in the future
- **Expired_License**: A driver license where License_Expiry_Date is in the past
- **Expiring_License**: A driver license where License_Expiry_Date is within the next 30 days
- **Professional_UI**: User interface with custom styling, proper visual hierarchy, modern components, and polished aesthetics
- **Data_Isolation**: Filtering backend responses so users only receive data appropriate to their role
- **Safety_Metric**: Quantifiable measure of driver or fleet safety (e.g., safety score, license compliance rate)
- **Financial_Metric**: Quantifiable measure of financial performance (e.g., revenue, expenses, net profit, ROI)
- **Operational_Metric**: Quantifiable measure of fleet operations (e.g., active trips, available vehicles)
- **Row_Lock**: Database-level exclusive lock on a specific record to prevent concurrent modification
- **Multi_Step_Transaction**: A database operation involving multiple related record changes that must all succeed or all fail
- **Expense_Category**: Classification of expense type (Tolls, Parking, Maintenance, Fuel, Insurance, Other)
- **Trip_Status**: Current state of a trip (Draft, Dispatched, Completed, Cancelled)
- **Vehicle_Status**: Current state of a vehicle (Available, On Trip, In Shop, Retired)
- **Driver_Status**: Current state of a driver (Available, On Trip, Suspended)
- **Maintenance_Status**: Current state of a maintenance record (Active, Completed)

---

## Requirements

### Requirement 1: License Expiry Date Validation Fix

**User Story:** As a Fleet Manager or Safety Officer, I want to enter the actual license expiry date printed on a driver's license (whether past, present, or future), so that the system accurately reflects real-world license status and can properly warn about expired licenses.

#### Acceptance Criteria

1. WHEN creating a driver record, THE System SHALL accept any valid calendar date as License_Expiry_Date
2. WHEN updating a driver record, THE System SHALL accept any valid calendar date as License_Expiry_Date
3. THE System SHALL NOT reject License_Expiry_Date values that are in the past
4. THE System SHALL NOT reject License_Expiry_Date values equal to the current date
5. THE System SHALL accept License_Expiry_Date values in the future
6. WHEN a user submits an invalid date format, THE System SHALL return a validation error with message "Please enter a valid date"
7. WHEN displaying a driver record WHERE License_Expiry_Date is before the current date, THE System SHALL display the license status as "Expired"
8. WHEN displaying a driver record WHERE License_Expiry_Date is today or later, THE System SHALL display the license status as "Valid"

---

### Requirement 2: License Expiry Dispatch Validation

**User Story:** As a system that enforces safety rules, I want to prevent dispatch of trips with drivers who have expired licenses, so that only drivers with valid licenses operate vehicles.

#### Acceptance Criteria

1. WHEN attempting to dispatch a trip, THE System SHALL verify that the assigned driver License_Expiry_Date is today or in the future
2. IF the assigned driver License_Expiry_Date is before the current date, THEN THE System SHALL reject the dispatch operation with error code "LICENSE_EXPIRED"
3. WHEN rejecting dispatch due to expired license, THE System SHALL return the message "Driver license expired on [date] - cannot dispatch"
4. WHEN a driver license is expired, THE System SHALL allow the driver record to remain in the database
5. WHEN a driver license is expired, THE System SHALL allow viewing and updating the driver record
6. WHEN a driver license is expired, THE System SHALL prevent only the Dispatch_Operation

---

### Requirement 3: Fleet Manager Dashboard

**User Story:** As a Fleet Manager, I want a comprehensive operational dashboard showing all fleet metrics and quick access to management actions, so that I can monitor and control the entire fleet efficiently.

#### Acceptance Criteria

1. WHEN a Fleet_Manager views the dashboard, THE System SHALL display the count of active trips
2. WHEN a Fleet_Manager views the dashboard, THE System SHALL display the count of available vehicles
3. WHEN a Fleet_Manager views the dashboard, THE System SHALL display the count of vehicles in shop
4. WHEN a Fleet_Manager views the dashboard, THE System SHALL display total revenue from completed trips
5. WHEN a Fleet_Manager views the dashboard, THE System SHALL display total expenses across all categories
6. WHEN a Fleet_Manager views the dashboard, THE System SHALL display net profit calculated as total revenue minus total expenses
7. WHEN a Fleet_Manager views the dashboard, THE System SHALL display a table of all active trips with route, vehicle, driver, status, and dispatch time
8. WHEN a Fleet_Manager views the dashboard, THE System SHALL display per-vehicle ROI showing trips, revenue, expenses, net profit, and ROI percentage
9. WHEN a Fleet_Manager views the dashboard, THE System SHALL display a chart of monthly revenue for the last 6 months
10. WHEN a Fleet_Manager views the dashboard, THE System SHALL display a pie chart of fleet status distribution
11. WHEN a Fleet_Manager views the dashboard, THE System SHALL display a bar chart of expenses by category
12. WHEN a Fleet_Manager views the dashboard, THE System SHALL display a table of recent completed trips
13. WHEN a Fleet_Manager views the dashboard, THE System SHALL display alerts for drivers with expired licenses
14. WHEN a Fleet_Manager views the dashboard, THE System SHALL display alerts for drivers with licenses expiring within 30 days
15. WHEN a Fleet_Manager views the dashboard, THE System SHALL display alerts for suspended drivers
16. WHEN a Fleet_Manager views the dashboard, THE System SHALL provide quick action buttons for "Create Trip", "Add Vehicle", and "Schedule Maintenance"

---

### Requirement 4: Driver Dashboard

**User Story:** As a Driver, I want a personal dashboard showing only my assigned trips and fuel logging capability, so that I can focus on my own work without seeing irrelevant fleet-wide information.

#### Acceptance Criteria

1. WHEN a Driver_User views the dashboard, THE System SHALL display only trips where the driver_id matches the current user's driver profile
2. WHEN a Driver_User views the dashboard, THE System SHALL display the count of trips currently assigned to them with status "Dispatched"
3. WHEN a Driver_User views the dashboard, THE System SHALL display a table of their active trips with route, vehicle, status, and dispatch time
4. WHEN a Driver_User views the dashboard, THE System SHALL display a table of their completed trips with route, vehicle, revenue, and completion date
5. WHEN a Driver_User views the dashboard, THE System SHALL display total revenue from their completed trips
6. WHEN a Driver_User views the dashboard, THE System SHALL provide a quick action button for "Log Fuel"
7. WHEN a Driver_User views the dashboard, THE System SHALL NOT display fleet-wide metrics
8. WHEN a Driver_User views the dashboard, THE System SHALL NOT display trips assigned to other drivers
9. WHEN a Driver_User views the dashboard, THE System SHALL NOT display vehicle ROI information
10. WHEN a Driver_User views the dashboard, THE System SHALL NOT display expense information

---

### Requirement 5: Safety Officer Dashboard

**User Story:** As a Safety Officer, I want a compliance-focused dashboard showing license status, safety metrics, and maintenance information, so that I can ensure fleet safety and regulatory compliance.

#### Acceptance Criteria

1. WHEN a Safety_Officer views the dashboard, THE System SHALL display the count of drivers with expired licenses
2. WHEN a Safety_Officer views the dashboard, THE System SHALL display the count of drivers with licenses expiring within 30 days
3. WHEN a Safety_Officer views the dashboard, THE System SHALL display the count of suspended drivers
4. WHEN a Safety_Officer views the dashboard, THE System SHALL display a table of drivers with expired licenses showing name, license number, and expiry date
5. WHEN a Safety_Officer views the dashboard, THE System SHALL display a table of drivers with expiring licenses showing name, license number, and expiry date
6. WHEN a Safety_Officer views the dashboard, THE System SHALL display the average safety score across all drivers
7. WHEN a Safety_Officer views the dashboard, THE System SHALL display the count of active maintenance records
8. WHEN a Safety_Officer views the dashboard, THE System SHALL display the count of vehicles currently in shop
9. WHEN a Safety_Officer views the dashboard, THE System SHALL display a table of active maintenance records with vehicle, maintenance type, start date, and cost
10. WHEN a Safety_Officer views the dashboard, THE System SHALL display a chart showing distribution of driver safety scores
11. WHEN a Safety_Officer views the dashboard, THE System SHALL provide quick action buttons for "Add Driver", "Open Maintenance", and "Update Driver Status"
12. WHEN a Safety_Officer views the dashboard, THE System SHALL NOT display financial metrics such as revenue or expenses
13. WHEN a Safety_Officer views the dashboard, THE System SHALL NOT display trip details

---

### Requirement 6: Financial Analyst Dashboard

**User Story:** As a Financial Analyst, I want a finance-focused dashboard showing revenue, expenses, profitability, and cost trends, so that I can analyze financial performance without operational distractions.

#### Acceptance Criteria

1. WHEN a Financial_Analyst views the dashboard, THE System SHALL display total revenue from completed trips
2. WHEN a Financial_Analyst views the dashboard, THE System SHALL display total expenses across all categories
3. WHEN a Financial_Analyst views the dashboard, THE System SHALL display net profit calculated as total revenue minus total expenses
4. WHEN a Financial_Analyst views the dashboard, THE System SHALL display a pie chart of expenses by category
5. WHEN a Financial_Analyst views the dashboard, THE System SHALL display a bar chart of monthly expenses for the last 6 months
6. WHEN a Financial_Analyst views the dashboard, THE System SHALL display a line chart comparing monthly revenue versus monthly expenses
7. WHEN a Financial_Analyst views the dashboard, THE System SHALL display per-vehicle profitability showing vehicle, total revenue, total expenses, and net profit
8. WHEN a Financial_Analyst views the dashboard, THE System SHALL display top 5 expense categories by total amount
9. WHEN a Financial_Analyst views the dashboard, THE System SHALL display expense trend percentage change from previous month
10. WHEN a Financial_Analyst views the dashboard, THE System SHALL provide quick action buttons for "Add Expense" and "Export Financial Report"
11. WHEN a Financial_Analyst views the dashboard, THE System SHALL NOT display operational metrics such as active trips or vehicle availability
12. WHEN a Financial_Analyst views the dashboard, THE System SHALL NOT display driver information
13. WHEN a Financial_Analyst views the dashboard, THE System SHALL NOT display maintenance details

---

### Requirement 7: Role-Based Dashboard API Endpoint

**User Story:** As the backend system, I want to return different dashboard data based on the authenticated user's role, so that each role receives only the information they are authorized to see.

#### Acceptance Criteria

1. WHEN the GET /api/dashboard endpoint receives a request with a Fleet_Manager JWT, THE System SHALL return complete operational, financial, and safety metrics
2. WHEN the GET /api/dashboard endpoint receives a request with a Driver_User JWT, THE System SHALL return only trips where driver_id matches the user's driver profile
3. WHEN the GET /api/dashboard endpoint receives a request with a Safety_Officer JWT, THE System SHALL return license compliance metrics, safety scores, and maintenance information
4. WHEN the GET /api/dashboard endpoint receives a request with a Financial_Analyst JWT, THE System SHALL return revenue, expenses, profitability, and cost trends
5. THE System SHALL extract the user role from the authenticated JWT token
6. THE System SHALL query only the database tables and fields relevant to the requesting user's role
7. THE System SHALL NOT include sensitive operational data in Financial_Analyst responses
8. THE System SHALL NOT include financial data in Safety_Officer responses
9. THE System SHALL NOT include other drivers' trips in Driver_User responses
10. WHEN the GET /api/dashboard endpoint receives an unauthenticated request, THE System SHALL return HTTP 401 Unauthorized

---

### Requirement 8: Driver Trip Data Isolation

**User Story:** As a Driver, I want to see only my own trip information when I access trip-related endpoints, so that I cannot view or interfere with other drivers' assignments.

#### Acceptance Criteria

1. WHEN a Driver_User requests GET /api/trips, THE System SHALL return only trips where driver_id matches the current user's driver profile
2. WHEN a Driver_User requests GET /api/trips/:id, THE System SHALL return the trip details only if driver_id matches the current user's driver profile
3. WHEN a Driver_User requests a trip that belongs to another driver, THE System SHALL return HTTP 403 Forbidden
4. WHEN a Driver_User creates a trip via POST /api/trips, THE System SHALL automatically set the driver_id to the current user's driver profile
5. WHEN a Driver_User attempts to create a trip with a different driver_id, THE System SHALL reject the request with HTTP 403 Forbidden
6. WHEN a Fleet_Manager requests GET /api/trips, THE System SHALL return all trips regardless of driver assignment
7. WHEN a Safety_Officer requests GET /api/trips, THE System SHALL return all trips for safety monitoring purposes
8. THE System SHALL apply driver filtering at the database query level, not client-side filtering

---

### Requirement 9: Role-Based Navigation Menu

**User Story:** As a user of any role, I want to see only the navigation menu items relevant to my role, so that I am not confused by features I cannot access.

#### Acceptance Criteria

1. WHEN a Fleet_Manager views the navigation menu, THE System SHALL display links to Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel, and Expenses
2. WHEN a Driver_User views the navigation menu, THE System SHALL display links to Dashboard and Fuel only
3. WHEN a Safety_Officer views the navigation menu, THE System SHALL display links to Dashboard, Drivers, and Maintenance only
4. WHEN a Financial_Analyst views the navigation menu, THE System SHALL display links to Dashboard and Expenses only
5. THE System SHALL hide navigation links for modules the current user role cannot access
6. WHEN a user attempts to navigate directly to a URL for a module their role cannot access, THE System SHALL redirect to a Forbidden page
7. THE System SHALL display the current user's role in the navigation header
8. THE System SHALL provide a logout action in the navigation menu for all roles

---

### Requirement 10: Safety Officer Driver Management

**User Story:** As a Safety Officer, I want full access to view and manage all drivers including license compliance, so that I can maintain fleet safety standards.

#### Acceptance Criteria

1. WHEN a Safety_Officer accesses GET /api/drivers, THE System SHALL return all driver records
2. WHEN a Safety_Officer accesses POST /api/drivers, THE System SHALL create the new driver record
3. WHEN a Safety_Officer accesses PUT /api/drivers/:id, THE System SHALL update the driver record
4. WHEN a Safety_Officer views the Drivers page, THE System SHALL display all drivers with license number, expiry date, safety score, and status
5. WHEN a Safety_Officer views the Drivers page, THE System SHALL highlight drivers with expired licenses in red
6. WHEN a Safety_Officer views the Drivers page, THE System SHALL highlight drivers with expiring licenses in yellow
7. WHEN a Safety_Officer views the Drivers page, THE System SHALL provide a filter to show only drivers with license compliance issues
8. WHEN a Safety_Officer views a driver detail, THE System SHALL display full license information and compliance status
9. WHEN a Safety_Officer updates a driver status to "Suspended", THE System SHALL prevent that driver from being dispatched
10. WHEN a Safety_Officer updates a driver status to "Available", THE System SHALL allow that driver to be dispatched if license is valid

---

### Requirement 11: Safety Officer Maintenance Management

**User Story:** As a Safety Officer, I want to open and close maintenance records to ensure vehicles receive proper servicing, so that the fleet operates safely.

#### Acceptance Criteria

1. WHEN a Safety_Officer accesses GET /api/maintenance, THE System SHALL return all maintenance records
2. WHEN a Safety_Officer accesses POST /api/maintenance, THE System SHALL create a new maintenance record
3. WHEN a Safety_Officer accesses PUT /api/maintenance/:id/close, THE System SHALL close the maintenance record
4. WHEN a Safety_Officer opens maintenance, THE System SHALL change the vehicle status to "In Shop"
5. WHEN a Safety_Officer opens maintenance, THE System SHALL create a corresponding Maintenance expense record
6. WHEN a Safety_Officer closes maintenance, THE System SHALL change the vehicle status to "Available"
7. WHEN a Safety_Officer closes maintenance, THE System SHALL set maintenance status to "Completed"
8. WHEN a Safety_Officer attempts to open maintenance on a vehicle with status "On Trip", THE System SHALL reject the operation with error "Cannot open maintenance on vehicle currently on trip"
9. THE System SHALL execute maintenance operations within a database transaction
10. IF any step of the maintenance operation fails, THEN THE System SHALL rollback all changes

---

### Requirement 12: Professional UI Color Scheme

**User Story:** As any user, I want the application to have a professional, modern color scheme instead of generic blue and white, so that the system looks credible and well-designed.

#### Acceptance Criteria

1. THE System SHALL use a primary color that is not generic blue (#2563eb)
2. THE System SHALL define a complete color palette with primary, secondary, success, warning, danger, and neutral colors
3. THE System SHALL use colors with sufficient contrast ratio to meet WCAG AA accessibility standards
4. THE System SHALL apply colors consistently across all pages and components
5. THE System SHALL use subtle color gradients for visual interest where appropriate
6. THE System SHALL use muted background colors for cards and panels instead of pure white
7. THE System SHALL use color to convey status (success in green tones, danger in red tones, warning in amber tones)
8. THE System SHALL use color to create visual hierarchy (important elements in accent colors, secondary elements in muted colors)

---

### Requirement 13: Professional UI Typography

**User Story:** As any user, I want the application to use professional typography instead of default system fonts, so that content is readable and visually appealing.

#### Acceptance Criteria

1. THE System SHALL load at least one custom web font family for body text
2. THE System SHALL load at least one custom web font family for headings
3. THE System SHALL NOT use default system fonts as the primary typeface
4. THE System SHALL define a typographic scale with consistent heading sizes (h1, h2, h3, h4, h5, h6)
5. THE System SHALL use font weights effectively (light for secondary text, bold for emphasis)
6. THE System SHALL maintain line heights of 1.5 or greater for body text for readability
7. THE System SHALL limit line length to approximately 60-80 characters for optimal readability
8. THE System SHALL use consistent spacing between text elements

---

### Requirement 14: Professional UI Component Styling

**User Story:** As any user, I want modern, well-styled UI components with proper spacing and visual effects, so that the application feels polished and professional.

#### Acceptance Criteria

1. WHEN displaying cards, THE System SHALL apply subtle shadow effects for depth
2. WHEN a user hovers over interactive elements, THE System SHALL provide visual feedback with smooth transitions
3. THE System SHALL use consistent border radius across all components
4. THE System SHALL apply consistent padding and margin spacing using a spacing scale
5. THE System SHALL use consistent button styles with proper hover, active, and disabled states
6. WHEN displaying data tables, THE System SHALL use alternating row colors or hover effects for readability
7. THE System SHALL use modern input field styling with clear focus states
8. THE System SHALL apply smooth CSS transitions (200-300ms) for interactive state changes
9. THE System SHALL use icons consistently throughout the interface
10. THE System SHALL implement card-based layouts for grouping related content

---

### Requirement 15: Professional UI Loading States

**User Story:** As any user, I want to see sophisticated loading indicators instead of basic spinners, so that I understand the system is working and wait times feel shorter.

#### Acceptance Criteria

1. WHEN loading data for a data table, THE System SHALL display skeleton screens matching the table structure
2. WHEN loading dashboard metrics, THE System SHALL display skeleton screens matching the KPI card layout
3. WHEN loading a full page, THE System SHALL display a branded loading screen with animation
4. THE System SHALL NOT use generic spinner icons as the only loading indicator for full-page loads
5. THE System SHALL show loading progress where operation duration can be estimated
6. WHEN an operation takes longer than 2 seconds, THE System SHALL provide feedback about what is loading
7. THE System SHALL apply shimmer effects to skeleton screens to indicate activity

---

### Requirement 16: Professional UI Empty States

**User Story:** As any user, I want helpful, illustrated empty states instead of plain "No data" messages, so that I understand what to do next when sections are empty.

#### Acceptance Criteria

1. WHEN a data table has no records, THE System SHALL display an empty state with an icon or illustration
2. WHEN displaying an empty state, THE System SHALL include descriptive text explaining why the section is empty
3. WHEN displaying an empty state, THE System SHALL include a call-to-action button for the most relevant next action
4. THE System SHALL use different empty state messages for different contexts (no trips vs. no vehicles)
5. WHEN a filter returns no results, THE System SHALL display an empty state suggesting the user adjust filters
6. THE System SHALL style empty states with adequate padding and centering

---

### Requirement 17: Toast Notification System

**User Story:** As any user, I want visible success and error notifications for my actions instead of console logs, so that I know immediately whether operations succeeded or failed.

#### Acceptance Criteria

1. WHEN a create operation succeeds, THE System SHALL display a success toast notification
2. WHEN an update operation succeeds, THE System SHALL display a success toast notification
3. WHEN a delete operation succeeds, THE System SHALL display a success toast notification
4. WHEN any operation fails, THE System SHALL display an error toast notification with the error message
5. THE System SHALL automatically dismiss success toasts after 3 seconds
6. THE System SHALL automatically dismiss error toasts after 5 seconds
7. THE System SHALL allow users to manually dismiss any toast notification
8. THE System SHALL stack multiple simultaneous notifications vertically
9. THE System SHALL position toast notifications in a consistent location (top-right or bottom-right)
10. THE System SHALL style toast notifications with icons indicating success, error, warning, or info

---

### Requirement 18: Responsive Grid Layouts

**User Story:** As any user, I want responsive layouts that adapt gracefully to different screen sizes, so that I can use the system on various devices.

#### Acceptance Criteria

1. WHEN viewing the dashboard on a desktop screen, THE System SHALL display KPI cards in a 3-column grid
2. WHEN viewing the dashboard on a tablet screen, THE System SHALL display KPI cards in a 2-column grid
3. WHEN viewing the dashboard on a mobile screen, THE System SHALL display KPI cards in a single column
4. WHEN viewing data tables on small screens, THE System SHALL make tables horizontally scrollable or stack data responsively
5. WHEN viewing forms on small screens, THE System SHALL stack form fields vertically
6. THE System SHALL hide the sidebar navigation on mobile screens and replace it with a hamburger menu
7. THE System SHALL ensure touch targets are at least 44x44 pixels on mobile devices
8. THE System SHALL maintain readability at all screen sizes

---

### Requirement 19: Chart Data Visualization

**User Story:** As any user viewing charts, I want professional, interactive data visualizations using Recharts, so that I can understand trends and patterns in fleet data.

#### Acceptance Criteria

1. WHEN displaying revenue data, THE System SHALL render a bar chart with properly labeled axes
2. WHEN displaying expense categories, THE System SHALL render a pie chart with legend
3. WHEN displaying trends over time, THE System SHALL render a line chart with date axis
4. THE System SHALL enable tooltips on chart hover showing exact values
5. THE System SHALL use colors from the professional color palette in charts
6. THE System SHALL ensure chart legends are clear and positioned appropriately
7. THE System SHALL make charts responsive to container width
8. WHEN chart data is empty, THE System SHALL display an empty state instead of an empty chart frame
9. THE System SHALL label chart axes with units (dollars, counts, dates)
10. THE System SHALL format numeric values in charts with appropriate precision and thousand separators

---

### Requirement 20: Backend Transaction Safety for Maintenance

**User Story:** As the backend system, I want to ensure maintenance operations execute atomically within database transactions, so that vehicle states and expense records remain consistent.

#### Acceptance Criteria

1. WHEN opening maintenance, THE System SHALL execute all operations within a single database transaction
2. WHEN opening maintenance, THE System SHALL acquire a Row_Lock on the vehicle record
3. WHEN opening maintenance, THE System SHALL verify the vehicle is not "On Trip"
4. WHEN opening maintenance, THE System SHALL create the maintenance log record
5. WHEN opening maintenance, THE System SHALL update the vehicle status to "In Shop"
6. WHEN opening maintenance, THE System SHALL create a corresponding expense record with category "Maintenance"
7. IF any step of opening maintenance fails, THEN THE System SHALL rollback the entire transaction
8. WHEN closing maintenance, THE System SHALL execute all operations within a single database transaction
9. WHEN closing maintenance, THE System SHALL update the maintenance status to "Completed"
10. WHEN closing maintenance, THE System SHALL update the vehicle status to "Available"
11. IF any step of closing maintenance fails, THEN THE System SHALL rollback the entire transaction

---

### Requirement 21: Backend Transaction Safety for Fuel

**User Story:** As the backend system, I want to ensure fuel logging operations execute atomically within database transactions, so that fuel records and expense records remain consistent.

#### Acceptance Criteria

1. WHEN creating a fuel log, THE System SHALL execute all operations within a single database transaction
2. WHEN creating a fuel log, THE System SHALL create the fuel_logs record
3. WHEN creating a fuel log, THE System SHALL create a corresponding expense record with category "Fuel"
4. WHEN creating a fuel log, THE System SHALL set the expense amount equal to the fuel cost
5. WHEN creating a fuel log, THE System SHALL link the expense to the same vehicle_id
6. WHEN creating a fuel log, THE System SHALL link the expense to the same trip_id if provided
7. IF any step of creating a fuel log fails, THEN THE System SHALL rollback the entire transaction
8. THE System SHALL NOT create orphaned fuel records without corresponding expenses
9. THE System SHALL NOT create orphaned expense records without corresponding fuel logs

---

### Requirement 22: Backend Concurrent Dispatch Protection

**User Story:** As the backend system, I want to prevent two simultaneous dispatch operations from assigning the same vehicle or driver to different trips, so that resource allocation remains consistent.

#### Acceptance Criteria

1. WHEN processing a dispatch request, THE System SHALL begin a database transaction
2. WHEN processing a dispatch request, THE System SHALL acquire a Row_Lock on the trip record using SELECT FOR UPDATE
3. WHEN processing a dispatch request, THE System SHALL acquire a Row_Lock on the vehicle record using SELECT FOR UPDATE
4. WHEN processing a dispatch request, THE System SHALL acquire a Row_Lock on the driver record using SELECT FOR UPDATE
5. WHEN two dispatch requests attempt to use the same vehicle simultaneously, THE System SHALL allow only one to succeed
6. WHEN two dispatch requests attempt to use the same driver simultaneously, THE System SHALL allow only one to succeed
7. WHEN a dispatch operation acquires necessary locks, THE System SHALL verify all eligibility conditions before updating any records
8. IF any eligibility check fails after acquiring locks, THEN THE System SHALL rollback the transaction and release locks
9. WHEN a dispatch operation completes successfully, THE System SHALL commit the transaction and release all locks
10. THE System SHALL NOT implement dispatch logic without Row_Lock protection

---

### Requirement 23: Backend Comprehensive Dispatch Validation

**User Story:** As the backend system, I want to validate all dispatch eligibility rules before allowing a trip to be dispatched, so that only valid assignments are created.

#### Acceptance Criteria

1. WHEN dispatching a trip, THE System SHALL verify the trip status is "Draft"
2. IF trip status is not "Draft", THEN THE System SHALL return error code "INVALID_STATUS" with message "Only Draft trips can be dispatched"
3. WHEN dispatching a trip, THE System SHALL verify the vehicle status is "Available"
4. IF vehicle status is not "Available", THEN THE System SHALL return error code "VEHICLE_UNAVAILABLE" with message "Vehicle is not available for dispatch"
5. WHEN dispatching a trip, THE System SHALL verify the driver status is "Available"
6. IF driver status is not "Available", THEN THE System SHALL return error code "DRIVER_UNAVAILABLE" with message "Driver is not available for dispatch"
7. WHEN dispatching a trip, THE System SHALL verify the driver License_Expiry_Date is today or in the future
8. IF driver license is expired, THEN THE System SHALL return error code "LICENSE_EXPIRED" with message including the expiry date
9. WHEN dispatching a trip, THE System SHALL verify the cargo_weight does not exceed vehicle max_load_capacity
10. IF cargo exceeds capacity, THEN THE System SHALL return error code "CARGO_EXCEEDS_CAPACITY"
11. WHEN all validations pass, THE System SHALL update trip status to "Dispatched"
12. WHEN all validations pass, THE System SHALL update vehicle status to "On Trip"
13. WHEN all validations pass, THE System SHALL update driver status to "On Trip"
14. WHEN all validations pass, THE System SHALL record the current timestamp as dispatch_time

---

### Requirement 24: Backend Trip Completion Transaction

**User Story:** As the backend system, I want to ensure trip completion operations execute atomically within database transactions, so that trip records and resource states remain consistent.

#### Acceptance Criteria

1. WHEN completing a trip, THE System SHALL execute all operations within a single database transaction
2. WHEN completing a trip, THE System SHALL verify the trip status is "Dispatched"
3. IF trip status is not "Dispatched", THEN THE System SHALL return error code "INVALID_STATUS"
4. WHEN completing a trip, THE System SHALL require actual_distance as input
5. WHEN completing a trip, THE System SHALL require end_odometer as input
6. WHEN completing a trip, THE System SHALL update the trip status to "Completed"
7. WHEN completing a trip, THE System SHALL record the current timestamp as completed_time
8. WHEN completing a trip, THE System SHALL update the vehicle status to "Available"
9. WHEN completing a trip, THE System SHALL update the vehicle odometer to end_odometer value
10. WHEN completing a trip, THE System SHALL update the driver status to "Available"
11. IF any step of completing a trip fails, THEN THE System SHALL rollback the entire transaction

---

### Requirement 25: Backend Trip Cancellation Transaction

**User Story:** As the backend system, I want to ensure trip cancellation operations execute atomically within database transactions, so that trip records and resource states remain consistent.

#### Acceptance Criteria

1. WHEN cancelling a trip, THE System SHALL execute all operations within a single database transaction
2. WHEN cancelling a trip, THE System SHALL verify the trip status is "Draft" or "Dispatched"
3. IF trip status is "Completed" or "Cancelled", THEN THE System SHALL return error code "INVALID_STATUS"
4. WHEN cancelling a trip with status "Draft", THE System SHALL update only the trip status to "Cancelled"
5. WHEN cancelling a trip with status "Dispatched", THE System SHALL update the trip status to "Cancelled"
6. WHEN cancelling a trip with status "Dispatched", THE System SHALL update the vehicle status to "Available"
7. WHEN cancelling a trip with status "Dispatched", THE System SHALL update the driver status to "Available"
8. WHEN cancelling a trip, THE System SHALL record the current timestamp in a cancelled_at field
9. IF any step of cancelling a trip fails, THEN THE System SHALL rollback the entire transaction

---

### Requirement 26: Financial Analyst Expense Access

**User Story:** As a Financial Analyst, I want to view and create expense records but not access operational modules, so that I can perform financial analysis within my role boundaries.

#### Acceptance Criteria

1. WHEN a Financial_Analyst accesses GET /api/expenses, THE System SHALL return all expense records
2. WHEN a Financial_Analyst accesses POST /api/expenses, THE System SHALL create the expense record
3. WHEN a Financial_Analyst accesses GET /api/vehicles, THE System SHALL return HTTP 403 Forbidden
4. WHEN a Financial_Analyst accesses GET /api/drivers, THE System SHALL return HTTP 403 Forbidden
5. WHEN a Financial_Analyst accesses GET /api/trips, THE System SHALL return HTTP 403 Forbidden
6. WHEN a Financial_Analyst accesses GET /api/maintenance, THE System SHALL return HTTP 403 Forbidden
7. WHEN a Financial_Analyst accesses GET /api/fuel, THE System SHALL return HTTP 403 Forbidden
8. THE System SHALL enforce Financial Analyst access restrictions at the backend authorization middleware level
9. THE System SHALL NOT rely solely on frontend navigation hiding to restrict Financial Analyst access

---

### Requirement 27: Backend Authorization Middleware

**User Story:** As the backend system, I want centralized authorization middleware that enforces role-based access control on all protected endpoints, so that authorization logic is consistent and maintainable.

#### Acceptance Criteria

1. THE System SHALL implement an authorize middleware function that accepts allowed role names as parameters
2. WHEN an endpoint is decorated with authorize middleware, THE System SHALL extract the user role from the JWT token
3. WHEN the user role matches one of the allowed roles, THE System SHALL pass the request to the next handler
4. WHEN the user role does not match any allowed role, THE System SHALL return HTTP 403 Forbidden
5. WHEN the JWT token is missing or invalid, THE System SHALL return HTTP 401 Unauthorized before checking authorization
6. THE System SHALL apply authentication middleware before authorization middleware on all protected routes
7. THE System SHALL document the allowed roles for each endpoint in the route definition
8. THE System SHALL use consistent role string values across the entire application

---

### Requirement 28: Seed Data for All Roles

**User Story:** As a developer or tester, I want the database seed script to create sample users for all four roles, so that I can test role-specific features without manual setup.

#### Acceptance Criteria

1. WHEN the seed script executes, THE System SHALL create at least one user with role "Fleet Manager"
2. WHEN the seed script executes, THE System SHALL create at least one user with role "Driver"
3. WHEN the seed script executes, THE System SHALL create at least one user with role "Safety Officer"
4. WHEN the seed script executes, THE System SHALL create at least one user with role "Financial Analyst"
5. WHEN creating driver users, THE System SHALL create corresponding driver profile records
6. WHEN the seed script executes, THE System SHALL hash all passwords using bcrypt
7. WHEN the seed script executes, THE System SHALL create sample vehicles, trips, maintenance, fuel, and expense records
8. THE System SHALL document the seed user credentials in README or setup documentation

---

### Requirement 29: API Endpoint Coverage Verification

**User Story:** As a developer, I want to verify that all 27 documented API endpoints from context.md are implemented and accessible, so that the system meets the complete functional specification.

#### Acceptance Criteria

1. THE System SHALL implement POST /api/auth/register endpoint
2. THE System SHALL implement POST /api/auth/login endpoint
3. THE System SHALL implement GET /api/auth/me endpoint
4. THE System SHALL implement GET /api/dashboard endpoint
5. THE System SHALL implement GET /api/vehicles endpoint
6. THE System SHALL implement POST /api/vehicles endpoint
7. THE System SHALL implement GET /api/vehicles/:id endpoint
8. THE System SHALL implement PUT /api/vehicles/:id endpoint
9. THE System SHALL implement DELETE /api/vehicles/:id endpoint
10. THE System SHALL implement GET /api/drivers endpoint
11. THE System SHALL implement GET /api/drivers/available endpoint
12. THE System SHALL implement POST /api/drivers endpoint
13. THE System SHALL implement GET /api/trips endpoint
14. THE System SHALL implement POST /api/trips endpoint
15. THE System SHALL implement POST /api/trips/:id/dispatch endpoint
16. THE System SHALL implement POST /api/trips/:id/complete endpoint
17. THE System SHALL implement POST /api/trips/:id/cancel endpoint
18. THE System SHALL implement GET /api/maintenance endpoint
19. THE System SHALL implement POST /api/maintenance endpoint
20. THE System SHALL implement PUT /api/maintenance/:id/close endpoint
21. THE System SHALL implement GET /api/fuel endpoint
22. THE System SHALL implement POST /api/fuel endpoint
23. THE System SHALL implement GET /api/expenses endpoint
24. THE System SHALL implement POST /api/expenses endpoint
25. THE System SHALL verify each endpoint returns appropriate HTTP status codes
26. THE System SHALL verify each endpoint enforces documented role-based access control
27. THE System SHALL document any deviations from the context.md API specification

---

### Requirement 30: State Transition Enforcement

**User Story:** As the backend system, I want to enforce documented state transition rules for vehicles, drivers, trips, and maintenance, so that invalid state changes are prevented.

#### Acceptance Criteria

1. THE System SHALL allow vehicle transitions: Available to On Trip, On Trip to Available, Available to In Shop, In Shop to Available, Available to Retired
2. THE System SHALL reject vehicle transitions that are not documented as allowed
3. THE System SHALL allow driver transitions: Available to On Trip, On Trip to Available, Available to Suspended, Suspended to Available
4. THE System SHALL reject driver transitions that are not documented as allowed
5. THE System SHALL allow trip transitions: Draft to Dispatched, Dispatched to Completed, Draft to Cancelled, Dispatched to Cancelled
6. THE System SHALL reject trip transitions that are not documented as allowed
7. THE System SHALL allow maintenance transitions: Active to Completed
8. THE System SHALL reject maintenance transitions that are not documented as allowed
9. WHEN rejecting an invalid state transition, THE System SHALL return error code "INVALID_STATUS" with a descriptive message
10. THE System SHALL validate state transitions before executing any database updates

---

## Parser and Serializer Requirements

**Note**: This system does not currently require custom parsers or serializers beyond standard JSON handling provided by Express and Axios. JSON serialization/deserialization is handled by the framework. If custom parsers are added in the future, round-trip property testing should be implemented.

---

## Summary

This requirements specification addresses critical defects in license validation, implements comprehensive role-based access control with tailored dashboards for each user type, ensures proper data isolation, and elevates the user interface to a professional standard. The specification emphasizes backend enforcement of all business rules through transaction safety, row locking, and authorization middleware. Implementation of these requirements will transform FleetFlow from a generic CRUD application into a role-aware, secure, and visually polished fleet management system suitable for production use.
