import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'FleetFlow API',
    },
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Import route modules
import authRoutes from './modules/auth/routes.js';
import vehicleRoutes from './modules/vehicle/routes.js';
import driverRoutes from './modules/driver/routes.js';
import tripRoutes from './modules/trip/routes.js';
import maintenanceRoutes from './modules/maintenance/routes.js';
import fuelRoutes from './modules/fuel/routes.js';
import expenseRoutes from './modules/expense/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
