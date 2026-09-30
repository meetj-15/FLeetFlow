# FleetFlow Quick Start Guide

Get FleetFlow running in 5 minutes!

## Prerequisites Check

Ensure you have:
- ✅ Node.js (v18+): `node --version`
- ✅ PostgreSQL (v12+): `psql --version`
- ✅ npm: `npm --version`

## Step 1: Database Setup (2 minutes)

```bash
# Start PostgreSQL (if not running)
# Windows: Start from Services or pgAdmin
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Connect to PostgreSQL
psql -U postgres

# In psql:
CREATE DATABASE fleetflow;
\c fleetflow
\i database/schema.sql
\i database/seed.sql
\q
```

## Step 2: Environment Configuration (1 minute)

### Backend Environment
Create `server/.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/fleetflow
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
```

### Frontend Environment
Create `client/.env`:
```env
VITE_API_URL=/api
```

## Step 3: Install Dependencies (1 minute)

```bash
# Install all dependencies (root, client, server)
npm run install:all
```

## Step 4: Start the Application (1 minute)

### Option A: Start Everything Together
```bash
npm run dev
```

### Option B: Start Separately (in different terminals)

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

## Step 5: Access the Application

🚀 Open your browser:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## Demo Login Credentials

Use these pre-seeded accounts to test different roles:

| Email | Password | Role |
|-------|----------|------|
| manager@fleetflow.com | password123 | Fleet Manager |
| mike@fleetflow.com | password123 | Driver |
| safety@fleetflow.com | password123 | Safety Officer |
| finance@fleetflow.com | password123 | Financial Analyst |

## Quick Feature Tour

### As Fleet Manager (Full Access)
1. **Login** with manager@fleetflow.com
2. **Dashboard**: View all KPIs and metrics
3. **Vehicles**: See 5 pre-loaded vehicles
4. **Drivers**: See 4 pre-loaded drivers
5. **Trips**: See sample completed and draft trips
6. **Try Dispatch**: Create a new trip and dispatch it

### As Driver (Limited Access)
1. **Login** with mike@fleetflow.com
2. **Dashboard**: View your metrics
3. **Trips**: See your assigned trips
4. **Fuel**: Record fuel consumption

## Common Issues & Solutions

### Issue: Database connection failed
**Solution**: Check your DATABASE_URL in `server/.env`
```bash
# Test connection
psql postgresql://postgres:yourpassword@localhost:5432/fleetflow
```

### Issue: Port already in use
**Solution**: Change ports in configuration
- Backend: Change PORT in `server/.env`
- Frontend: Change port in `client/vite.config.js`

### Issue: JWT authentication fails
**Solution**: Clear localStorage and login again
```javascript
// In browser console:
localStorage.clear();
```

### Issue: CORS errors
**Solution**: Verify CLIENT_URL in `server/.env` matches frontend URL

## Development Workflow

### Making Changes

1. **Backend changes**: Auto-reload with nodemon
2. **Frontend changes**: Auto-reload with Vite HMR
3. **Database changes**: Run migrations or update schema

### Testing Transactions

Test the critical dispatch workflow:
1. Create a Draft trip
2. Click "Dispatch" - should succeed
3. Try dispatching again - should fail (vehicle busy)
4. Complete the trip - resources released
5. Can now dispatch again

### Exploring the API

Use the health check and test endpoints:
```bash
# Health check
curl http://localhost:3000/health

# Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@fleetflow.com","password":"password123"}'

# Use token for protected endpoints
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure Overview

```
FleetFlow/
├── client/          # React frontend
│   ├── src/
│   │   ├── api/           # API calls
│   │   ├── components/    # Reusable UI
│   │   ├── pages/         # Page components
│   │   └── context/       # Auth context
│   └── package.json
│
├── server/          # Express backend
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── middleware/    # Auth, validation
│   │   └── config/        # DB config
│   └── package.json
│
├── database/        # PostgreSQL
│   ├── schema.sql         # Database schema
│   └── seed.sql           # Sample data
│
└── README.md        # Full documentation
```

## Next Steps

1. ✅ **Explore the Dashboard**: See KPIs and analytics
2. ✅ **Create a Trip**: Test the complete workflow
3. ✅ **Dispatch a Trip**: Experience transaction safety
4. ✅ **Add Maintenance**: See automatic expense creation
5. ✅ **Review Code**: Understand the architecture

## Getting Help

- 📖 **Full Documentation**: See `README.md`
- 🔧 **Implementation Details**: See `docs/IMPLEMENTATION_SUMMARY.md`
- 💾 **Database Info**: See `database/README.md`
- 🐛 **Issues**: Check console logs for errors

## Development Tips

### Useful Commands
```bash
# View all dependencies
npm list --depth=0

# Check for outdated packages
npm outdated

# Run backend tests (when implemented)
cd server && npm test

# Build frontend for production
cd client && npm run build

# View database content
psql -U postgres -d fleetflow -c "SELECT * FROM vehicles;"
```

### Code Quality
- Backend follows modular architecture
- Frontend uses component composition
- Database enforces referential integrity
- All critical workflows use transactions

### Security Notes
- Never commit `.env` files
- Change JWT_SECRET in production
- Use HTTPS in production
- Enable rate limiting for production

---

## 🎉 You're Ready!

FleetFlow is now running. Start exploring the transport operations management system!

**Happy Coding! 🚚**
