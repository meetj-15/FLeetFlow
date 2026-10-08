# Technical Design Document: Role-Based Improvements

## Overview

This design document specifies the technical implementation of role-based improvements for the FleetFlow Transport Operations Management System. The improvements address three critical areas:

1. **Functional Defects**: Fix license expiry validation bugs that prevent accurate data entry and proper dispatch validation
2. **Role-Based Access Control**: Implement true role-aware system with data isolation, role-specific dashboards, and backend authorization enforcement
3. **Professional UI**: Transform the interface from generic styling to a polished, professional application with custom color schemes, typography, modern components, and sophisticated feedback mechanisms

The current system treats all authenticated users similarly regardless of role, contains validation bugs, lacks proper transaction safety, and uses basic UI styling. These improvements will transform FleetFlow into a production-ready, role-aware system with appropriate security, data consistency, and professional user experience.

---

## Architecture

### High-Level Architecture

The system maintains a three-tier architecture with enhanced role-based controls:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Role-Specific  │  │ Professional   │  │ React Router  │ │
│  │ Dashboards     │  │ UI Components  │  │ + RoleRoute   │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│                    Axios + JWT Auth                          │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Authentication │  │ Authorization  │  │ Role-Based    │ │
│  │ Middleware     │  │ Middleware     │  │ Controllers   │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Transactional  │  │ State          │  │ Dashboard     │ │
│  │ Services       │  │ Validation     │  │ Aggregator    │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER                          │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ PostgreSQL     │  │ Row-Level      │  │ Transaction   │ │
│  │ Database       │  │ Locking        │  │ Management    │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow for Role-Based Operations

```
User Action
    ↓
Frontend: Check role and display appropriate UI
    ↓
Frontend: Call API with JWT token
    ↓
Backend: Authentication Middleware (verify JWT)
    ↓
Backend: Authorization Middleware (check role)
    ↓
Backend: Controller (validate input)
    ↓
Backend: Service (enforce business rules + transactions)
    ↓
Backend: Repository (database operations with locking)
    ↓
Database: Execute with row locks and constraints
    ↓
Backend: Return success/error response
    ↓
Frontend: Update UI + show notification
```

---

## Components and Interfaces

### Backend Components

#### 1. Authorization Middleware

**Purpose**: Centralized role-based access control enforcement

**Location**: `server/src/middleware/authorize.js`

**Interface**:
```javascript
/**
 * Authorization middleware factory
 * @param {string[]} allowedRoles - Array of roles permitted to access the endpoint
 * @returns {Function} Express middleware function
 */
function authorize(allowedRoles) {
  return (req, res, next) => {
    // Extract user role from req.user (set by authentication middleware)
    // Verify role is in allowedRoles
    // Return 403 if unauthorized, otherwise call next()
  }
}

// Usage example:
// router.post('/vehicles', authenticate, authorize(['Fleet Manager']), createVehicle);
```

**Key Responsibilities**:
- Extract user role from JWT token payload
- Compare against allowed roles for the endpoint
- Return HTTP 403 Forbidden if role not permitted
- Pass control to next middleware if authorized
- Work in conjunction with authentication middleware

#### 2. Dashboard Service

**Purpose**: Aggregate role-specific dashboard data

**Location**: `server/src/modules/dashboard/dashboardService.js`

**Interface**:
```javascript
class DashboardService {
  /**
   * Get dashboard data based on user role
   * @param {string} userId - Authenticated user ID
   * @param {string} userRole - User role from JWT
   * @returns {Promise<Object>} Role-specific dashboard data
   */
  async getDashboardData(userId, userRole) {
    switch(userRole) {
      case 'Fleet Manager':
        return this.getFleetManagerDashboard();
      case 'Driver':
        return this.getDriverDashboard(userId);
      case 'Safety Officer':
        return this.getSafetyOfficerDashboard();
      case 'Financial Analyst':
        return this.getFinancialAnalystDashboard();
      default:
        throw new Error('Invalid role');
    }
  }

  async getFleetManagerDashboard() {
    // Return: operational metrics, financial metrics, safety alerts, 
    // active trips, vehicle ROI, charts data
  }

  async getDriverDashboard(userId) {
    // Return: driver's own trips only, trip count, completed trips, 
    // total personal revenue
  }

  async getSafetyOfficerDashboard() {
    // Return: license compliance, expired/expiring licenses, 
    // maintenance records, safety scores
  }

  async getFinancialAnalystDashboard() {
    // Return: revenue, expenses, profitability, expense breakdown, 
    // trends, vehicle profitability
  }
}
```

#### 3. Trip Service with Data Isolation

**Purpose**: Filter trip data based on user role

**Location**: `server/src/modules/trip/tripService.js`

**Enhanced Interface**:
```javascript
class TripService {
  /**
   * Get trips with role-based filtering
   * @param {string} userRole - User role from JWT
   * @param {string} userId - User ID for driver filtering
   * @returns {Promise<Array>} Filtered trips
   */
  async getTrips(userRole, userId) {
    if (userRole === 'Driver') {
      // Get driver profile for user
      const driver = await this.getDriverByUserId(userId);
      if (!driver) return [];
      // Return only trips where driver_id matches
      return this.getTripsByDriverId(driver.id);
    }
    // Fleet Manager and Safety Officer see all trips
    return this.getAllTrips();
  }
}
```

#### 4. Validation Service

**Purpose**: Fix license expiry validation logic

**Location**: `server/src/modules/driver/driverValidation.js`

**Fixed Interface**:
```javascript
class DriverValidation {
  /**
   * Validate driver creation/update data
   * @param {Object} driverData - Driver information
   * @returns {Object} Validation result
   */
  validateDriver(driverData) {
    const errors = [];
    
    // License expiry: accept ANY valid date (past, present, or future)
    if (!this.isValidDate(driverData.license_expiry)) {
      errors.push({
        field: 'license_expiry',
        message: 'Please enter a valid date'
      });
    }
    // DO NOT check if date is in the past
    
    // Other validations...
    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if driver is eligible for dispatch
   * @param {Object} driver - Driver record
   * @returns {Object} Eligibility result
   */
  isDispatchEligible(driver) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDate = new Date(driver.license_expiry);
    expiryDate.setHours(0, 0, 0, 0);
    
    // License must be valid (today or future)
    if (expiryDate < today) {
      return {
        eligible: false,
        code: 'LICENSE_EXPIRED',
        message: `Driver license expired on ${driver.license_expiry} - cannot dispatch`
      };
    }
    
    if (driver.status !== 'Available') {
      return {
        eligible: false,
        code: 'DRIVER_UNAVAILABLE',
        message: 'Driver is not available for dispatch'
      };
    }
    
    return { eligible: true };
  }
}
```

#### 5. Transaction Services

**Purpose**: Ensure atomic operations for multi-record state changes

**Location**: `server/src/modules/{module}/transactionalService.js`

**Interface Pattern**:
```javascript
class MaintenanceTransactionService {
  /**
   * Open maintenance with transaction safety
   * @param {Object} maintenanceData - Maintenance information
   * @returns {Promise<Object>} Created maintenance record
   */
  async openMaintenance(maintenanceData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Lock vehicle
      const vehicle = await client.query(
        'SELECT * FROM vehicles WHERE id = $1 FOR UPDATE',
        [maintenanceData.vehicle_id]
      );
      
      // 2. Validate vehicle is not On Trip
      if (vehicle.rows[0].status === 'On Trip') {
        throw new Error('Cannot open maintenance on vehicle currently on trip');
      }
      
      // 3. Create maintenance log
      const maintenance = await client.query(
        'INSERT INTO maintenance_logs (...) VALUES (...) RETURNING *',
        [...]
      );
      
      // 4. Update vehicle status
      await client.query(
        'UPDATE vehicles SET status = $1 WHERE id = $2',
        ['In Shop', maintenanceData.vehicle_id]
      );
      
      // 5. Create corresponding expense
      await client.query(
        'INSERT INTO expenses (category, amount, vehicle_id, ...) VALUES ($1, $2, $3, ...)',
        ['Maintenance', maintenanceData.cost, maintenanceData.vehicle_id, ...]
      );
      
      await client.query('COMMIT');
      return maintenance.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### Frontend Components

#### 1. Role-Based Navigation Component

**Purpose**: Display navigation items based on user role

**Location**: `client/src/components/AppLayout.jsx`

**Interface**:
```javascript
/**
 * Navigation configuration by role
 */
const ROLE_NAVIGATION = {
  'Fleet Manager': [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/vehicles', label: 'Vehicles', icon: 'vehicle' },
    { path: '/drivers', label: 'Drivers', icon: 'driver' },
    { path: '/trips', label: 'Trips', icon: 'trip' },
    { path: '/maintenance', label: 'Maintenance', icon: 'maintenance' },
    { path: '/fuel', label: 'Fuel', icon: 'fuel' },
    { path: '/expenses', label: 'Expenses', icon: 'expense' }
  ],
  'Driver': [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/fuel', label: 'Fuel', icon: 'fuel' }
  ],
  'Safety Officer': [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/drivers', label: 'Drivers', icon: 'driver' },
    { path: '/maintenance', label: 'Maintenance', icon: 'maintenance' }
  ],
  'Financial Analyst': [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/expenses', label: 'Expenses', icon: 'expense' }
  ]
};

function NavigationMenu({ userRole }) {
  const navItems = ROLE_NAVIGATION[userRole] || [];
  return (
    <nav>
      {navItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

#### 2. Role-Specific Dashboard Components

**Purpose**: Display different dashboard layouts for each role

**Location**: `client/src/pages/Dashboard.jsx`

**Component Structure**:
```javascript
function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user.role]);

  const fetchDashboardData = async () => {
    const response = await dashboardAPI.getDashboard();
    setDashboardData(response.data);
    setLoading(false);
  };

  if (loading) return <DashboardSkeleton />;

  switch(user.role) {
    case 'Fleet Manager':
      return <FleetManagerDashboard data={dashboardData} />;
    case 'Driver':
      return <DriverDashboard data={dashboardData} />;
    case 'Safety Officer':
      return <SafetyOfficerDashboard data={dashboardData} />;
    case 'Financial Analyst':
      return <FinancialAnalystDashboard data={dashboardData} />;
    default:
      return <div>Invalid role</div>;
  }
}
```

#### 3. Professional UI Components

**Toast Notification System**

**Location**: `client/src/components/Toast.jsx`

```javascript
/**
 * Toast notification component
 * @param {string} type - success | error | warning | info
 * @param {string} message - Notification message
 * @param {number} duration - Auto-dismiss duration in ms
 * @param {Function} onClose - Close callback
 */
function Toast({ type, message, duration = 3000, onClose }) {
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
    if (type === 'error') {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <Icon name={getIconForType(type)} />
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}
```

**Skeleton Loader Component**

**Location**: `client/src/components/SkeletonLoader.jsx`

```javascript
/**
 * Skeleton loader for loading states
 */
function SkeletonLoader({ type, count = 1 }) {
  if (type === 'table') {
    return (
      <div className="skeleton-table">
        <div className="skeleton-header" />
        {Array(count).fill(0).map((_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-cell" />
            <div className="skeleton-cell" />
            <div className="skeleton-cell" />
          </div>
        ))}
      </div>
    );
  }
  
  if (type === 'kpi') {
    return (
      <div className="skeleton-kpi">
        <div className="skeleton-kpi-label" />
        <div className="skeleton-kpi-value" />
      </div>
    );
  }
  
  return <div className="skeleton-line" />;
}
```

**Empty State Component**

**Location**: `client/src/components/EmptyState.jsx`

```javascript
/**
 * Empty state component with action
 * @param {string} icon - Icon name
 * @param {string} title - Empty state title
 * @param {string} description - Empty state description
 * @param {Object} action - Action button config
 */
function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <Icon name={icon} size="large" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

---

## Data Models

### Database Schema Updates

#### No Schema Changes Required

The existing schema already supports all required functionality:
- `users` table has `role` field with the four documented roles
- `drivers` table has `license_expiry` as DATE type (accepts any date)
- All status enums are already defined correctly
- Foreign key relationships support transactional operations

#### Views Enhancement (Optional Optimization)

Add materialized views for dashboard performance:

```sql
-- Fleet-wide operational metrics (Fleet Manager)
CREATE MATERIALIZED VIEW dashboard_fleet_metrics AS
SELECT
  COUNT(CASE WHEN t.status = 'Dispatched' THEN 1 END) as active_trips,
  COUNT(CASE WHEN v.status = 'Available' THEN 1 END) as available_vehicles,
  COUNT(CASE WHEN v.status = 'In Shop' THEN 1 END) as vehicles_in_shop,
  COALESCE(SUM(CASE WHEN t.status = 'Completed' THEN t.revenue ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN t.status = 'Completed' THEN t.revenue ELSE 0 END), 0) - COALESCE(SUM(e.amount), 0) as net_profit
FROM vehicles v
CROSS JOIN trips t
CROSS JOIN expenses e;

-- Per-vehicle ROI (Fleet Manager, Financial Analyst)
CREATE MATERIALIZED VIEW dashboard_vehicle_roi AS
SELECT
  v.id,
  v.vehicle_name,
  v.registration_no,
  COUNT(t.id) as trip_count,
  COALESCE(SUM(t.revenue), 0) as total_revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(t.revenue), 0) - COALESCE(SUM(e.amount), 0) as net_profit,
  CASE 
    WHEN v.acquisition_cost > 0 
    THEN ((COALESCE(SUM(t.revenue), 0) - COALESCE(SUM(e.amount), 0)) / v.acquisition_cost) * 100
    ELSE 0
  END as roi_percentage
FROM vehicles v
LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'Completed'
LEFT JOIN expenses e ON e.vehicle_id = v.id
GROUP BY v.id, v.vehicle_name, v.registration_no, v.acquisition_cost;

-- License compliance metrics (Safety Officer, Fleet Manager)
CREATE MATERIALIZED VIEW dashboard_license_compliance AS
SELECT
  COUNT(CASE WHEN d.license_expiry < CURRENT_DATE THEN 1 END) as expired_count,
  COUNT(CASE WHEN d.license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_count,
  COUNT(CASE WHEN d.status = 'Suspended' THEN 1 END) as suspended_count,
  AVG(d.safety_score) as avg_safety_score
FROM drivers d;

-- Refresh function (call after significant data changes)
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_fleet_metrics;
  REFRESH MATERIALIZED VIEW dashboard_vehicle_roi;
  REFRESH MATERIALIZED VIEW dashboard_license_compliance;
END;
$$ LANGUAGE plpgsql;
```

### API Response Models

#### Dashboard API Response by Role

**Fleet Manager Dashboard Response**:
```typescript
interface FleetManagerDashboard {
  metrics: {
    activeTrips: number;
    availableVehicles: number;
    vehiclesInShop: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
  activeTrips: Array<{
    id: string;
    source: string;
    destination: string;
    vehicleName: string;
    driverName: string;
    status: string;
    dispatchTime: string;
  }>;
  vehicleROI: Array<{
    vehicleId: string;
    vehicleName: string;
    tripCount: number;
    revenue: number;
    expenses: number;
    netProfit: number;
    roiPercentage: number;
  }>;
  charts: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    fleetStatusDistribution: Array<{ status: string; count: number }>;
    expensesByCategory: Array<{ category: string; amount: number }>;
  };
  alerts: {
    expiredLicenses: number;
    expiringLicenses: number;
    suspendedDrivers: number;
  };
}
```

**Driver Dashboard Response**:
```typescript
interface DriverDashboard {
  metrics: {
    activeTrips: number;
    completedTrips: number;
    totalRevenue: number;
  };
  activeTrips: Array<{
    id: string;
    source: string;
    destination: string;
    vehicleName: string;
    status: string;
    dispatchTime: string;
  }>;
  completedTrips: Array<{
    id: string;
    source: string;
    destination: string;
    vehicleName: string;
    revenue: number;
    completedTime: string;
  }>;
}
```

**Safety Officer Dashboard Response**:
```typescript
interface SafetyOfficerDashboard {
  metrics: {
    expiredLicenses: number;
    expiringLicenses: number;
    suspendedDrivers: number;
    avgSafetyScore: number;
    activeMaintenanceCount: number;
    vehiclesInShop: number;
  };
  expiredLicenses: Array<{
    driverId: string;
    name: string;
    licenseNo: string;
    expiryDate: string;
  }>;
  expiringLicenses: Array<{
    driverId: string;
    name: string;
    licenseNo: string;
    expiryDate: string;
  }>;
  activeMaintenance: Array<{
    maintenanceId: string;
    vehicleName: string;
    maintenanceType: string;
    startDate: string;
    cost: number;
  }>;
  charts: {
    safetyScoreDistribution: Array<{ range: string; count: number }>;
  };
}
```

**Financial Analyst Dashboard Response**:
```typescript
interface FinancialAnalystDashboard {
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    expenseTrendPercentage: number; // Change from previous month
  };
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  vehicleProfitability: Array<{
    vehicleId: string;
    vehicleName: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }>;
  charts: {
    monthlyExpenses: Array<{ month: string; amount: number }>;
    revenueVsExpenses: Array<{ month: string; revenue: number; expenses: number }>;
    expensesPieChart: Array<{ category: string; amount: number }>;
  };
  topExpenseCategories: Array<{
    category: string;
    amount: number;
  }>;
}
```

---

## Error Handling

### Backend Error Response Structure

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string; // For validation errors
    details?: any;  // Additional context
  };
}
```

### Error Codes

#### License-Related Errors
- `LICENSE_EXPIRED` - Driver license has expired, cannot dispatch
- `LICENSE_INVALID_DATE` - Invalid date format for license expiry

#### Authorization Errors
- `UNAUTHORIZED` (401) - Missing or invalid JWT token
- `FORBIDDEN` (403) - User role not permitted for this operation

#### State Validation Errors
- `INVALID_STATUS` - Operation not allowed in current state
- `VEHICLE_UNAVAILABLE` - Vehicle cannot be dispatched (on trip, in shop, retired)
- `DRIVER_UNAVAILABLE` - Driver cannot be dispatched (on trip, suspended)
- `CARGO_EXCEEDS_CAPACITY` - Cargo weight exceeds vehicle capacity

#### Transaction Errors
- `VEHICLE_ON_TRIP` - Cannot open maintenance on vehicle currently on trip
- `CONCURRENT_MODIFICATION` - Resource locked by another transaction

### Frontend Error Handling

```javascript
// API wrapper with error handling
async function apiCall(request) {
  try {
    const response = await request();
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error.message);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      // Redirect to login
      logout();
      throw new Error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error.message);
    } else {
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
}
```

---

## Testing Strategy

### Unit Tests

**Backend Unit Tests**:
1. Authorization middleware with different roles
2. Dashboard service role filtering logic
3. Driver validation (license expiry acceptance)
4. Dispatch eligibility validation
5. State transition validation

**Frontend Unit Tests**:
1. Role-based navigation rendering
2. Dashboard component selection by role
3. Toast notification auto-dismiss timing
4. Empty state rendering

### Integration Tests

**Backend Integration Tests**:
1. Complete transactional workflows (dispatch, maintenance, fuel)
2. Concurrent dispatch attempts on same resource
3. Role-based endpoint access enforcement
4. Dashboard data aggregation for each role

**Frontend Integration Tests**:
1. Role-based routing and access control
2. Dashboard data fetching and rendering
3. Trip filtering for Driver role
4. Error handling and toast notifications

### End-to-End Tests

1. **License Validation Flow**:
   - Create driver with past license expiry date (should succeed)
   - Attempt to dispatch trip with expired license driver (should fail)
   - Display license status as "Expired" on UI

2. **Role-Based Dashboard Flow**:
   - Login as Fleet Manager → verify full dashboard
   - Login as Driver → verify only personal trips
   - Login as Safety Officer → verify compliance metrics
   - Login as Financial Analyst → verify financial data

3. **Transaction Safety Flow**:
   - Open maintenance on available vehicle
   - Verify vehicle status changes to "In Shop"
   - Verify expense record created
   - Verify atomicity on transaction failure

4. **Data Isolation Flow**:
   - Login as Driver A → create trip → verify visible
   - Login as Driver B → verify Driver A's trip not visible
   - Login as Fleet Manager → verify all trips visible

---

## Professional UI Design System

### Color Palette

Move away from generic blue (#2563eb) to a professional teal/emerald palette:

```css
:root {
  /* Primary Colors */
  --color-primary-50: #f0fdfa;
  --color-primary-100: #ccfbf1;
  --color-primary-200: #99f6e4;
  --color-primary-300: #5eead4;
  --color-primary-400: #2dd4bf;
  --color-primary-500: #14b8a6; /* Primary brand color */
  --color-primary-600: #0d9488;
  --color-primary-700: #0f766e;
  --color-primary-800: #115e59;
  --color-primary-900: #134e4a;

  /* Secondary Colors (Slate) */
  --color-secondary-50: #f8fafc;
  --color-secondary-100: #f1f5f9;
  --color-secondary-200: #e2e8f0;
  --color-secondary-300: #cbd5e1;
  --color-secondary-400: #94a3b8;
  --color-secondary-500: #64748b;
  --color-secondary-600: #475569;
  --color-secondary-700: #334155;
  --color-secondary-800: #1e293b;
  --color-secondary-900: #0f172a;

  /* Status Colors */
  --color-success-500: #10b981; /* Green */
  --color-warning-500: #f59e0b; /* Amber */
  --color-danger-500: #ef4444;  /* Red */
  --color-info-500: #3b82f6;    /* Blue */

  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  
  /* Text Colors */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
}
```

### Typography

Replace default system fonts with professional typefaces:

```css
:root {
  /* Font Families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */

  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

/* Import fonts in index.html */
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Component Styling Standards

#### Cards
```css
.card {
  background: var(--bg-primary);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  transition: box-shadow 200ms ease;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

#### Buttons
```css
.btn {
  padding: 0.625rem 1.25rem;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: 0.5rem;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-primary-500);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.15);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: var(--color-secondary-300);
  cursor: not-allowed;
  transform: none;
}
```

#### Skeleton Loaders
```css
@keyframes shimmer {
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
}

.skeleton {
  background: linear-gradient(
    to right,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 20%,
    var(--bg-secondary) 40%,
    var(--bg-secondary) 100%
  );
  background-size: 800px 104px;
  animation: shimmer 1.5s linear infinite;
  border-radius: 0.5rem;
}

.skeleton-kpi {
  height: 100px;
  width: 100%;
}

.skeleton-table-row {
  height: 48px;
  margin-bottom: 8px;
}
```

#### Toast Notifications
```css
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  min-width: 300px;
  animation: slideIn 300ms ease;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  border-left: 4px solid var(--color-success-500);
}

.toast-error {
  border-left: 4px solid var(--color-danger-500);
}
```

### Responsive Grid System

```css
/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Responsive Table */
@media (max-width: 768px) {
  .data-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
```

---

## Implementation Phases

### Phase 1: License Validation Fix (Priority: Critical)

**Tasks**:
1. Update driver validation service to accept any valid date
2. Add dispatch eligibility check for license expiry
3. Update driver display to show computed license status
4. Add unit tests for validation logic
5. Update API error messages for license expiry

**Success Criteria**:
- Can create/update driver with past license expiry date
- Dispatch attempt with expired license returns clear error
- UI shows "Expired" or "Valid" status based on current date

### Phase 2: Backend Authorization Infrastructure (Priority: Critical)

**Tasks**:
1. Create authorization middleware
2. Update all protected routes with role requirements
3. Implement dashboard service with role-based data aggregation
4. Add trip data isolation for Driver role
5. Add integration tests for authorization

**Success Criteria**:
- All endpoints enforce role-based access control at backend
- Dashboard API returns different data based on user role
- Driver users only see their own trips
- Unauthorized access returns HTTP 403

### Phase 3: Transaction Safety (Priority: High)

**Tasks**:
1. Implement dispatch transaction with row locking
2. Implement maintenance open/close transactions
3. Implement fuel logging transaction
4. Implement trip completion transaction
5. Implement trip cancellation transaction
6. Add concurrency tests

**Success Criteria**:
- All multi-record operations are atomic
- Concurrent dispatch attempts on same resource fail correctly
- Transaction rollback on any step failure
- No orphaned records or inconsistent state

### Phase 4: Role-Specific Dashboards (Priority: High)

**Tasks**:
1. Create Fleet Manager dashboard component
2. Create Driver dashboard component
3. Create Safety Officer dashboard component
4. Create Financial Analyst dashboard component
5. Implement dashboard data fetching logic
6. Add loading states with skeleton loaders

**Success Criteria**:
- Each role sees appropriate dashboard
- Dashboard data updates reflect backend filtering
- Loading states display properly
- Empty states show when no data

### Phase 5: Role-Based Navigation (Priority: Medium)

**Tasks**:
1. Update AppLayout with role-based navigation
2. Implement RoleRoute component for frontend protection
3. Create Forbidden page
4. Update all route definitions
5. Display current user role in header

**Success Criteria**:
- Navigation shows only permitted items for role
- Direct URL access to forbidden routes redirects to Forbidden page
- User can see their current role

### Phase 6: Professional UI - Design System (Priority: Medium)

**Tasks**:
1. Define color palette CSS variables
2. Load custom web fonts
3. Update global typography styles
4. Create spacing scale
5. Update all existing components to use design system

**Success Criteria**:
- Application uses professional color scheme (not generic blue)
- Custom fonts loaded and applied
- Consistent spacing across all components
- Accessible color contrast ratios

### Phase 7: Professional UI - Enhanced Components (Priority: Medium)

**Tasks**:
1. Create Toast notification system
2. Create Skeleton loader components
3. Create Empty state components
4. Update cards with hover effects
5. Update buttons with transitions
6. Update tables with modern styling

**Success Criteria**:
- Success/error operations show toast notifications
- Loading states show skeleton screens
- Empty states provide helpful guidance
- Interactive elements have smooth transitions

### Phase 8: Professional UI - Charts and Visualizations (Priority: Low)

**Tasks**:
1. Integrate Recharts library
2. Create chart components for Fleet Manager dashboard
3. Create chart components for Safety Officer dashboard
4. Create chart components for Financial Analyst dashboard
5. Implement responsive chart sizing
6. Add chart empty states

**Success Criteria**:
- Dashboard charts render with professional styling
- Charts use design system colors
- Charts are responsive
- Charts show empty states when no data

### Phase 9: Seed Data and Testing (Priority: Medium)

**Tasks**:
1. Update seed script with users for all four roles
2. Create sample data demonstrating role differences
3. Add expired and expiring license examples
4. Document test user credentials
5. Run full E2E test suite

**Success Criteria**:
- Can login as each role
- Sample data demonstrates role-specific features
- License compliance scenarios testable
- All test suites passing

---

## Deployment Considerations

### Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/fleetflow
JWT_SECRET=<strong-random-secret>
PORT=5000
NODE_ENV=production

# Frontend
VITE_API_URL=https://api.fleetflow.com
```

### Database Migration

No schema migration required - existing schema supports all features.

Optional: Add materialized views for dashboard performance:
```bash
psql -d fleetflow -f database/dashboard_views.sql
```

### Build and Deployment

```bash
# Backend
cd server
npm install
npm run build  # if using TypeScript
npm start

# Frontend
cd client
npm install
npm run build
# Serve dist/ folder with nginx or hosting service
```

### Security Checklist

- [ ] JWT_SECRET is strong and not committed to repository
- [ ] HTTPS enabled in production
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled on authentication endpoints
- [ ] SQL injection protection via parameterized queries
- [ ] XSS protection via React escaping
- [ ] Password hashing with bcrypt (already implemented)
- [ ] Authorization middleware on all protected routes

---

## Monitoring and Observability

### Key Metrics to Monitor

1. **Authentication/Authorization**:
   - Failed login attempts
   - 401/403 error rates by endpoint
   - JWT token refresh rate

2. **Performance**:
   - Dashboard load time by role
   - Database query performance
   - Transaction completion time

3. **Business Metrics**:
   - License expiry compliance rate
   - Failed dispatch attempts by reason
   - Transaction rollback rate

4. **User Activity**:
   - Active users by role
   - Most accessed endpoints by role
   - Trip completion rate

### Logging Strategy

```javascript
// Structured logging for authorization
logger.info('Authorization check', {
  userId: req.user.id,
  userRole: req.user.role,
  endpoint: req.path,
  method: req.method,
  allowed: isAllowed
});

// Structured logging for transactions
logger.info('Transaction started', {
  operation: 'dispatch',
  tripId: tripId,
  vehicleId: vehicleId,
  driverId: driverId
});

logger.info('Transaction completed', {
  operation: 'dispatch',
  tripId: tripId,
  duration: elapsedMs
});

// Error logging
logger.error('Transaction failed', {
  operation: 'dispatch',
  error: error.message,
  rollback: true
});
```

---

## Assumptions and Decisions

### 1. License Expiry Validation
**Decision**: Accept any valid date, compute status at display/dispatch time
**Rationale**: Real-world scenario where expired licenses must be recorded for compliance tracking

### 2. Driver Data Isolation
**Decision**: Filter at database query level, not client-side
**Rationale**: Security - backend must enforce data boundaries, not rely on frontend

### 3. Dashboard Data Aggregation
**Decision**: Use materialized views for complex metrics (optional optimization)
**Rationale**: Performance - dashboard queries can be expensive; materialized views cache results

### 4. Transaction Isolation Level
**Decision**: Use PostgreSQL default (READ COMMITTED) with explicit row locking
**Rationale**: Balance between consistency and performance for fleet operations

### 5. Color Palette Selection
**Decision**: Teal/emerald palette (--color-primary-500: #14b8a6)
**Rationale**: Professional, modern, distinguishable from generic blue, good accessibility

### 6. Font Selection
**Decision**: Inter for UI, JetBrains Mono for code/data
**Rationale**: Modern, readable, widely used in professional applications

### 7. Toast Notification Duration
**Decision**: Success 3s, Error 5s, manual dismiss available
**Rationale**: Success can be dismissed quickly; errors need more review time

### 8. Empty State Strategy
**Decision**: Contextual empty states with action buttons
**Rationale**: Guide users to next action rather than dead-end experience

---

## Summary

This design transforms FleetFlow from a basic authenticated CRUD application into a production-ready, role-aware transport management system. The three improvement areas work together:

1. **Functional Fixes**: Correct license validation enables accurate compliance tracking and proper dispatch validation

2. **Role-Based Features**: Backend authorization, data isolation, and role-specific dashboards ensure users only access data and actions appropriate to their responsibilities

3. **Professional UI**: Custom design system, modern components, and sophisticated feedback mechanisms create a polished, credible application

The implementation maintains the existing three-tier architecture while enhancing each layer with role awareness, transaction safety, and professional styling. All improvements are backward-compatible with the existing schema and can be implemented incrementally.
