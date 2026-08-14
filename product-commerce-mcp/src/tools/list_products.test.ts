import { describe, it, expect, beforeAll } from 'vitest';
import { listProducts } from './list_products.js';
import { db } from '../db.js';

beforeAll(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      brand TEXT,
      category TEXT,
      price REAL,
      currency TEXT,
      availability TEXT,
      stock INTEGER,
      attributes TEXT,
      rating REAL,
      reviewCount INTEGER
    );
    INSERT OR REPLACE INTO products VALUES ('p1', 'Laptop', 'Good laptop', 'Brand', 'Electronics', 1000, 'USD', 'in_stock', 10, '{"color": "silver"}', 4.5, 100);
  `);
});

describe('listProducts', () => {
  it('should list products by category', () => {
    const products = listProducts({ category: 'Electronics' });
    expect(products.length).toBe(1);
    expect(products[0].name).toBe('Laptop');
  });
});
