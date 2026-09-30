-- FleetFlow Database Schema
-- PostgreSQL Database for Transport Operations Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS / TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst');
CREATE TYPE vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');
CREATE TYPE driver_status AS ENUM ('Available', 'On Trip', 'Suspended');
CREATE TYPE trip_status AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');
CREATE TYPE maintenance_status AS ENUM ('Active', 'Completed');
CREATE TYPE expense_category AS ENUM ('Tolls', 'Parking', 'Maintenance', 'Fuel', 'Insurance', 'Other');

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_no VARCHAR(50) NOT NULL UNIQUE,
    vehicle_name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    vehicle_type VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    max_load_capacity DECIMAL(10, 2) NOT NULL CHECK (max_load_capacity > 0),
    odometer DECIMAL(10, 2) DEFAULT 0 CHECK (odometer >= 0),
    acquisition_cost DECIMAL(12, 2) DEFAULT 0 CHECK (acquisition_cost >= 0),
    status vehicle_status DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_registration ON vehicles(registration_no);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_region ON vehicles(region);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);

-- ============================================================================
-- DRIVERS TABLE
-- ============================================================================

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    license_no VARCHAR(50) NOT NULL UNIQUE,
    license_category VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    phone VARCHAR(20),
    safety_score INTEGER DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
    status driver_status DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drivers_license ON drivers(license_no);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);

-- ============================================================================
-- TRIPS TABLE
-- ============================================================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    cargo_weight DECIMAL(10, 2) NOT NULL CHECK (cargo_weight > 0),
    planned_distance DECIMAL(10, 2) NOT NULL CHECK (planned_distance > 0),
    actual_distance DECIMAL(10, 2) CHECK (actual_distance > 0),
    revenue DECIMAL(12, 2) DEFAULT 0 CHECK (revenue >= 0),
    status trip_status DEFAULT 'Draft',
    scheduled_date TIMESTAMP,
    dispatch_time TIMESTAMP,
    completed_time TIMESTAMP,
    cancelled_at TIMESTAMP,
    start_odometer DECIMAL(10, 2),
    end_odometer DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Business rule: cargo weight cannot exceed vehicle capacity (checked in application layer)
    CONSTRAINT chk_trip_dates CHECK (
        (status = 'Dispatched' AND dispatch_time IS NOT NULL) OR
        (status = 'Completed' AND dispatch_time IS NOT NULL AND completed_time IS NOT NULL) OR
        (status = 'Cancelled' AND cancelled_at IS NOT NULL) OR
        (status = 'Draft')
    )
);

CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_dispatch_time ON trips(dispatch_time);
CREATE INDEX idx_trips_completed_time ON trips(completed_time);

-- ============================================================================
-- MAINTENANCE LOGS TABLE
-- ============================================================================

CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    maintenance_type VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(12, 2) DEFAULT 0 CHECK (cost >= 0),
    start_date DATE NOT NULL,
    end_date DATE,
    status maintenance_status DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_maintenance_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX idx_maintenance_start_date ON maintenance_logs(start_date);

-- ============================================================================
-- FUEL LOGS TABLE
-- ============================================================================

CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    liters DECIMAL(10, 2) NOT NULL CHECK (liters > 0),
    cost DECIMAL(12, 2) NOT NULL CHECK (cost >= 0),
    fuel_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_trip ON fuel_logs(trip_id);
CREATE INDEX idx_fuel_date ON fuel_logs(fuel_date);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    category expense_category NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_updated_at BEFORE UPDATE ON fuel_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for available vehicles
CREATE VIEW available_vehicles AS
SELECT * FROM vehicles WHERE status = 'Available';

-- View for available drivers (not suspended, license not expired)
CREATE VIEW available_drivers AS
SELECT * FROM drivers 
WHERE status = 'Available' 
AND license_expiry > CURRENT_DATE;

-- View for active trips
CREATE VIEW active_trips AS
SELECT * FROM trips WHERE status IN ('Draft', 'Dispatched');

-- View for completed trips with revenue
CREATE VIEW completed_trips_revenue AS
SELECT 
    id,
    vehicle_id,
    driver_id,
    source,
    destination,
    revenue,
    completed_time,
    actual_distance
FROM trips 
WHERE status = 'Completed';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE vehicles IS 'Fleet vehicles with capacity and status tracking';
COMMENT ON TABLE drivers IS 'Driver profiles with license and safety information';
COMMENT ON TABLE trips IS 'Trip management with lifecycle tracking';
COMMENT ON TABLE maintenance_logs IS 'Vehicle maintenance records';
COMMENT ON TABLE fuel_logs IS 'Fuel consumption records';
COMMENT ON TABLE expenses IS 'Operational expense tracking';

COMMENT ON COLUMN trips.cargo_weight IS 'Must not exceed vehicle max_load_capacity - enforced in application';
COMMENT ON COLUMN drivers.license_expiry IS 'Drivers with expired licenses cannot be dispatched';
COMMENT ON COLUMN vehicles.status IS 'Available | On Trip | In Shop | Retired';
COMMENT ON COLUMN drivers.status IS 'Available | On Trip | Suspended';
COMMENT ON COLUMN trips.status IS 'Draft | Dispatched | Completed | Cancelled';
