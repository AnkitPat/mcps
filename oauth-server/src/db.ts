import pkg from 'pg';
const { Pool } = pkg;

let pool: any;

export default function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    // Use DATABASE_URL from environment
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Add SSL for managed databases
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}
