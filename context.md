# FleetFlow — Vibe Coding Master Context

## 0. Instructions to the coding agent

You are implementing **FleetFlow**, a web-based **Transport Operations Management System** for a Software Engineering Lab project.

Treat this file as the implementation contract and source-of-truth summary of the supplied project materials. The supplied materials are:
- FleetFlow Software Requirements Specification (SRS)
- FleetFlow Software Design Document (Lab 3)
- FleetFlow Use Case Diagram
- FleetFlow Activity Diagram
- FleetFlow Class Diagram
- FleetFlow Sequence Diagram (Dispatch Trip workflow)
- Lab 1 project description / Agile SDLC selection
- Lab 5 UML submission artifact

### Absolute implementation rules
1. **Do not omit any requirement explicitly present below.**
2. You may add sensible improvements, UX polish, helper abstractions, tests, seed data, filters, pagination, logging, etc., but additions must not weaken, rename, remove, or contradict the documented requirements.
3. Do not silently change controlled vocabulary. In particular preserve the documented product name, roles, module names, API concepts, and state names.
4. The Software Design Document is explicitly a **pre-implementation design**. Do not assume that something is already implemented just because the design document names a file or module.
5. When the documents are underspecified, make a reasonable implementation choice, but record that choice in `README.md` or a dedicated `docs/ASSUMPTIONS.md`. Do not present an invented behavior as if it were a requirement.
6. The **backend is the authoritative enforcement point** for authentication, RBAC, and business rules. Frontend restrictions are only a usability layer.
7. Keep the implementation modular and aligned with the documented React/Vite + Express/Node + PostgreSQL architecture.
8. Prefer working, testable code over mock-only screens. Every major workflow must be wired end-to-end: UI → API → business logic → PostgreSQL → UI refresh.
9. Do not replace PostgreSQL with an in-memory store, SQLite, local JSON files, or another database unless the user explicitly asks for a temporary test-only substitute.
10. Do not remove validation because it makes demos easier. Invalid operations must fail cleanly and visibly.
11. Before modifying an existing repository, inspect the current structure and preserve compatible existing work. Avoid destructive rewrites unless necessary.
12. After implementation, run tests/lint/build (where available), fix errors, and update README/setup instructions so another student can run the project from a clean environment.

---

# 1. Product definition

**Product name:** FleetFlow

**Full description:** Transport Operations Management System.

FleetFlow centralizes day-to-day fleet operations that would otherwise be spread across spreadsheets/manual logbooks. The system manages:
- users/authentication
- vehicles
- drivers and licence/safety information
- trips
- maintenance
- fuel
- expenses
- dashboard / operational monitoring

The complete operational workflow is from authenticated access → resource management → trip creation/dispatch → trip completion or cancellation → post-trip maintenance/fuel/expense records → dashboard metric updates.

The system must prevent invalid assignments and inconsistent fleet states.

---

# 2. SDLC / development approach

The project follows **Agile Software Development Life Cycle (Agile SDLC)**.

Implementation should therefore be incremental and modular:
1. Authentication and authorization
2. Fleet / vehicle management
3. Driver management
4. Trip management
5. Maintenance
6. Fuel and expenses
7. Dashboard / analytics
8. Testing, integration, refinement

Modules should be independently testable and integrated through the documented API boundary.

---

# 3. Required technology stack

Use the stack specified in the design document:

### Frontend
- React 18
- Vite
- React Router
- Axios
- Zod for client-side schema validation
- Recharts for dashboard charts / metrics

### Backend
- Node.js
- Express 5
- REST-style JSON API
- JWT authentication
- bcrypt password hashing

### Database
- PostgreSQL
- UUID primary keys
- foreign-key relationships
- database constraints
- transactions for multi-record state changes

### Configuration
Use environment variables, at minimum:
- `VITE_API_URL` — frontend API base URL; default `/api` during development
- `DATABASE_URL` — backend PostgreSQL connection string
- `JWT_SECRET` — JWT signing/verifying secret; never hard-code it

Do not hard-code secrets.

---

# 4. System architecture

Implement a three-layer logical architecture:

### Presentation layer
React pages, reusable components, routing, role-aware navigation, forms, validation, status badges, dashboard.

### Application / business logic layer
Express routes, middleware, controllers, services, repositories, validation, transactions, authorization.

### Persistence layer
PostgreSQL schema, constraints, indexes, transactional DB operations.

### Request flow
1. User selects an action / opens a page.
2. Page-level API wrapper calls the centralized Axios client.
3. JWT bearer token is included for protected operations.
4. Express route receives the request.
5. Authentication middleware verifies JWT before authorization/domain work.
6. Role middleware checks permission.
7. Controller validates input and calls service/repository.
8. Service enforces business rules and performs DB operations.
9. Multi-record state changes use a transaction.
10. Backend returns JSON success/error.
11. Frontend refreshes/updates the view and shows loading, validation, or error feedback.

### Required frontend structure / naming alignment
Keep these planned locations/names where practical:
- `client/src/App.jsx`
- `client/src/pages/*`
- `client/src/components/*`
- `client/src/api/*`
- `client/src/services/api.js`
- `client/src/context/AuthContext.jsx`
- `client/src/routes/ProtectedRoute.jsx`
- `client/src/routes/RoleRoute.jsx`
- `client/src/schemas/*`

### Required backend structure / naming alignment
Keep these planned locations/names where practical:
- `server/src/app.js`
- `server/src/server.js`
- `server/src/config/db.js`
- `server/src/modules/auth/*`
- `server/src/modules/vehicle/*`
- `server/src/modules/driver/*`
- `server/src/modules/trip/*`
- `server/src/modules/maintenance/*`
- `server/src/modules/fuel/*`
- `server/src/modules/expense/*`
- `server/src/modules/dashboard/*`

Modules that need richer rules should have clear service/repository separation.

### Database
- `database/schema.sql` is the planned persistence schema entry point.
- Use migrations as an optional improvement if the repository already has a migration framework.
- Keep `schema.sql` or equivalent documentation aligned with the approved logical model.

---

# 5. User roles

The four documented operational roles are:
1. **Fleet Manager**
2. **Driver**
3. **Safety Officer**
4. **Financial Analyst**

### Role responsibilities

**Fleet Manager**
- fleet-wide planning
- vehicle management
- driver management
- trip management
- maintenance
- fuel
- expenses
- operational control and cost review

**Driver**
- view assigned trips
- create/perform trip-related actions according to authorization
- complete/cancel assigned trips where permitted
- record trip-related fuel information

**Safety Officer**
- monitor licence validity
- review driver safety/compliance
- create/open and close maintenance records
- maintenance/safety oversight

**Financial Analyst**
- review expenses
- review profitability / financial indicators
- expense analysis

### Important UML discrepancy to handle explicitly
The supplied Class Diagram visually contains an additional `ADMIN` value in `UserRole`, and an additional `INACTIVE` value in `DriverStatus`. The SRS and Software Design Document define the intended operational roles/states without these additions.

Therefore:
- **Required operational roles are exactly the four documented roles above.**
- Do not expose `ADMIN` as a normal FleetFlow role unless existing project code already requires it.
- Treat Class-Diagram-only `ADMIN` as an unresolved UML inconsistency, not a mandatory feature.
- Document `INACTIVE` in the same way: it is not a documented operational driver state; do not make it a required workflow state.
- Do not silently rename the four required roles.

---

# 6. Authentication and authorization

### Functional requirements
- Login using email/password.
- Registration is supported.
- Unauthenticated users must be denied protected access.
- Permissions are role-based.
- Current-user session lookup is supported.
- Passwords are hashed with bcrypt and never stored as plaintext.
- JWT is signed with a secret stored in `JWT_SECRET`.
- JWT should carry only the minimum identity information required for authorization.

### API
- `POST /api/auth/register` — public
- `POST /api/auth/login` — public
- `GET /api/auth/me` — authenticated

### Frontend
Provide:
- Login / Sign Up screen with tabs or equivalent
- email
- password
- role selection during registration
- authenticated session state through `AuthContext`
- protected routes
- role-specific routes/navigation
- clear login/registration validation and errors

---

# 7. Functional modules

## 7.1 Vehicle Management

Maintain vehicle/fleet-asset information:
- registration number
- vehicle name
- model
- vehicle type
- region
- maximum load capacity
- odometer
- acquisition cost
- status

### Vehicle status values
- `Available`
- `On Trip`
- `In Shop`
- `Retired`

### Required operations
- list vehicles
- filter/search vehicles
- view a vehicle
- create vehicle
- update vehicle
- retire/delete vehicle according to the documented restriction

### API
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/vehicles/:id`
- `PUT /api/vehicles/:id`
- `DELETE /api/vehicles/:id`

### Rules
- newly created vehicle → `Available`
- vehicle on a trip cannot be assigned to another active trip
- `In Shop` vehicle cannot be dispatched
- `Retired` vehicle cannot be dispatched
- vehicle may be retired only when not participating in an active trip or active maintenance
- deleting a vehicle participating in an active trip or active maintenance record must be prohibited

The design says “retire/delete”. Preserve the `Retired` state and the documented deletion endpoint; where implementation detail is needed, prefer data-preserving retirement/soft-delete semantics and document that assumption rather than physically deleting operational history.

### Validation
- registration number required and unique
- vehicle name required
- vehicle type required
- region required
- capacity `> 0`
- odometer `>= 0`
- acquisition cost `>= 0`

---

# 8. Driver Management

Maintain:
- driver identity
- licence number
- licence category
- licence expiry date
- phone/contact number
- safety score
- availability/status

### Driver status values
Required documented states:
- `Available`
- `On Trip`
- `Suspended`

### Rules
- newly created driver → `Available`
- expired licence → not eligible for dispatch
- `Suspended` driver → not eligible for dispatch
- driver already `On Trip` → cannot receive another active trip
- licence number must be unique
- invalid assignments rejected

### API
- `GET /api/drivers`
- `GET /api/drivers/available`
- `POST /api/drivers`

### Validation
- licence number required
- licence category required
- expiry must be a valid date
- operationally accepted driver must not have licence expiry earlier than the current date
- phone length/format validated when provided; exact format is not specified by the source docs, so choose a reasonable implementation and document it
- safety score must be `0–100`

---

# 9. Trip Management

Trip lifecycle:
- `Draft`
- `Dispatched`
- `Completed`
- `Cancelled`

Allowed transitions:
- `Draft → Dispatched`
- `Dispatched → Completed`
- `Draft → Cancelled`
- `Dispatched → Cancelled`

### Trip fields
- id
- vehicle_id
- driver_id
- source
- destination
- cargo_weight
- planned_distance
- actual_distance
- revenue
- status
- dispatch_time
- completed_time
- start_odometer
- end_odometer

The class diagram additionally shows `scheduledDate` and `cancelledAt`. These are useful implementation fields and may be included, but do not remove any SRS/design field.

### Required operations
- list trips
- create trip
- dispatch trip
- complete trip
- cancel trip

### API
- `GET /api/trips`
- `POST /api/trips`
- `POST /api/trips/:id/dispatch`
- `POST /api/trips/:id/complete`
- `POST /api/trips/:id/cancel`

### Trip creation validation
- vehicle identifier must be a valid UUID
- driver identifier must be a valid UUID
- source required
- destination required
- cargo weight `> 0`
- planned distance `> 0`
- revenue `>= 0`
- cargo weight must not exceed selected vehicle maximum load capacity

### Dispatch rules
A trip may be dispatched only when:
- trip status is `Draft`
- selected vehicle is available
- selected driver is available
- driver is not suspended
- driver's licence is valid/not expired
- vehicle is not retired
- vehicle is not in maintenance / `In Shop`
- selected resources are not already reserved by another active trip

On successful dispatch:
- trip → `Dispatched`
- vehicle → `On Trip`
- driver → `On Trip`
- dispatch timestamp recorded
- starting odometer captured if needed by the implementation

### Completion rules
- only `Dispatched` trips may be completed
- actual distance is required
- ending odometer is required
- trip → `Completed`
- vehicle → `Available`
- driver → `Available`
- vehicle odometer updated
- completion timestamp recorded

### Cancellation rules
- `Draft` or `Dispatched` trip may be cancelled
- if an active/dispatched trip is cancelled, vehicle and driver reservations must be released
- trip → `Cancelled`
- cancellation timestamp may be recorded as a supporting field

---

# 10. Maintenance Management

Maintain maintenance logs with:
- id
- vehicle_id
- maintenance_type
- description
- cost
- start_date
- end_date
- status

Maintenance states:
- `Active`
- `Completed`

### Required operations
- list maintenance records
- create/open maintenance
- close maintenance

### API
- `GET /api/maintenance`
- `POST /api/maintenance`
- `PUT /api/maintenance/:id/close`

### Rules
Opening maintenance:
- must lock/validate the vehicle state
- reject if vehicle is `On Trip`
- create maintenance log
- set vehicle → `In Shop`
- create corresponding `Maintenance` expense
- commit atomically

Closing maintenance:
- maintenance → `Completed`
- vehicle returns to `Available` unless it is `Retired`

Validation:
- vehicle identifier required/valid
- maintenance type required
- cost `>= 0`

---

# 11. Fuel Management

Maintain fuel records:
- id
- vehicle_id
- trip_id (optional)
- liters / fuel quantity
- cost
- fuel_date / date

### API
- `GET /api/fuel`
- `POST /api/fuel`

### Required behavior
- record fuel quantity and cost against a vehicle
- optionally associate the entry with a trip
- every fuel entry creates a corresponding `Fuel` expense so cost reporting remains consistent
- fuel creation must be transactional: create fuel log + create expense + commit

Validation:
- vehicle identifier valid
- trip identifier valid when supplied
- numeric values validated
- monetary amounts non-negative
- do not silently invent stricter source requirements where the docs are intentionally generic

---

# 12. Expense Management

Maintain operational expenses:
- id
- vehicle_id (optional)
- trip_id (optional)
- category
- amount
- description
- expense_date / date

### Supported expense categories
- `Tolls`
- `Parking`
- `Maintenance`
- `Fuel`
- `Insurance`
- `Other`

### API
- `GET /api/expenses`
- `POST /api/expenses`

### Access
- Fleet Manager
- Financial Analyst

### Rules
- amounts must be non-negative
- category must be constrained to supported categories
- optional vehicle/trip links must reference valid rows when supplied
- manual expenses and system-generated expenses both live in the expense ledger

---

# 13. Dashboard & Analytics

### API
- `GET /api/dashboard`

### Required dashboard indicators
- active trips
- available vehicles
- vehicles in shop
- completed-trip revenue
- expenses
- net profit
- per-vehicle ROI / profitability indicators
- active-trip monitoring / watchlist

Dashboard metrics must change when underlying fleet/trip/maintenance/fuel/expense records change.

### Financial definitions
The source docs require revenue, expenses, net profit and per-vehicle ROI, but do not fully specify every exact formula. Implement transparently, for example:
- Net profit = completed-trip revenue − recorded expenses
- ROI = clearly documented profit/return measure relative to acquisition cost

Use a consistent formula and document the assumption; never claim the exact formula was mandated by the supplied documents when it was not.

### Suggested UI
- KPI cards
- active-trip watchlist
- availability summary
- revenue/expense indicators
- charts using Recharts where useful

---

# 14. API conventions

All APIs use HTTP/HTTPS with JSON request/response bodies.

Protected APIs use:
`Authorization: Bearer <JWT>`

Use consistent response semantics:
- success indicator
- data on success
- structured error object on failure

Recommended implementation shape (the design allows this level of detail to be chosen):
```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "error": {
    "code": "VEHICLE_UNAVAILABLE",
    "message": "Selected vehicle is not available for dispatch"
  }
}
```

### Required HTTP behavior
- `400` — validation/business-input errors
- `401` — authentication failures
- `403` — authorization failures
- `404` — missing resources
- `500` — unexpected server failures

Stable domain error codes should include, where applicable:
- `VEHICLE_UNAVAILABLE`
- `DRIVER_UNAVAILABLE`
- `LICENSE_EXPIRED`
- `CARGO_EXCEEDS_CAPACITY`
- `INVALID_STATUS`
- `NOT_FOUND`

Normalize backend API errors in the frontend and show actionable feedback instead of silently failing.

---

# 15. Complete endpoint catalogue and access

| Module | Method | Endpoint | Access |
|---|---|---|---|
| Auth | POST | `/api/auth/register` | Public |
| Auth | POST | `/api/auth/login` | Public |
| Auth | GET | `/api/auth/me` | Authenticated |
| Dashboard | GET | `/api/dashboard` | Authenticated |
| Vehicles | GET | `/api/vehicles` | Authenticated |
| Vehicles | POST | `/api/vehicles` | Fleet Manager |
| Vehicles | GET | `/api/vehicles/:id` | Authenticated |
| Vehicles | PUT | `/api/vehicles/:id` | Fleet Manager |
| Vehicles | DELETE | `/api/vehicles/:id` | Fleet Manager |
| Drivers | GET | `/api/drivers` | Authenticated |
| Drivers | GET | `/api/drivers/available` | Authenticated |
| Drivers | POST | `/api/drivers` | Fleet Manager / Safety Officer |
| Trips | GET | `/api/trips` | Authenticated |
| Trips | POST | `/api/trips` | Fleet Manager / Driver |
| Trips | POST | `/api/trips/:id/dispatch` | Fleet Manager / Driver |
| Trips | POST | `/api/trips/:id/complete` | Fleet Manager / Driver |
| Trips | POST | `/api/trips/:id/cancel` | Fleet Manager / Driver |
| Maintenance | GET | `/api/maintenance` | Authenticated |
| Maintenance | POST | `/api/maintenance` | Fleet Manager / Safety Officer |
| Maintenance | PUT | `/api/maintenance/:id/close` | Fleet Manager / Safety Officer |
| Fuel | GET | `/api/fuel` | Authenticated |
| Fuel | POST | `/api/fuel` | Fleet Manager / Driver |
| Expenses | GET | `/api/expenses` | Fleet Manager / Financial Analyst |
| Expenses | POST | `/api/expenses` | Fleet Manager / Financial Analyst |

Backend must enforce access regardless of what the frontend displays.

---

# 16. Database design

Use PostgreSQL.

Use UUIDs for primary keys.

### Core tables/entities

#### `users`
- id UUID
- name
- email
- password/password_hash
- role
- is_active
- created_at

Rules:
- email unique
- role is controlled
- may optionally link to a driver profile

#### `vehicles`
- id UUID
- registration_no
- vehicle_name
- model
- vehicle_type
- max_load_capacity
- odometer
- acquisition_cost
- status
- region

Rules:
- registration_no unique
- FK references from trips, maintenance, fuel, expenses

#### `drivers`
- id UUID
- user_id (optional)
- license_no
- license_category
- license_expiry
- phone/contact
- safety_score
- status

Rules:
- license_no unique
- driver profile may link to a user

#### `trips`
- id UUID
- vehicle_id
- driver_id
- source
- destination
- cargo_weight
- planned_distance
- actual_distance
- revenue
- status
- dispatch_time
- completed_time
- start_odometer
- end_odometer

#### `maintenance_logs`
- id UUID
- vehicle_id
- maintenance_type
- description
- cost
- start_date
- end_date
- status

#### `fuel_logs`
- id UUID
- vehicle_id
- trip_id nullable
- liters
- cost
- fuel_date

#### `expenses`
- id UUID
- vehicle_id nullable
- trip_id nullable
- category
- amount
- description
- expense_date

### Integrity constraints
- unique `users.email`
- unique `vehicles.registration_no`
- unique `drivers.license_no`
- foreign keys reference valid parent rows or NULL where relationship is optional
- cargo weight cannot exceed vehicle capacity at trip creation
- accepted operational driver cannot have an expired licence
- amounts/capacities/distances follow appropriate non-negative/positive constraints
- delete of a vehicle involved in active trip or active maintenance is prohibited

### Indexing
Create indexes for frequently used:
- registration_no
- email
- license_no
- status fields
- vehicle_id
- driver_id
- trip_id
- date fields used in filters/joins/dashboard aggregates

Tune after profiling if necessary.

---

# 17. Transactional workflows — critical correctness

Do not implement these as a set of unrelated writes. Use PostgreSQL transactions and row locks where required.

## Dispatch trip transaction
1. `BEGIN`
2. lock trip
3. verify trip is `Draft`
4. lock selected vehicle
5. lock selected driver
6. verify vehicle availability
7. verify driver availability/status
8. verify licence validity
9. update trip to `Dispatched`
10. set vehicle → `On Trip`
11. set driver → `On Trip`
12. record dispatch data
13. `COMMIT`

For concurrency, use row-level locking such as `SELECT ... FOR UPDATE` on the relevant trip/vehicle/driver records so two simultaneous dispatch attempts cannot both succeed for the same resources.

On any failure:
- rollback
- return structured stable error code/message

## Complete trip transaction
1. `BEGIN`
2. lock trip
3. verify `Dispatched`
4. record actual distance, ending odometer, completion time
5. set vehicle → `Available`
6. update vehicle odometer
7. set driver → `Available`
8. set trip → `Completed`
9. `COMMIT`

## Cancel trip transaction
1. `BEGIN`
2. lock trip
3. if dispatched, restore vehicle/driver availability
4. set trip → `Cancelled`
5. `COMMIT`

## Open maintenance transaction
1. `BEGIN`
2. lock vehicle
3. reject if vehicle is `On Trip`
4. create maintenance log
5. set vehicle → `In Shop`
6. create `Maintenance` expense
7. `COMMIT`

## Fuel transaction
1. `BEGIN`
2. create fuel log
3. create `Fuel` expense
4. `COMMIT`

---

# 18. State management contract

### Vehicle
`Available ↔ On Trip`

`Available → In Shop → Available`

`Available → Retired`

Restrictions:
- `In Shop` and `Retired` cannot dispatch
- only valid transitions allowed

### Driver
`Available ↔ On Trip`

`Suspended` blocks dispatch.

### Trip
`Draft → Dispatched → Completed`

`Draft → Cancelled`

`Dispatched → Cancelled`

### Maintenance
`Active → Completed`

Do not allow arbitrary status jumps from the UI.

---

# 19. UI / UX requirements

Use a consistent application shell:
- sidebar navigation
- top bar
- page header
- responsive content grid

### Common UI principles
- tables for operational records
- modal forms for focused create/update actions
- status badges
- inline validation
- clear empty states
- clear loading states
- clear API/error states
- responsive layout
- role-focused navigation

### Required screens

#### Login / Sign Up
- branding
- sign-in/sign-up tabs or equivalent
- email
- password
- role selection
- validation
- useful error messages

#### Dashboard
- KPI cards
- active trip watchlist
- vehicle availability
- revenue/expense indicators
- profitability metrics

#### Vehicles
- toolbar
- search/filter
- data table
- add/edit modal
- view/inspect
- retire/delete action

#### Drivers
- driver table
- licence fields
- safety fields
- add-driver modal
- eligibility visibility

#### Trips
- trip table
- route details
- cargo details
- create form
- dispatch action
- complete action
- cancel action
- state/status visibility

#### Maintenance
- maintenance table
- add/open-maintenance modal
- close action
- vehicle state visibility

#### Fuel
- fuel log table
- entry form
- review recorded transactions

#### Expenses
- expense table
- entry form
- review costs
- category visibility

#### Forbidden / Not Found
- clear explanatory message
- navigation action back to a valid place
- handle both unauthorized access and invalid routes appropriately

---

# 20. Role-based navigation

### Fleet Manager
Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel, Expenses

### Driver
Dashboard, Trips, Fuel

### Safety Officer
Dashboard, Drivers, Maintenance

### Financial Analyst
Dashboard, Expenses

Users should not see irrelevant navigation items, but backend authorization still remains authoritative.

---

# 21. Required reusable frontend components

Implement or preserve reusable components corresponding to the design:
- `DataTable`
- `KpiCard`
- `StatusBadge`
- `PageHeader`
- `ModuleToolbar`
- `Modal`
- `InlineError`
- `PageLoader`
- `AppErrorBoundary`

Responsibilities:
- DataTable — common table structure, loading, empty states
- KpiCard — label/value KPI
- StatusBadge — consistent operational states
- PageHeader — title + page actions
- ModuleToolbar — search/filter/page controls
- Modal — reusable create/edit interaction
- InlineError — field/action-level errors
- PageLoader — loading feedback
- AppErrorBoundary — prevent a render error from crashing the whole UI

---

# 22. Validation requirements

### Authentication
- valid email
- password required
- registration name/email/password/role required
- password minimum 8 characters

### Vehicle
- registration/name/type/region required
- capacity > 0
- odometer >= 0
- acquisition cost >= 0

### Driver
- licence number/category required
- valid expiry date
- phone length validated if provided
- safety score 0–100

### Trip
- valid vehicle UUID
- valid driver UUID
- source/destination required
- cargo weight > 0
- planned distance > 0
- revenue >= 0
- capacity check

### Maintenance
- valid vehicle identifier
- maintenance type required
- cost >= 0

### Fuel / Expense
- validate vehicle and numeric inputs
- amounts non-negative
- supported categories only for expenses

Do validation at both client and backend layers where practical. Never rely only on client validation for correctness or security.

---

# 23. Security requirements

Mandatory:
- bcrypt password hashing
- JWT auth
- JWT secret outside source code
- protected endpoints verify authentication before role checks/domain work
- RBAC on backend
- parameterized SQL / safe query parameter binding
- frontend route protection is not a security boundary

For production hardening, the design calls for:
- HTTPS
- secure token handling
- rate limiting
- appropriate security headers
- protected secret storage

These are deployment hardening items; the academic prototype need not claim production-grade infrastructure unless implemented.

---

# 24. Non-functional requirements

### Performance
- pooled PostgreSQL connections where appropriate
- indexed lookups
- efficient SQL aggregates
- avoid unnecessary API calls
- normal CRUD, dispatch, and dashboard actions should respond promptly after committed DB changes

### Reliability
- transactions for multi-record state changes
- rollback on failure
- consistent trip/vehicle/driver state

### Security
- JWT
- RBAC
- bcrypt
- parameterized SQL
- HTTPS in production
- secure configuration

### Usability
- consistent layouts
- status badges
- clear validation
- clear feedback
- responsive design
- role-focused navigation

### Maintainability
- domain-oriented backend modules
- reusable frontend components
- centralized API utilities
- validation schemas
- separation of concerns

### Scalability
- stateless frontend
- backend extensibility
- PostgreSQL as shared source of truth

### Testability
- isolate validation/service/repository concerns so business rules can be tested independently

### Availability
- health checks
- DB connection error handling
- graceful application-level failure messages

---

# 25. Error handling

Use stable domain codes and meaningful messages.

At minimum support:
- `VEHICLE_UNAVAILABLE`
- `DRIVER_UNAVAILABLE`
- `LICENSE_EXPIRED`
- `CARGO_EXCEEDS_CAPACITY`
- `INVALID_STATUS`
- `NOT_FOUND`

Frontend behavior:
- display inline form errors close to fields when possible
- display action errors near the triggering control
- display page-level errors when appropriate
- never silently swallow API failures
- distinguish validation, authentication, authorization, not-found, and unexpected errors

---

# 26. UML / model alignment

The implementation should remain conceptually consistent with the supplied UML diagrams.

## Use Case Diagram
The system contains these major use cases:
- Log in / Register
- View Dashboard & KPIs
- Manage Vehicles (Create / View / Update / Retire)
- Manage Drivers & Licence / Safety Information
- Create Trip
- Dispatch Trip
- Complete Trip
- Cancel Trip
- Manage Maintenance (Open / Close)
- Record / Review Fuel
- Record / Review Expenses

Actors:
- Fleet Manager
- Driver
- Safety Officer
- Financial Analyst

Protected operations require authentication and role-based authorization.

## Activity Diagram
The central flow is:
1. user opens FleetFlow and logs in
2. credentials valid?
3. if not, return to login / retry
4. if valid, apply role-based access
5. user views dashboard / selects operation
6. operational action branches into maintenance, fuel, expenses, and trip management
7. for trip management: create trip with route/vehicle/driver/cargo/distance
8. validate vehicle availability, driver licence/status, and cargo capacity
9. if validation fails, correct input / choose another action
10. if validation passes, dispatch trip
11. vehicle and driver become `On Trip`
12. trip proceeds
13. user completes or cancels
14. completion records actual distance/end odometer and returns resources to `Available`
15. cancellation releases reserved resources
16. dashboard metrics reflect trip/maintenance/fuel/expense changes

## Class Diagram
The conceptual classes visible in the supplied diagram include:
- User
- FleetManager
- Driver role/user class
- SafetyOfficer
- FinancialAnalyst
- Fleet
- Vehicle
- Driver entity/profile
- Trip
- Maintenance
- Dashboard
- AnalyticsService
- FuelLog
- Expense
- UserRole enum
- VehicleStatus enum
- DriverStatus enum
- TripStatus enum

The class diagram also shows conceptual methods such as:
- User: login, validatePassword, logout, updateProfile
- FleetManager: manageFleet, viewTrips, updateStatus
- Driver role: viewTrips, updateStatus, submitReport
- SafetyOfficer: checkLicences, viewCompliance, generateReport
- FinancialAnalyst: viewReports, analyzeCosts, exportData
- Fleet: addVehicle, removeVehicle, getVehicles
- Vehicle: updateStatus, setAvailable, setInShop, setRetired
- Driver entity: updateStatus, checkLicence
- Trip: dispatch, complete, cancel
- Maintenance: open, close, updateStatus
- Dashboard: getMetrics
- AnalyticsService: generateKPIs, getFleetMetrics, getFinancialReport, getOperationalReport
- FuelLog: record, calculateCost
- Expense: add, update

The implementation can use service/controller/repository terminology instead of literally reproducing UML methods, but every business responsibility represented by the diagram must remain covered.

### Important class-diagram naming conflicts
The Class Diagram has both:
- a `Driver` role/subclass-like concept under `User`
- a `Driver` domain/entity concept

Do not create a confusing single JavaScript/TypeScript class that merges unrelated responsibilities merely to copy the diagram text literally. Preserve the conceptual distinction while using practical names/namespaces in code, and document any naming mapping.

---

# 27. Dispatch Sequence Diagram alignment

The supplied Dispatch Trip sequence is centered on:
- User
- React/Vite Frontend
- Express API
- Auth + Role Middleware
- Trip Controller
- Trip Service
- PostgreSQL

Required conceptual interaction:
1. User selects Dispatch Trip.
2. Frontend sends `POST /api/trips/:id/dispatch` with JWT.
3. Auth/role middleware verifies JWT.
4. Invalid authentication/role is rejected.
5. Express passes request to Trip Controller.
6. Controller calls Trip Service.
7. Trip Service begins a transaction.
8. Trip row is locked and status checked (`Draft`).
9. Vehicle row is locked and validated.
10. Driver row is locked and validated.
11. Validate availability and licence/status.
12. On failure, rollback and return a stable error (e.g. 400 with domain code).
13. On success, update trip → `Dispatched` and set dispatch data.
14. Update vehicle → `On Trip`.
15. Update driver → `On Trip`.
16. Commit transaction.
17. Return updated trip.
18. Express returns successful JSON response.
19. Frontend updates trip status to `Dispatched`.

The implementation must preserve the concurrency intent of the sequence diagram: a database transaction with row locking so the same vehicle/driver cannot be successfully dispatched to competing active trips simultaneously.

---

# 28. Out of scope unless later requested

Do **not** make any of these core requirements:
- production deployment
- real-world telematics integration
- payment processing
- GPS hardware integration
- mobile-native application
- external accounting-system integration

These may be future extensions.

---

# 29. Traceability expectations

Every major source requirement should be traceable to code.

Maintain an implementation-oriented traceability mindset:
- SRS FR-01 → authentication/RBAC
- FR-02 → vehicle management
- FR-03 → driver management
- FR-04 → trips
- FR-05 → maintenance
- FR-06 → fuel/expenses
- FR-07 → dashboard
- BR-01 → dispatch eligibility
- BR-02 → licence/suspension checks
- BR-03 → resource concurrency/state checks
- BR-04 → cargo capacity
- BR-05 → dispatch resource states
- BR-06 → completion/cancellation resource release
- BR-07 → maintenance vehicle states

Where useful, create a lightweight `docs/TRACEABILITY.md` linking each requirement/business rule to modules/tests.

---

# 30. Testing strategy

Testing must exist alongside development.

### Unit tests
Cover:
- schema validation
- formatting helpers
- status transition helpers
- domain utility functions

### Service tests
Cover:
- dispatch eligibility
- cargo capacity
- licence expiry
- vehicle/driver state transitions
- completion
- cancellation
- maintenance restrictions
- fuel/expense transactional behavior where practical

### API integration tests
Cover:
- auth endpoints
- CRUD endpoints
- role authorization
- trip transaction workflows
- expected HTTP response codes/shape

### Database tests
Cover:
- foreign keys
- uniqueness
- transaction rollback
- concurrent dispatch protection

### UI/system tests
Cover:
- login
- role navigation
- create vehicle
- create driver
- create trip
- dispatch
- complete/cancel
- maintenance open/close
- fuel entry
- expense entry
- dashboard update

### Non-functional checks
- response-time sampling
- security review
- responsive layout checks

---

# 31. Critical acceptance scenarios — must pass

These are non-negotiable acceptance cases:

1. Two simultaneous attempts to dispatch the same vehicle/driver must **not both succeed**.
2. A driver with an expired licence must **not** be dispatched.
3. A trip whose cargo exceeds vehicle capacity must be **rejected**.
4. Opening maintenance for an `On Trip` vehicle must be **rejected**.
5. Completing a trip must release driver and vehicle and update vehicle odometer.
6. Cancelling an active/dispatched trip must release reserved resources.
7. Fuel and maintenance entries must appear in expense-based cost calculations through corresponding `Fuel`/`Maintenance` expense records.

---

# 32. Implementation workflow for the vibe-coding agent

Use this development sequence unless the repository state makes a small reordering necessary:

### Phase 1 — Audit before coding
- inspect existing repository
- identify frontend/backend/database setup
- identify current commands/scripts
- locate existing schema/migrations
- locate any existing implementation of required modules
- compare actual files with the planned structure
- do not rewrite working code blindly

### Phase 2 — Foundation
- configure frontend/backend
- configure PostgreSQL connection
- create schema / migrations
- add env handling
- establish API error handling
- establish auth and RBAC middleware

### Phase 3 — Core CRUD
- vehicles
- drivers
- trips
- maintenance
- fuel
- expenses

### Phase 4 — Business-critical workflows
- dispatch transaction + row locking
- completion transaction
- cancellation transaction
- maintenance state transition
- fuel → expense transaction

### Phase 5 — UI
- app shell
- auth screens
- role navigation
- dashboard
- module pages/forms/tables/modals
- responsive/error/loading states

### Phase 6 — Verification
- unit tests
- service tests
- API integration tests
- database integrity/concurrency checks
- end-to-end critical scenarios
- frontend build
- backend start
- database connectivity

### Phase 7 — Documentation
Update:
- README
- setup instructions
- environment variable example
- API overview
- schema/setup
- test commands
- assumptions / implementation decisions
- requirement traceability where useful

---

# 33. Quality bar for generated code

The final application should feel like a coherent academic software-engineering project, not a collection of disconnected CRUD pages.

Prioritize:
- correctness of business rules
- transaction safety
- role enforcement
- clear modular architecture
- maintainable code
- sensible UI consistency
- explicit validation
- useful errors
- test coverage of critical rules
- documentation

Avoid:
- duplicated business logic between many pages
- direct SQL scattered through React components
- trusting frontend-only role checks
- silently ignoring API errors
- fake success responses
- hard-coded secrets
- placeholder buttons that do nothing for required features
- arbitrary role/state names that differ from the documented vocabulary

---

# 34. Definition of done

Do not declare FleetFlow complete until all of the following are true:

- The app launches locally.
- PostgreSQL connectivity works.
- Registration/login works.
- Protected routes work.
- Backend RBAC works.
- Fleet Manager, Driver, Safety Officer, and Financial Analyst experiences are separated appropriately.
- Vehicle CRUD/status workflow works.
- Driver CRUD/status/licence checks work.
- Trip create/dispatch/complete/cancel works.
- Maintenance open/close works.
- Fuel logging works and creates Fuel expenses.
- Maintenance opening creates Maintenance expenses.
- Expense creation/review works.
- Dashboard KPIs update from committed data.
- Required state transitions are enforced.
- Required validation is enforced.
- Concurrent dispatch is protected by a transaction/locking strategy.
- Structured error responses and frontend error display work.
- Required reusable components are used where appropriate.
- Critical acceptance scenarios are tested.
- README/setup/environment instructions are complete.
- No requirement above has been silently dropped.

Before final response, report:
- what was implemented
- what tests were run and their results
- any documented assumptions
- any unresolved ambiguity from the source documents
- any requirement that could not be completed and why

Never claim a requirement is implemented without verifying the code path or test that demonstrates it.

---

# 35. Source-of-truth precedence for conflicts

When two supplied artifacts differ, use this precedence to avoid silently changing requirements:

1. **SRS / explicit functional requirement** for required product behavior.
2. **Software Design Document** for architecture, APIs, database design, validation, UI, transactions, security, and non-functional design.
3. **Activity / Use Case / Sequence diagrams** for workflow and interaction intent.
4. **Class Diagram** for conceptual objects/responsibilities, while explicitly documenting conflicts with SRS/design.
5. **Lab instructions/project description** for academic process expectations.

Do not delete information from a lower-level artifact when it conflicts. Record the conflict and implement the behavior that satisfies the higher-priority requirement while preserving the conceptual intent of the other artifact where possible.

Known source inconsistency already identified:
- Class Diagram includes `ADMIN` in `UserRole`, while SRS/design define four operational roles.
- Class Diagram includes `INACTIVE` in `DriverStatus`, while SRS/design define the operational driver states as Available, On Trip, and Suspended.

Treat those as documented UML discrepancies rather than silently promoting them to mandatory features.

---

## Final agent instruction

**Build FleetFlow end-to-end from this context. Start by auditing the repository and identifying what already exists. Then implement the missing pieces systematically. Preserve the documented requirements, state vocabulary, roles, API boundary, database model, UML workflow intent, and security/transaction guarantees. You may improve styling and developer ergonomics, but do not remove or weaken functional requirements. When a detail is not specified, choose a reasonable implementation and document the assumption.**
