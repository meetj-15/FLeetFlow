/**
 * FleetFlow Application Constants
 * Controlled vocabularies matching database enums
 */

// User Roles - must match user_role enum in database
export const UserRoles = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

// Vehicle Status - must match vehicle_status enum in database
export const VehicleStatus = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
};

// Driver Status - must match driver_status enum in database
export const DriverStatus = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  SUSPENDED: 'Suspended',
};

// Trip Status - must match trip_status enum in database
export const TripStatus = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Maintenance Status - must match maintenance_status enum in database
export const MaintenanceStatus = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

// Expense Category - must match expense_category enum in database
export const ExpenseCategory = {
  TOLLS: 'Tolls',
  PARKING: 'Parking',
  MAINTENANCE: 'Maintenance',
  FUEL: 'Fuel',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
};

// Valid role arrays for authorization
export const ALL_ROLES = Object.values(UserRoles);

// Common role groups
export const MANAGER_ROLES = [UserRoles.FLEET_MANAGER];
export const DRIVER_ROLES = [UserRoles.DRIVER];
export const SAFETY_ROLES = [UserRoles.SAFETY_OFFICER];
export const FINANCE_ROLES = [UserRoles.FINANCIAL_ANALYST];

// Role permissions for specific operations
export const VEHICLE_READ_ROLES = [UserRoles.FLEET_MANAGER];
export const VEHICLE_WRITE_ROLES = [UserRoles.FLEET_MANAGER];
export const DRIVER_READ_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.SAFETY_OFFICER];
export const DRIVER_WRITE_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.SAFETY_OFFICER];
export const TRIP_READ_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.DRIVER];
export const TRIP_WRITE_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.DRIVER];
export const MAINTENANCE_READ_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.SAFETY_OFFICER];
export const MAINTENANCE_WRITE_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.SAFETY_OFFICER];
export const FUEL_READ_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.DRIVER];
export const FUEL_WRITE_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.DRIVER];
export const EXPENSE_READ_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.FINANCIAL_ANALYST];
export const EXPENSE_WRITE_ROLES = [UserRoles.FLEET_MANAGER, UserRoles.FINANCIAL_ANALYST];
export const DASHBOARD_READ_ROLES = ALL_ROLES; // All roles can access dashboard

// Validation constants
export const PASSWORD_MIN_LENGTH = 8;
export const SAFETY_SCORE_MIN = 0;
export const SAFETY_SCORE_MAX = 100;
