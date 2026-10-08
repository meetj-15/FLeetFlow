-- FleetFlow Seed Data
-- Sample data for development and testing

-- Note: Password for all users is 'password123' 
-- (hashed with bcrypt, cost factor 10)
-- Hash: $2b$10$5WesVbv6/qJHsD7sZbElV.gJJ967MJmVATpqYBo37JhpIpLI4ckzW (bcrypt hash for 'password123')

-- ============================================================================
-- USERS
-- ============================================================================

-- Fleet Manager
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'John Manager', 'manager@fleetflow.com', '$2b$10$5WesVbv6/qJHsD7sZbElV.gJJ967MJmVATpqYBo37JhpIpLI4ckzW', 'Fleet Manager', true);

-- Drivers
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
('22222222-2222-2222-2222-222222222222', 'Mike Driver', 'mike@fleetflow.com', '$2b$10$5WesVbv6/qJHsD7sZbElV.gJJ967MJmVATpqYBo37JhpIpLI4ckzW', 'Driver', true),
('22222222-2222-2222-2222-222222222223', 'Sarah Driver', 'sarah@fleetflow.com', '$2b$10$5WesVbv6/qJHsD7sZbElV.gJJ967MJmVATpqYBo37JhpIpLI4ckzW', 'Driver', true);

-- Safety Officer
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
('33333333-3333-3333-3333-333333333333', 'Linda Safety', 'safety@fleetflow.com', '$2b$10$5WesVbv6/qJHsD7sZbElV.gJJ967MJmVATpqYBo37JhpIpLI4ckzW', 'Safety Officer', true);

-- Financial Analyst
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
('44444444-4444-4444-4444-444444444444', 'Robert Finance', 'finance@fleetflow.com', '$2b$10$5WesVbv6/qJHsD7sZbElV.gJJ967MJmVATpqYBo37JhpIpLI4ckzW', 'Financial Analyst', true);

-- ============================================================================
-- VEHICLES
-- ============================================================================

INSERT INTO vehicles (id, registration_no, vehicle_name, model, vehicle_type, region, max_load_capacity, odometer, acquisition_cost, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TN-01-AB-1234', 'Truck Alpha', 'Tata LPT 1613', 'Heavy Truck', 'North', 5000.00, 15000.50, 2500000.00, 'Available'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'TN-02-CD-5678', 'Truck Beta', 'Ashok Leyland 1616', 'Heavy Truck', 'South', 6000.00, 8500.00, 2800000.00, 'Available'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'TN-03-EF-9012', 'Van Gamma', 'Mahindra Supro', 'Light Van', 'East', 1000.00, 25000.00, 800000.00, 'Available'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'TN-04-GH-3456', 'Truck Delta', 'Eicher Pro 3015', 'Medium Truck', 'West', 3000.00, 50000.00, 1800000.00, 'Available'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'TN-05-IJ-7890', 'Truck Epsilon', 'Tata Ultra T.7', 'Medium Truck', 'Central', 2500.00, 5000.00, 1500000.00, 'In Shop');

-- ============================================================================
-- DRIVERS
-- ============================================================================

INSERT INTO drivers (id, user_id, license_no, license_category, license_expiry, phone, safety_score, status) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'DL-01-2023-0012345', 'Heavy Vehicle', '2027-12-31', '+91-9876543210', 95, 'Available'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', '22222222-2222-2222-2222-222222222223', 'DL-02-2023-0098765', 'Heavy Vehicle', '2028-06-30', '+91-9876543211', 88, 'Available'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', NULL, 'DL-03-2023-0045678', 'Light Vehicle', '2027-03-15', '+91-9876543212', 92, 'Available'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', NULL, 'DL-04-2023-0078901', 'Heavy Vehicle', '2026-09-20', '+91-9876543213', 75, 'Suspended');

-- ============================================================================
-- SAMPLE COMPLETED TRIPS (for dashboard metrics)
-- ============================================================================

INSERT INTO trips (id, vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, actual_distance, revenue, status, scheduled_date, dispatch_time, completed_time, start_odometer, end_odometer) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mumbai', 'Delhi', 4500.00, 1400.00, 1420.00, 85000.00, 'Completed', '2026-09-15 08:00:00', '2026-09-15 09:00:00', '2026-09-16 18:30:00', 15000.50, 16420.50),
('cccccccc-cccc-cccc-cccc-cccccccccccd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'Chennai', 'Bangalore', 5500.00, 350.00, 360.00, 32000.00, 'Completed', '2026-09-20 06:00:00', '2026-09-20 07:00:00', '2026-09-20 19:00:00', 8500.00, 8860.00);

-- ============================================================================
-- SAMPLE DRAFT AND DISPATCHED TRIPS (for active monitoring)
-- ============================================================================

INSERT INTO trips (id, vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, revenue, status, scheduled_date) VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccce', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', 'Pune', 'Hyderabad', 800.00, 550.00, 28000.00, 'Draft', '2026-10-05 10:00:00');

-- ============================================================================
-- SAMPLE MAINTENANCE RECORDS
-- ============================================================================

INSERT INTO maintenance_logs (id, vehicle_id, maintenance_type, description, cost, start_date, end_date, status) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Oil Change', 'Regular oil and filter change', 3500.00, '2026-09-10', '2026-09-10', 'Completed'),
('dddddddd-dddd-dddd-dddd-ddddddddddde', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'Engine Repair', 'Major engine overhaul', 125000.00, '2026-09-28', NULL, 'Active');

-- ============================================================================
-- SAMPLE FUEL RECORDS
-- ============================================================================

INSERT INTO fuel_logs (id, vehicle_id, trip_id, liters, cost, fuel_date) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 250.00, 25000.00, '2026-09-15'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 180.00, 18000.00, '2026-09-20');

-- ============================================================================
-- SAMPLE EXPENSES
-- ============================================================================

-- Maintenance expenses (auto-generated from maintenance)
INSERT INTO expenses (id, vehicle_id, category, amount, description, expense_date) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maintenance', 3500.00, 'Oil Change - Maintenance Record', '2026-09-10'),
('ffffffff-ffff-ffff-ffff-fffffffffffe', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'Maintenance', 125000.00, 'Engine Repair - Maintenance Record', '2026-09-28');

-- Fuel expenses (auto-generated from fuel logs)
INSERT INTO expenses (id, vehicle_id, trip_id, category, amount, description, expense_date) VALUES
('ffffffff-ffff-ffff-ffff-fffffffffffd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Fuel', 25000.00, 'Fuel Log Entry', '2026-09-15'),
('ffffffff-ffff-ffff-ffff-fffffffffffc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 'Fuel', 18000.00, 'Fuel Log Entry', '2026-09-20');

-- Manual expenses
INSERT INTO expenses (id, vehicle_id, trip_id, category, amount, description, expense_date) VALUES
('ffffffff-ffff-ffff-ffff-fffffffffffb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tolls', 1200.00, 'Highway tolls Mumbai-Delhi', '2026-09-15'),
('ffffffff-ffff-ffff-ffff-fffffffffffa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccd', 'Parking', 500.00, 'Parking charges', '2026-09-20'),
('ffffffff-ffff-ffff-ffff-fffffffffff9', NULL, NULL, 'Insurance', 45000.00, 'Fleet insurance quarterly premium', '2026-09-01');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment these to verify data after seeding:
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT COUNT(*) as vehicle_count FROM vehicles;
-- SELECT COUNT(*) as driver_count FROM drivers;
-- SELECT COUNT(*) as trip_count FROM trips;
-- SELECT COUNT(*) as maintenance_count FROM maintenance_logs;
-- SELECT COUNT(*) as fuel_count FROM fuel_logs;
-- SELECT COUNT(*) as expense_count FROM expenses;
