# FleetFlow Database

PostgreSQL database schema for the FleetFlow Transport Operations Management System.

## Setup

### Prerequisites
- PostgreSQL 12 or higher
- `uuid-ossp` extension (usually included with PostgreSQL)

### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE fleetflow;

# Connect to the database
\c fleetflow
```

### Run Schema

```bash
# Apply schema
psql -U postgres -d fleetflow -f schema.sql

# Optional: Load seed data for testing
psql -U postgres -d fleetflow -f seed.sql
```

## Database Structure

### Tables

1. **users** - System users with role-based access
   - Roles: Fleet Manager, Driver, Safety Officer, Financial Analyst
   - Authentication credentials (hashed passwords)

2. **vehicles** - Fleet vehicles with capacity and status tracking
   - Statuses: Available, On Trip, In Shop, Retired
   - Tracks odometer, capacity, acquisition cost

3. **drivers** - Driver profiles with license and safety information
   - Statuses: Available, On Trip, Suspended
   - License validation and safety scoring

4. **trips** - Trip lifecycle management
   - Statuses: Draft, Dispatched, Completed, Cancelled
   - Links vehicles, drivers, and tracks revenue

5. **maintenance_logs** - Vehicle maintenance records
   - Statuses: Active, Completed
   - Links to vehicles and auto-generates expenses

6. **fuel_logs** - Fuel consumption tracking
   - Links to vehicles and optional trips
   - Auto-generates fuel expenses

7. **expenses** - Comprehensive expense tracking
   - Categories: Tolls, Parking, Maintenance, Fuel, Insurance, Other
   - Manual entries and auto-generated from fuel/maintenance

### Views

- `available_vehicles` - Vehicles with status 'Available'
- `available_drivers` - Drivers available and with valid licenses
- `active_trips` - Trips in Draft or Dispatched status
- `completed_trips_revenue` - Completed trips with revenue data

### Constraints

- **Unique constraints**: email, registration_no, license_no
- **Foreign keys**: All relationships properly constrained
- **Check constraints**: 
  - Positive values for capacities, costs, distances
  - Safety scores 0-100
  - Date validations
- **Delete restrictions**: 
  - Cannot delete vehicles/drivers in active trips
  - Cannot delete vehicles in active maintenance

## Seed Data

The `seed.sql` file provides sample data:

### Test Users
| Email | Role | Password |
|-------|------|----------|
| manager@fleetflow.com | Fleet Manager | password123 |
| mike@fleetflow.com | Driver | password123 |
| sarah@fleetflow.com | Driver | password123 |
| safety@fleetflow.com | Safety Officer | password123 |
| finance@fleetflow.com | Financial Analyst | password123 |

### Sample Data
- 5 vehicles (various types and statuses)
- 4 drivers (including one suspended)
- 3 trips (2 completed, 1 draft)
- 2 maintenance records (1 active, 1 completed)
- 2 fuel logs
- 7 expense records

## Environment Configuration

Set the `DATABASE_URL` environment variable:

```
DATABASE_URL=postgresql://username:password@localhost:5432/fleetflow
```

## Indexes

Indexes are created on:
- Foreign keys for join performance
- Status fields for filtering
- Date fields for range queries
- Unique fields (email, registration_no, license_no)

## Triggers

- `update_updated_at_column()` - Auto-updates `updated_at` timestamp on all tables
