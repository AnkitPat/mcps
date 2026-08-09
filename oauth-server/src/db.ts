import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// Use DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add SSL for managed databases
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
