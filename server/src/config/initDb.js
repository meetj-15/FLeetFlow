/**
 * initDb.js
 *
 * Runs every time the server starts:
 *   1. Creates all tables / types / views if they don't exist (idempotent DDL).
 *   2. Seeds reference / demo data using INSERT … ON CONFLICT DO NOTHING
 *      so re-runs never duplicate rows.
 *
 * No external SQL files needed — everything lives here.
 */

import { getClient } from './db.js';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Password hash for 'password123' — pre-computed so seed runs fast.
// Re-generate with: node -e "const b=require('bcryptjs'); b.hash('password123',10).then(console.log)"
// ---------------------------------------------------------------------------
const PW_HASH = '$2b$10$5WesVbv6/qJHsD7sZbElV.gJJ967MJmVATpqYBo37JhpIpLI4ckzW';

const SCHEMA = /* sql */`
-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMs (idempotent via DO blocks) ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('Available', 'On Trip', 'Suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM ('Active', 'Completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM ('Tolls', 'Parking', 'Maintenance', 'Fuel', 'Insurance', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(255)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          user_role     NOT NULL,
    is_active     BOOLEAN       DEFAULT true,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE TABLE IF NOT EXISTS vehicles (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_no  VARCHAR(50)   NOT NULL UNIQUE,
    vehicle_name     VARCHAR(255)  NOT NULL,
    model            VARCHAR(255),
    vehicle_type     VARCHAR(100)  NOT NULL,
    region           VARCHAR(100)  NOT NULL,
    max_load_capacity DECIMAL(10,2) NOT NULL CHECK (max_load_capacity > 0),
    odometer         DECIMAL(10,2) DEFAULT 0 CHECK (odometer >= 0),
    acquisition_cost DECIMAL(12,2) DEFAULT 0 CHECK (acquisition_cost >= 0),
    status           vehicle_status DEFAULT 'Available',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_no);
CREATE INDEX IF NOT EXISTS idx_vehicles_status       ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_region       ON vehicles(region);
CREATE INDEX IF NOT EXISTS idx_vehicles_type         ON vehicles(vehicle_type);

CREATE TABLE IF NOT EXISTS drivers (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    license_no       VARCHAR(50)  NOT NULL UNIQUE,
    license_category VARCHAR(50)  NOT NULL,
    license_expiry   DATE         NOT NULL,
    phone            VARCHAR(20),
    safety_score     INTEGER DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
    status           driver_status DEFAULT 'Available',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_drivers_license        ON drivers(license_no);
CREATE INDEX IF NOT EXISTS idx_drivers_status         ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON drivers(license_expiry);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id        ON drivers(user_id);

CREATE TABLE IF NOT EXISTS trips (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id       UUID NOT NULL REFERENCES drivers(id)  ON DELETE RESTRICT,
    source          VARCHAR(255)  NOT NULL,
    destination     VARCHAR(255)  NOT NULL,
    cargo_weight    DECIMAL(10,2) NOT NULL CHECK (cargo_weight > 0),
    planned_distance DECIMAL(10,2) NOT NULL CHECK (planned_distance > 0),
    actual_distance DECIMAL(10,2) CHECK (actual_distance > 0),
    revenue         DECIMAL(12,2) DEFAULT 0 CHECK (revenue >= 0),
    status          trip_status DEFAULT 'Draft',
    scheduled_date  TIMESTAMP,
    dispatch_time   TIMESTAMP,
    completed_time  TIMESTAMP,
    cancelled_at    TIMESTAMP,
    start_odometer  DECIMAL(10,2),
    end_odometer    DECIMAL(10,2),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trip_dates CHECK (
        (status = 'Dispatched' AND dispatch_time IS NOT NULL) OR
        (status = 'Completed'  AND dispatch_time IS NOT NULL AND completed_time IS NOT NULL) OR
        (status = 'Cancelled'  AND cancelled_at IS NOT NULL) OR
        (status = 'Draft')
    )
);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle        ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver         ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status         ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_dispatch_time  ON trips(dispatch_time);
CREATE INDEX IF NOT EXISTS idx_trips_completed_time ON trips(completed_time);

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id       UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    maintenance_type VARCHAR(100)     NOT NULL,
    description      TEXT,
    cost             DECIMAL(12,2) DEFAULT 0 CHECK (cost >= 0),
    start_date       DATE NOT NULL,
    end_date         DATE,
    status           maintenance_status DEFAULT 'Active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_maintenance_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle    ON maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status     ON maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_start_date ON maintenance_logs(start_date);

CREATE TABLE IF NOT EXISTS fuel_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    trip_id    UUID REFERENCES trips(id) ON DELETE SET NULL,
    liters     DECIMAL(10,2) NOT NULL CHECK (liters > 0),
    cost       DECIMAL(12,2) NOT NULL CHECK (cost >= 0),
    fuel_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_trip    ON fuel_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_fuel_date    ON fuel_logs(fuel_date);

CREATE TABLE IF NOT EXISTS expenses (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id   UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    trip_id      UUID REFERENCES trips(id)    ON DELETE SET NULL,
    category     expense_category NOT NULL,
    amount       DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    description  TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle  ON expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip     ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(expense_date);

-- ── updated_at trigger function ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at        BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_vehicles_updated_at     BEFORE UPDATE ON vehicles        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_drivers_updated_at      BEFORE UPDATE ON drivers         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_trips_updated_at        BEFORE UPDATE ON trips           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_maintenance_updated_at  BEFORE UPDATE ON maintenance_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_fuel_updated_at         BEFORE UPDATE ON fuel_logs       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER update_expenses_updated_at     BEFORE UPDATE ON expenses        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Views ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW available_vehicles AS
  SELECT * FROM vehicles WHERE status = 'Available';

CREATE OR REPLACE VIEW available_drivers AS
  SELECT * FROM drivers WHERE status = 'Available' AND license_expiry > CURRENT_DATE;

CREATE OR REPLACE VIEW active_trips AS
  SELECT * FROM trips WHERE status IN ('Draft', 'Dispatched');

CREATE OR REPLACE VIEW completed_trips_revenue AS
  SELECT id, vehicle_id, driver_id, source, destination, revenue, completed_time, actual_distance
  FROM trips WHERE status = 'Completed';
`;

// ---------------------------------------------------------------------------
// Seed rows — INSERT … ON CONFLICT DO NOTHING keeps this idempotent.
// Fixed UUIDs let us reference them in later inserts (trips, expenses, etc.)
// ---------------------------------------------------------------------------
const SEED = /* sql */`
-- Users
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Manager',   'manager@fleetflow.com', '${PW_HASH}', 'Fleet Manager',      true),
  ('22222222-2222-2222-2222-222222222222', 'Mike Driver',    'mike@fleetflow.com',    '${PW_HASH}', 'Driver',             true),
  ('22222222-2222-2222-2222-222222222223', 'Sarah Driver',   'sarah@fleetflow.com',   '${PW_HASH}', 'Driver',             true),
  ('33333333-3333-3333-3333-333333333333', 'Linda Safety',   'safety@fleetflow.com',  '${PW_HASH}', 'Safety Officer',     true),
  ('44444444-4444-4444-4444-444444444444', 'Robert Finance', 'finance@fleetflow.com', '${PW_HASH}', 'Financial Analyst',  true)
ON CONFLICT (email) DO NOTHING;

-- Vehicles
INSERT INTO vehicles (id, registration_no, vehicle_name, model, vehicle_type, region, max_load_capacity, odometer, acquisition_cost, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TN-01-AB-1234', 'Truck Alpha',   'Tata LPT 1613',        'Heavy Truck',  'North',   5000.00, 15000.50, 2500000.00, 'Available'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'TN-02-CD-5678', 'Truck Beta',    'Ashok Leyland 1616',   'Heavy Truck',  'South',   6000.00,  8500.00, 2800000.00, 'Available'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'TN-03-EF-9012', 'Van Gamma',     'Mahindra Supro',       'Light Van',    'East',    1000.00, 25000.00,  800000.00, 'Available'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'TN-04-GH-3456', 'Truck Delta',   'Eicher Pro 3015',      'Medium Truck', 'West',    3000.00, 50000.00, 1800000.00, 'Available'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'TN-05-IJ-7890', 'Truck Epsilon', 'Tata Ultra T.7',       'Medium Truck', 'Central', 2500.00,  5000.00, 1500000.00, 'In Shop')
ON CONFLICT (registration_no) DO NOTHING;

-- Drivers
INSERT INTO drivers (id, user_id, license_no, license_category, license_expiry, phone, safety_score, status) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'DL-01-2023-0012345', 'Heavy Vehicle', '2027-12-31', '+91-9876543210', 95, 'Available'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', '22222222-2222-2222-2222-222222222223', 'DL-02-2023-0098765', 'Heavy Vehicle', '2028-06-30', '+91-9876543211', 88, 'Available'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', NULL,                                   'DL-03-2023-0045678', 'Light Vehicle', '2027-03-15', '+91-9876543212', 92, 'Available'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', NULL,                                   'DL-04-2023-0078901', 'Heavy Vehicle', '2026-09-20', '+91-9876543213', 75, 'Suspended')
ON CONFLICT (license_no) DO NOTHING;

-- Completed trips
INSERT INTO trips (id, vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, actual_distance, revenue, status, scheduled_date, dispatch_time, completed_time, start_odometer, end_odometer) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mumbai',  'Delhi',     4500.00, 1400.00, 1420.00, 85000.00, 'Completed', '2026-09-15 08:00:00', '2026-09-15 09:00:00', '2026-09-16 18:30:00', 15000.50, 16420.50),
  ('cccccccc-cccc-cccc-cccc-cccccccccccd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'Chennai', 'Bangalore',  5500.00,  350.00,  360.00, 32000.00, 'Completed', '2026-09-20 06:00:00', '2026-09-20 07:00:00', '2026-09-20 19:00:00',  8500.00,  8860.00)
ON CONFLICT (id) DO NOTHING;

-- Draft trip
INSERT INTO trips (id, vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, revenue, status, scheduled_date) VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccce', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 'Pune', 'Hyderabad', 800.00, 550.00, 28000.00, 'Draft', '2026-10-05 10:00:00')
ON CONFLICT (id) DO NOTHING;

-- Maintenance
INSERT INTO maintenance_logs (id, vehicle_id, maintenance_type, description, cost, start_date, end_date, status) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Oil Change',    'Regular oil and filter change', 3500.00,  '2026-09-10', '2026-09-10', 'Completed'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddde', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'Engine Repair', 'Major engine overhaul',        125000.00, '2026-09-28', NULL,         'Active')
ON CONFLICT (id) DO NOTHING;

-- Fuel logs
INSERT INTO fuel_logs (id, vehicle_id, trip_id, liters, cost, fuel_date) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 250.00, 25000.00, '2026-09-15'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 180.00, 18000.00, '2026-09-20')
ON CONFLICT (id) DO NOTHING;

-- Expenses
INSERT INTO expenses (id, vehicle_id, trip_id, category, amount, description, expense_date) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL,                                   'Maintenance', 3500.00,   'Oil Change - Maintenance Record',     '2026-09-10'),
  ('ffffffff-ffff-ffff-ffff-fffffffffffe', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', NULL,                                   'Maintenance', 125000.00, 'Engine Repair - Maintenance Record',  '2026-09-28'),
  ('ffffffff-ffff-ffff-ffff-fffffffffffd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Fuel',        25000.00,  'Fuel Log Entry',                      '2026-09-15'),
  ('ffffffff-ffff-ffff-ffff-fffffffffffc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 'Fuel',        18000.00,  'Fuel Log Entry',                      '2026-09-20'),
  ('ffffffff-ffff-ffff-ffff-fffffffffffb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tolls',       1200.00,   'Highway tolls Mumbai-Delhi',          '2026-09-15'),
  ('ffffffff-ffff-ffff-ffff-fffffffffffa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 'Parking',     500.00,    'Parking charges',                     '2026-09-20'),
  ('ffffffff-ffff-ffff-ffff-fffffffffff9', NULL,                                   NULL,                                   'Insurance',   45000.00,  'Fleet insurance quarterly premium',   '2026-09-01')
ON CONFLICT (id) DO NOTHING;
`;

// ---------------------------------------------------------------------------
// Public entry point — called once from server.js before app.listen()
// ---------------------------------------------------------------------------
export const initDatabase = async () => {
  const client = await getClient();
  try {
    console.log('🗄  Initialising database schema…');
    await client.query(SCHEMA);
    console.log('✓  Schema ready');

    console.log('🌱 Seeding demo data…');
    await client.query(SEED);
    console.log('✓  Seed data ready');
  } catch (err) {
    console.error('❌ Database initialisation failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};
