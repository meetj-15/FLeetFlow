# FleetFlow Database

## Automatic Initialisation

The schema and seed data are **no longer separate SQL files**.  
They live in **`server/src/config/initDb.js`** and run automatically every time the server starts.

### What happens on startup

1. `CREATE TABLE IF NOT EXISTS` — tables/indexes/triggers are created only when missing; existing data is untouched.
2. `INSERT … ON CONFLICT DO NOTHING` — seed rows are inserted only if they don't already exist; re-runs are safe.

### Only one manual step required

Create the database itself once (the server cannot do this for you):

```powershell
psql -U postgres -c "CREATE DATABASE fleetflow;"
```

Then just run the server — everything else is automatic:

```powershell
npm run dev
```

### Demo credentials (seeded automatically)

| Email | Password | Role |
|-------|----------|------|
| manager@fleetflow.com | password123 | Fleet Manager |
| mike@fleetflow.com | password123 | Driver |
| safety@fleetflow.com | password123 | Safety Officer |
| finance@fleetflow.com | password123 | Financial Analyst |

### Resetting to a clean state

```powershell
psql -U postgres -c "DROP DATABASE fleetflow;"
psql -U postgres -c "CREATE DATABASE fleetflow;"
# restart the server — schema + seed will be recreated automatically
npm run dev
```
