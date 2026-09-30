// User Roles - must match backend
export const UserRoles = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

// Vehicle Status
export const VehicleStatus = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
};

// Driver Status
export const DriverStatus = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  SUSPENDED: 'Suspended',
};

// Trip Status
export const TripStatus = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Maintenance Status
export const MaintenanceStatus = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

// Expense Category
export const ExpenseCategory = {
  TOLLS: 'Tolls',
  PARKING: 'Parking',
  MAINTENANCE: 'Maintenance',
  FUEL: 'Fuel',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
};

// Status colors for badges
export const StatusColors = {
  // Vehicle
  'Available': 'success',
  'On Trip': 'info',
  'In Shop': 'warning',
  'Retired': 'secondary',
  
  // Trip
  'Draft': 'secondary',
  'Dispatched': 'info',
  'Completed': 'success',
  'Cancelled': 'danger',
  
  // Driver
  'Suspended': 'danger',
  
  // Maintenance
  'Active': 'warning',
};

// Navigation items by role
export const getNavigationByRole = (role) => {
  const baseNav = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  switch (role) {
    case UserRoles.FLEET_MANAGER:
      return [
        ...baseNav,
        { path: '/vehicles', label: 'Vehicles', icon: '🚚' },
        { path: '/drivers', label: 'Drivers', icon: '👤' },
        { path: '/trips', label: 'Trips', icon: '🗺️' },
        { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
        { path: '/fuel', label: 'Fuel', icon: '⛽' },
        { path: '/expenses', label: 'Expenses', icon: '💰' },
      ];
    
    case UserRoles.DRIVER:
      return [
        ...baseNav,
        { path: '/trips', label: 'Trips', icon: '🗺️' },
        { path: '/fuel', label: 'Fuel', icon: '⛽' },
      ];
    
    case UserRoles.SAFETY_OFFICER:
      return [
        ...baseNav,
        { path: '/drivers', label: 'Drivers', icon: '👤' },
        { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
      ];
    
    case UserRoles.FINANCIAL_ANALYST:
      return [
        ...baseNav,
        { path: '/expenses', label: 'Expenses', icon: '💰' },
      ];
    
    default:
      return baseNav;
  }
};
