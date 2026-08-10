import getPool from './db.js';

const pool = getPool();
if (!pool) {
  throw new Error('Database pool not initialized');
}

console.log('Database pool imported successfully');
