import dotenv from 'dotenv';
import app from './app.js';
import { testConnection } from './config/db.js';
import { initDatabase } from './config/initDb.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      console.error('Please check your DATABASE_URL environment variable');
      process.exit(1);
    }

    // Auto-create schema and seed demo data (idempotent — safe to run every start)
    await initDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║                                            ║');
      console.log('║          FleetFlow API Server              ║');
      console.log('║                                            ║');
      console.log('╚════════════════════════════════════════════╝');
      console.log('');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ API URL: http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('Press CTRL+C to stop');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();
