# FleetFlow - Transport Operations Management System

FleetFlow is a comprehensive web-based Transport Operations Management System built for managing fleet operations, including vehicles, drivers, trips, maintenance, fuel, and expenses.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)

## ✨ Features

### Core Functionality
- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Vehicle Management**: CRUD operations for fleet vehicles with status tracking
- **Driver Management**: Driver profiles with license validation and safety scoring
- **Trip Management**: Complete trip lifecycle from draft to completion/cancellation
- **Maintenance Management**: Track vehicle maintenance with automatic expense generation
- **Fuel Management**: Log fuel consumption with trip association
- **Expense Tracking**: Comprehensive expense management across multiple categories
- **Dashboard & Analytics**: Real-time KPIs, revenue tracking, and vehicle ROI analysis

### Business Rules
- **Dispatch Validation**: Ensures vehicle availability, driver eligibility, and license validity
- **Cargo Capacity Checks**: Prevents overloading beyond vehicle capacity
- **Resource Locking**: Transaction-based dispatch prevents double-booking
- **Automatic Expense Generation**: Fuel and maintenance entries auto-create expense records
- **State Management**: Enforced status transitions for vehicles, drivers, and trips

## 🛠 Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Zod** - Schema validation
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **express-validator** - Request validation

### Development
- **ESLint** - Code linting
- **Nodemon** - Auto-restart during development
- **Concurrently** - Run multiple commands

## 🏗 System Architecture

```
┌─────────────────┐
│   React/Vite    │
│   Frontend      │
└────────┬────────┘
         │ HTTP/REST
         │ JWT Auth
┌────────▼────────┐
│   Express API   │
│   Backend       │
├─────────────────┤
│ • Auth          │
│ • Vehicles      │
│ • Drivers       │
│ • Trips         │
│ • Maintenance   │
│ • Fuel          │
│ • Expenses      │
│ • Dashboard     │
└────────┬────────┘
         │ SQL
┌────────▼────────┐
│   PostgreSQL    │
│   Database      │
└─────────────────┘
```

## 📦 Prerequisites

Before installing, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FleetFlow
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (root, client, server)
npm run install:all
```

### 3. Set Up Database

Create the database — this is the **only manual DB step** required:

```powershell
psql -U postgres -c "CREATE DATABASE fleetflow;"
```

The schema and seed data are created automatically when the server starts.

## ⚙️ Configuration

### Backend Configuration

Create `server/.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/fleetflow

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Client Configuration
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration

Create `client/.env` file:

```env
# API Configuration
VITE_API_URL=/api
```

## 🏃 Running the Application

### Development Mode

**Option 1: Run Everything Together**
```bash
npm run dev
```

**Option 2: Run Separately**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### Production Mode

```bash
# Build frontend
npm run build

# Start backend
cd server
npm start
```

## 📁 Project Structure

```
FleetFlow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API service layer
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Page components
│   │   ├── routes/        # Route guards
│   │   ├── services/      # Core services
│   │   ├── styles/        # Global styles
│   │   └── utils/         # Utilities
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Express backend
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── middleware/    # Express middleware
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Authentication
│   │   │   ├── vehicle/   # Vehicle management
│   │   │   ├── driver/    # Driver management
│   │   │   ├── trip/      # Trip management
│   │   │   ├── maintenance/
│   │   │   ├── fuel/
│   │   │   ├── expense/
│   │   │   └── dashboard/
│   │   ├── utils/         # Utilities
│   │   ├── app.js         # Express app
│   │   └── server.js      # Server entry point
│   └── package.json
│
├── database/              # Database files
│   ├── schema.sql         # Database schema
│   ├── seed.sql           # Sample data
│   └── README.md          # Database documentation
│
├── .gitignore
├── package.json
└── README.md
```

## 👥 User Roles

FleetFlow implements four operational roles with specific permissions:

### Fleet Manager
- Full access to all features
- Manages vehicles, drivers, trips, maintenance, fuel, and expenses
- Can create, update, and delete resources

### Driver
- View and manage assigned trips
- Record fuel consumption
- Complete and cancel trips

### Safety Officer
- Monitor driver licenses and safety compliance
- Manage driver records
- Open and close maintenance records

### Financial Analyst
- View and analyze expenses
- Generate financial reports
- Monitor profitability metrics

## 🔌 API Documentation

### Authentication

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/auth/register` | POST | Public | Register new user |
| `/api/auth/login` | POST | Public | Login user |
| `/api/auth/me` | GET | Private | Get current user |

### Vehicles

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/vehicles` | GET | Authenticated | Get all vehicles |
| `/api/vehicles/:id` | GET | Authenticated | Get vehicle by ID |
| `/api/vehicles` | POST | Fleet Manager | Create vehicle |
| `/api/vehicles/:id` | PUT | Fleet Manager | Update vehicle |
| `/api/vehicles/:id` | DELETE | Fleet Manager | Delete vehicle |

### Trips

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/trips` | GET | Authenticated | Get all trips |
| `/api/trips/:id` | GET | Authenticated | Get trip by ID |
| `/api/trips` | POST | Fleet Manager, Driver | Create trip |
| `/api/trips/:id/dispatch` | POST | Fleet Manager, Driver | Dispatch trip |
| `/api/trips/:id/complete` | POST | Fleet Manager, Driver | Complete trip |
| `/api/trips/:id/cancel` | POST | Fleet Manager, Driver | Cancel trip |

[See full API documentation in `/docs/API.md`]

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Test User Credentials (Seed Data)

| Email | Password | Role |
|-------|----------|------|
| manager@fleetflow.com | password123 | Fleet Manager |
| mike@fleetflow.com | password123 | Driver |
| safety@fleetflow.com | password123 | Safety Officer |
| finance@fleetflow.com | password123 | Financial Analyst |

### Role Access Summary

| Module | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|--------|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Vehicles | ✅ | ❌ | ❌ | ❌ |
| Drivers | ✅ | ❌ | ✅ | ❌ |
| Trips | ✅ | ✅ | ❌ | ❌ |
| Maintenance | ✅ | ❌ | ✅ | ❌ |
| Fuel | ✅ | ✅ | ❌ | ❌ |
| Expenses | ✅ | ❌ | ❌ | ✅ |

### Dashboard Content per Role

| Role | Dashboard Shows |
|------|----------------|
| Fleet Manager | Active trips, available vehicles, vehicles in shop, available drivers, compliance alerts |
| Driver | Personal trips count, completed trips, personal revenue, own active/completed trip lists |
| Safety Officer | Driver compliance KPIs, licence status chart, licence alerts, safety scores, active maintenance |
| Financial Analyst | Revenue/expenses/profit KPIs, expense breakdown by category, vehicle profitability, recent expenses |

## 🐛 Troubleshooting

### "Cannot connect to database"
```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# If not running, start it (adjust version number)
Start-Service postgresql-x64-15

# Verify database exists
psql -U postgres -c "\l"
```

### "Port 3000 already in use"
```powershell
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Module not found" errors
```powershell
Remove-Item -Recurse -Force node_modules, client/node_modules, server/node_modules
npm run install:all
```

### Charts not showing
```powershell
cd client
npm install recharts
```

### Login page not appearing (opening URL logs in automatically)
This happens when a previous session's JWT token is still in the browser's `localStorage`. Clear it with:
```javascript
// Open browser DevTools console and run:
localStorage.clear()
```
Then refresh the page.

## 🚢 Deployment

### Database Setup
1. Create production PostgreSQL database
2. Run schema.sql
3. Configure DATABASE_URL environment variable

### Backend Deployment
1. Set NODE_ENV=production
2. Configure environment variables
3. Install dependencies: `npm install --production`
4. Start server: `npm start`

### Frontend Deployment
1. Build: `npm run build`
2. Serve the `client/dist` folder with a static file server
3. Configure API_URL to point to backend

### Environment Variables (Production)
- Use strong JWT_SECRET
- Enable HTTPS
- Configure CORS properly
- Set secure database credentials
- Enable rate limiting
- Configure logging

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Contributors

Built as a Software Engineering Lab project for IIIT Pune.

## 📞 Support

For issues and questions, please open an issue in the repository.

---

**FleetFlow** - Streamlining Transport Operations
