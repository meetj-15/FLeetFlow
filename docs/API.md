# FleetFlow API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation or business logic error
- `401 Unauthorized` - Authentication failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Fleet Manager"
}
```

**Roles:** `Fleet Manager`, `Driver`, `Safety Officer`, `Financial Analyst`

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Fleet Manager"
    }
  }
}
```

### Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Fleet Manager"
    }
  }
}
```

### Get Current User

**GET** `/api/auth/me`

Get authenticated user information.

**Access:** Private (Authenticated)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Fleet Manager"
  }
}
```

---

## Vehicle Endpoints

### Get All Vehicles

**GET** `/api/vehicles`

Retrieve all vehicles with optional filtering.

**Access:** Private (Authenticated)

**Query Parameters:**
- `status` (optional) - Filter by status: `Available`, `On Trip`, `In Shop`, `Retired`
- `region` (optional) - Filter by region
- `vehicle_type` (optional) - Filter by vehicle type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "registration_no": "ABC-1234",
      "vehicle_name": "Truck 01",
      "model": "Volvo FH16",
      "vehicle_type": "Heavy Truck",
      "region": "North",
      "max_load_capacity": 25000.00,
      "odometer": 152340.50,
      "acquisition_cost": 500000.00,
      "status": "Available",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Vehicle by ID

**GET** `/api/vehicles/:id`

Get details of a specific vehicle.

**Access:** Private (Authenticated)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "registration_no": "ABC-1234",
    ...
  }
}
```

### Create Vehicle

**POST** `/api/vehicles`

Create a new vehicle.

**Access:** Private (Fleet Manager only)

**Request Body:**
```json
{
  "registration_no": "ABC-1234",
  "vehicle_name": "Truck 01",
  "model": "Volvo FH16",
  "vehicle_type": "Heavy Truck",
  "region": "North",
  "max_load_capacity": 25000,
  "odometer": 0,
  "acquisition_cost": 500000
}
```

**Validation:**
- `registration_no`: Required, unique, max 50 chars
- `vehicle_name`: Required, max 255 chars
- `vehicle_type`: Required, max 100 chars
- `region`: Required, max 100 chars
- `max_load_capacity`: Required, must be > 0
- `odometer`: Optional, must be >= 0
- `acquisition_cost`: Optional, must be >= 0

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "registration_no": "ABC-1234",
    "status": "Available",
    ...
  }
}
```

### Update Vehicle

**PUT** `/api/vehicles/:id`

Update an existing vehicle.

**Access:** Private (Fleet Manager only)

**Request Body:** Same as Create Vehicle (all fields optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

### Delete Vehicle

**DELETE** `/api/vehicles/:id`

Delete a vehicle (restricted based on active usage).

**Access:** Private (Fleet Manager only)

**Business Rules:**
- Cannot delete vehicle currently on a trip
- Cannot delete vehicle with active maintenance

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Vehicle deleted successfully"
  }
}
```

---

## Driver Endpoints

### Get All Drivers

**GET** `/api/drivers`

Retrieve all drivers.

**Access:** Private (Authenticated)

**Query Parameters:**
- `status` (optional) - Filter by status: `Available`, `On Trip`, `Suspended`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "license_no": "DL123456",
      "license_category": "Commercial",
      "license_expiry": "2025-12-31",
      "phone": "+1234567890",
      "safety_score": 95,
      "status": "Available",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Available Drivers

**GET** `/api/drivers/available`

Get only drivers who are available and have valid licenses.

**Access:** Private (Authenticated)

**Business Rules:**
- Status must be `Available`
- License expiry must be in the future

**Response:** Same format as Get All Drivers

### Create Driver

**POST** `/api/drivers`

Create a new driver profile.

**Access:** Private (Fleet Manager, Safety Officer)

**Request Body:**
```json
{
  "license_no": "DL123456",
  "license_category": "Commercial",
  "license_expiry": "2025-12-31",
  "phone": "+1234567890",
  "safety_score": 100
}
```

**Validation:**
- `license_no`: Required, unique, max 50 chars
- `license_category`: Required, max 50 chars
- `license_expiry`: Required, must be valid date in future
- `phone`: Optional, 10-20 chars
- `safety_score`: Optional, 0-100, defaults to 100

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "license_no": "DL123456",
    "status": "Available",
    ...
  }
}
```

---

## Trip Endpoints

### Get All Trips

**GET** `/api/trips`

Retrieve all trips with optional filtering.

**Access:** Private (Authenticated)

**Query Parameters:**
- `status` (optional) - Filter by status: `Draft`, `Dispatched`, `Completed`, `Cancelled`
- `vehicle_id` (optional) - Filter by vehicle UUID
- `driver_id` (optional) - Filter by driver UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "driver_id": "uuid",
      "source": "City A",
      "destination": "City B",
      "cargo_weight": 15000.00,
      "planned_distance": 450.00,
      "actual_distance": 452.30,
      "revenue": 5000.00,
      "status": "Completed",
      "scheduled_date": "2024-01-20T08:00:00.000Z",
      "dispatch_time": "2024-01-20T08:15:00.000Z",
      "completed_time": "2024-01-20T16:30:00.000Z",
      "start_odometer": 152340.50,
      "end_odometer": 152792.80,
      "created_at": "2024-01-19T14:00:00.000Z",
      "updated_at": "2024-01-20T16:30:00.000Z"
    }
  ]
}
```

### Get Trip by ID

**GET** `/api/trips/:id`

Get details of a specific trip.

**Access:** Private (Authenticated)

**Response:** Same format as Get All Trips (single object)

### Create Trip

**POST** `/api/trips`

Create a new trip in Draft status.

**Access:** Private (Fleet Manager, Driver)

**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "source": "City A",
  "destination": "City B",
  "cargo_weight": 15000,
  "planned_distance": 450,
  "revenue": 5000,
  "scheduled_date": "2024-01-20T08:00:00.000Z"
}
```

**Validation:**
- `vehicle_id`: Required, must be valid UUID
- `driver_id`: Required, must be valid UUID
- `source`: Required, max 255 chars
- `destination`: Required, max 255 chars
- `cargo_weight`: Required, must be > 0
- `planned_distance`: Required, must be > 0
- `revenue`: Optional, must be >= 0
- `scheduled_date`: Optional, must be valid date

**Business Rules:**
- Cargo weight must not exceed vehicle's `max_load_capacity`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Draft",
    ...
  }
}
```

**Error Codes:**
- `CARGO_EXCEEDS_CAPACITY` - Cargo weight exceeds vehicle capacity

### Dispatch Trip

**POST** `/api/trips/:id/dispatch`

Dispatch a trip (transition from Draft to Dispatched).

**Access:** Private (Fleet Manager, Driver)

**Business Rules:**
- Trip must be in `Draft` status
- Vehicle must be `Available`
- Driver must be `Available`
- Driver must not be `Suspended`
- Driver's license must not be expired
- Vehicle must not be `Retired` or `In Shop`
- Uses database transaction with row-level locking to prevent concurrent dispatch

**State Changes:**
- Trip → `Dispatched`
- Vehicle → `On Trip`
- Driver → `On Trip`
- Records `dispatch_time` and `start_odometer`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Dispatched",
    "dispatch_time": "2024-01-20T08:15:00.000Z",
    ...
  }
}
```

**Error Codes:**
- `INVALID_STATUS` - Trip is not in Draft status
- `VEHICLE_UNAVAILABLE` - Vehicle is not available
- `DRIVER_UNAVAILABLE` - Driver is not available
- `LICENSE_EXPIRED` - Driver's license has expired

### Complete Trip

**POST** `/api/trips/:id/complete`

Complete a trip (transition from Dispatched to Completed).

**Access:** Private (Fleet Manager, Driver)

**Request Body:**
```json
{
  "actual_distance": 452.3,
  "end_odometer": 152792.8
}
```

**Validation:**
- `actual_distance`: Required, must be > 0
- `end_odometer`: Required, must be >= 0

**Business Rules:**
- Trip must be in `Dispatched` status

**State Changes:**
- Trip → `Completed`
- Vehicle → `Available`
- Driver → `Available`
- Records `completed_time`
- Updates vehicle `odometer`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Completed",
    "actual_distance": 452.30,
    "completed_time": "2024-01-20T16:30:00.000Z",
    ...
  }
}
```

**Error Codes:**
- `INVALID_STATUS` - Trip is not in Dispatched status

### Cancel Trip

**POST** `/api/trips/:id/cancel`

Cancel a trip (from Draft or Dispatched status).

**Access:** Private (Fleet Manager, Driver)

**Business Rules:**
- Trip must be in `Draft` or `Dispatched` status
- If dispatched, releases vehicle and driver

**State Changes:**
- Trip → `Cancelled`
- If was Dispatched: Vehicle → `Available`, Driver → `Available`
- Records `cancelled_at`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Cancelled",
    "cancelled_at": "2024-01-20T10:00:00.000Z",
    ...
  }
}
```

**Error Codes:**
- `INVALID_STATUS` - Trip cannot be cancelled from current status

---

## Maintenance Endpoints

### Get All Maintenance Records

**GET** `/api/maintenance`

Retrieve all maintenance records.

**Access:** Private (Authenticated)

**Query Parameters:**
- `status` (optional) - Filter by status: `Active`, `Completed`
- `vehicle_id` (optional) - Filter by vehicle UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "maintenance_type": "Oil Change",
      "description": "Regular oil change and filter replacement",
      "cost": 250.00,
      "start_date": "2024-01-15",
      "end_date": "2024-01-16",
      "status": "Completed",
      "created_at": "2024-01-15T09:00:00.000Z",
      "updated_at": "2024-01-16T14:00:00.000Z"
    }
  ]
}
```

### Create/Open Maintenance

**POST** `/api/maintenance`

Open a new maintenance record for a vehicle.

**Access:** Private (Fleet Manager, Safety Officer)

**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "maintenance_type": "Oil Change",
  "description": "Regular oil change and filter replacement",
  "cost": 250,
  "start_date": "2024-01-15"
}
```

**Validation:**
- `vehicle_id`: Required, must be valid UUID
- `maintenance_type`: Required, max 100 chars
- `description`: Optional, max 1000 chars
- `cost`: Required, must be >= 0
- `start_date`: Required, must be valid date

**Business Rules:**
- Vehicle must not be `On Trip`
- Creates maintenance record
- Sets vehicle status to `In Shop`
- Creates corresponding `Maintenance` expense
- All operations in a transaction

**State Changes:**
- Maintenance → `Active`
- Vehicle → `In Shop`
- Creates expense with category `Maintenance`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Active",
    ...
  }
}
```

**Error Codes:**
- `VEHICLE_UNAVAILABLE` - Vehicle is currently on a trip

### Close Maintenance

**PUT** `/api/maintenance/:id/close`

Close/complete a maintenance record.

**Access:** Private (Fleet Manager, Safety Officer)

**Business Rules:**
- Maintenance must be in `Active` status

**State Changes:**
- Maintenance → `Completed`
- Vehicle → `Available` (unless Retired)
- Records `end_date`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Completed",
    "end_date": "2024-01-16",
    ...
  }
}
```

**Error Codes:**
- `INVALID_STATUS` - Maintenance is not active

---

## Fuel Endpoints

### Get All Fuel Logs

**GET** `/api/fuel`

Retrieve all fuel logs.

**Access:** Private (Authenticated)

**Query Parameters:**
- `vehicle_id` (optional) - Filter by vehicle UUID
- `trip_id` (optional) - Filter by trip UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "trip_id": "uuid",
      "liters": 150.50,
      "cost": 225.75,
      "fuel_date": "2024-01-20",
      "created_at": "2024-01-20T12:00:00.000Z",
      "updated_at": "2024-01-20T12:00:00.000Z"
    }
  ]
}
```

### Create Fuel Log

**POST** `/api/fuel`

Record fuel consumption.

**Access:** Private (Fleet Manager, Driver)

**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "trip_id": "uuid",
  "liters": 150.5,
  "cost": 225.75,
  "fuel_date": "2024-01-20"
}
```

**Validation:**
- `vehicle_id`: Required, must be valid UUID
- `trip_id`: Optional, must be valid UUID if provided
- `liters`: Required, must be > 0
- `cost`: Required, must be >= 0
- `fuel_date`: Required, must be valid date

**Business Rules:**
- Creates fuel log
- Creates corresponding `Fuel` expense
- All operations in a transaction

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

---

## Expense Endpoints

### Get All Expenses

**GET** `/api/expenses`

Retrieve all expenses.

**Access:** Private (Fleet Manager, Financial Analyst)

**Query Parameters:**
- `category` (optional) - Filter by category
- `vehicle_id` (optional) - Filter by vehicle UUID
- `trip_id` (optional) - Filter by trip UUID
- `start_date` (optional) - Filter by date range start
- `end_date` (optional) - Filter by date range end

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "trip_id": "uuid",
      "category": "Fuel",
      "amount": 225.75,
      "description": "Fuel refill",
      "expense_date": "2024-01-20",
      "created_at": "2024-01-20T12:00:00.000Z",
      "updated_at": "2024-01-20T12:00:00.000Z"
    }
  ]
}
```

### Create Expense

**POST** `/api/expenses`

Record a new expense.

**Access:** Private (Fleet Manager, Financial Analyst)

**Request Body:**
```json
{
  "vehicle_id": "uuid",
  "trip_id": "uuid",
  "category": "Tolls",
  "amount": 45.50,
  "description": "Highway tolls",
  "expense_date": "2024-01-20"
}
```

**Validation:**
- `vehicle_id`: Optional, must be valid UUID if provided
- `trip_id`: Optional, must be valid UUID if provided
- `category`: Required, must be one of: `Tolls`, `Parking`, `Maintenance`, `Fuel`, `Insurance`, `Other`
- `amount`: Required, must be >= 0
- `description`: Optional, max 1000 chars
- `expense_date`: Required, must be valid date

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
  }
}
```

---

## Dashboard Endpoints

### Get Dashboard Metrics

**GET** `/api/dashboard`

Get comprehensive dashboard KPIs and metrics.

**Access:** Private (Authenticated)

**Response:**
```json
{
  "success": true,
  "data": {
    "activeTrips": 5,
    "availableVehicles": 12,
    "vehiclesInShop": 2,
    "completedTripsRevenue": 125000.00,
    "totalExpenses": 45000.00,
    "netProfit": 80000.00,
    "vehicleROI": [
      {
        "vehicle_id": "uuid",
        "registration_no": "ABC-1234",
        "total_revenue": 25000.00,
        "total_expenses": 8000.00,
        "net_profit": 17000.00,
        "roi_percentage": 3.4,
        "trips_count": 10
      }
    ],
    "activeTripsDetails": [
      {
        "id": "uuid",
        "vehicle_registration": "ABC-1234",
        "driver_license": "DL123456",
        "source": "City A",
        "destination": "City B",
        "status": "Dispatched",
        "dispatch_time": "2024-01-20T08:15:00.000Z"
      }
    ]
  }
}
```

**Metrics Definitions:**
- `activeTrips`: Count of trips in Draft or Dispatched status
- `availableVehicles`: Count of vehicles with Available status
- `vehiclesInShop`: Count of vehicles with In Shop status
- `completedTripsRevenue`: Sum of revenue from Completed trips
- `totalExpenses`: Sum of all expense amounts
- `netProfit`: completedTripsRevenue - totalExpenses
- `vehicleROI`: Per-vehicle profitability analysis
  - `roi_percentage`: (net_profit / acquisition_cost) * 100

---

## Error Codes Reference

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | 500 | Server error |

### Domain-Specific Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VEHICLE_UNAVAILABLE` | 400 | Vehicle is not available for dispatch |
| `DRIVER_UNAVAILABLE` | 400 | Driver is not available for dispatch |
| `LICENSE_EXPIRED` | 400 | Driver's license has expired |
| `CARGO_EXCEEDS_CAPACITY` | 400 | Cargo weight exceeds vehicle capacity |
| `INVALID_STATUS` | 400 | Invalid status transition |
| `RESOURCE_IN_USE` | 400 | Cannot delete resource in active use |

---

## Rate Limiting

Currently not implemented in development. In production:
- 100 requests per 15 minutes per IP address
- 429 Too Many Requests response when exceeded

---

## Pagination

Currently not implemented. All list endpoints return complete results. Future implementation will use:
```
?page=1&limit=20
```

---

## Version

API Version: 1.0.0  
Last Updated: 2024-01-20
