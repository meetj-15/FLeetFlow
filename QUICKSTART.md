# FleetFlow Quick Start Guide

Get FleetFlow running in 5 minutes!

## Prerequisites Check

Ensure you have:
- âœ… Node.js (v18+): `node --version`
- âœ… PostgreSQL (v12+): `psql --version`
- âœ… npm: `npm --version`

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

ðŸš€ Open your browser:
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


## ⚠️ Troubleshooting Common Setup Issues

### Issue: `psql` command not found (Windows)
**Symptom**: `psql : The term 'psql' is not recognized...`

**Solution**: 
1. PostgreSQL is installed but not in PATH
2. Close and reopen your terminal (PATH changes need new session)
3. Or use full path: `"C:\Program Files\PostgreSQL\17\bin\psql.exe"`
4. To fix permanently, add to system PATH:
   - System Properties → Environment Variables → Path → Add: `C:\Program Files\PostgreSQL\17\bin`

### Issue: PostgreSQL service not running (Windows)
**Symptom**: `could not connect to server` or `connection refused`

**Solution**:
1. Open Services (Win+R → `services.msc`)
2. Find `postgresql-x64-17` (or your version)
3. Right-click → Start
4. Or via PowerShell (as Administrator):
   ```powershell
   Start-Service postgresql-x64-17
   ```

### Issue: Login fails with "Invalid email or password"
**Symptom**: Correct credentials but authentication fails

**Root Cause**: Database has placeholder password hashes (not real bcrypt hashes)

**Solution**: Run this from the `server/` directory:
```bash
node -e "import('bcryptjs').then(b => import('pg').then(pg => import('dotenv').then(d => { d.config(); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); b.hash('password123', 10).then(hash => pool.query('UPDATE users SET password_hash = $1', [hash]).then(r => { console.log('Fixed', r.rowCount, 'user passwords'); pool.end(); })); })))"
```

Or manually update via psql:
```sql
-- Connect to database
psql -U postgres -d fleetflow

-- Update all users with correct hash for 'password123'
UPDATE users SET password_hash = '$2b$10$5WesVbv6/qJHsD7sZbElV.gJJ967MJmVATpqYBo37JhpIpLI4ckzW';
```

### Issue: Module not found errors after `git pull`
**Symptom**: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'bcryptjs'` or similar

**Root Cause**: Teammate added new dependencies but you haven't installed them

**Solution**: Always run after pulling changes:
```bash
npm install           # Install root dependencies
cd client && npm install   # Install frontend dependencies
cd ../server && npm install # Install backend dependencies
# Or use the helper:
npm run install:all
```

### Issue: npm 404 errors during install
**Symptom**: `npm error 404 Not Found - GET https://registry.npmjs.org/...`

**Solution**:
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules` (in root, client, and server)
3. Delete package-lock.json files
4. Reinstall: `npm run install:all`

### Issue: Port already in use
**Symptom**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
- **Backend (port 3000)**: Another process is using it
  ```bash
  # Windows - Find and kill process
  netstat -ano | findstr :3000
  taskkill /PID <process_id> /F
  ```
- **Frontend (port 5173)**: Change in `client/vite.config.js`:
  ```js
  server: { port: 5174 }
  ```

### Issue: Database already exists error
**Symptom**: `ERROR: database "fleetflow" already exists`

**Solution**: Database exists from previous setup - just skip creation and run schema/seed:
```bash
psql -U postgres -d fleetflow -f database/schema.sql
psql -U postgres -d fleetflow -f database/seed.sql
```

Or to start fresh:
```bash
psql -U postgres
DROP DATABASE fleetflow;
CREATE DATABASE fleetflow;
\c fleetflow
\i database/schema.sql
\i database/seed.sql
\q
```


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
â”œâ”€â”€ client/          # React frontend
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ api/           # API calls
â”‚   â”‚   â”œâ”€â”€ components/    # Reusable UI
â”‚   â”‚   â”œâ”€â”€ pages/         # Page components
â”‚   â”‚   â””â”€â”€ context/       # Auth context
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ server/          # Express backend
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ modules/       # Feature modules
â”‚   â”‚   â”œâ”€â”€ middleware/    # Auth, validation
â”‚   â”‚   â””â”€â”€ config/        # DB config
â”‚   â””â”€â”€ package.json
â”‚
â”œâ”€â”€ database/        # PostgreSQL
â”‚   â”œâ”€â”€ schema.sql         # Database schema
â”‚   â””â”€â”€ seed.sql           # Sample data
â”‚
â””â”€â”€ README.md        # Full documentation
```

## Next Steps

1. âœ… **Explore the Dashboard**: See KPIs and analytics
2. âœ… **Create a Trip**: Test the complete workflow
3. âœ… **Dispatch a Trip**: Experience transaction safety
4. âœ… **Add Maintenance**: See automatic expense creation
5. âœ… **Review Code**: Understand the architecture

## Getting Help

- ðŸ“– **Full Documentation**: See `README.md`
- ðŸ”§ **Implementation Details**: See `docs/IMPLEMENTATION_SUMMARY.md`
- ðŸ’¾ **Database Info**: See `database/README.md`
- ðŸ› **Issues**: Check console logs for errors

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

## ðŸŽ‰ You're Ready!

FleetFlow is now running. Start exploring the transport operations management system!

**Happy Coding! ðŸšš**
