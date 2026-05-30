const { Pool } = require('pg');

// Create connection pool with max connections configured to 20
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'study_flow_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'your_password',
  // Pool settings: maximum 20 connections
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle error events on idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
