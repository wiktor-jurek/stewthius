import { Pool } from 'pg';

// Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Make SSL configurable via environment variable
  // Set DATABASE_SSL=false if your database doesn't support SSL
  ssl: process.env.DATABASE_SSL === 'false' 
    ? false 
    : process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
});

export default pool; 