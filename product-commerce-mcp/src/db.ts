import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, '../commerce.db');
console.log("DB_PATH:", DB_PATH);

export const db = new Database(DB_PATH);

// Enable foreign key support
db.pragma('foreign_keys = ON');

// Get the database instance
export function getDb() {
  return db;
}
