import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Database client
 */
export const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query;
  const originalRelease = client.release;

  // Set a timeout for transactions
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  // Monkey patch the query method to log queries
  client.query = (...args) => {
    return originalQuery.apply(client, args);
  };

  // Monkey patch the release method to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease.apply(client);
  };

  return client;
};

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export default {
  query,
  getClient,
  testConnection,
  pool,
};
