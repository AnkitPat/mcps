import { describe, it, expect, beforeAll } from 'vitest';
import { getProductById, getProductByName, listProducts, getOrdersByUserId } from './dal.js';
import { db } from './db.js';

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
    
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT,
      total REAL,
      currency TEXT,
      status TEXT,
      shippingAddress TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT,
      productId TEXT,
      productName TEXT,
      quantity INTEGER,
      unitPrice REAL,
      FOREIGN KEY(orderId) REFERENCES orders(id)
    );

    INSERT OR REPLACE INTO products VALUES ('p1', 'Laptop', 'Good laptop', 'Brand', 'Electronics', 1000, 'USD', 'in_stock', 10, '{"color": "silver"}', 4.5, 100);
    INSERT OR REPLACE INTO orders VALUES ('o1', 'u1', 1000, 'USD', 'pending', '{"name": "John Doe", "addressLine1": "123 Main St", "city": "City", "state": "State", "postalCode": "12345", "country": "Country"}', '2023-01-01');
    INSERT OR REPLACE INTO order_items VALUES ('i1', 'o1', 'p1', 'Laptop', 1, 1000);
  `);
});

describe('DAL', () => {
  it('should get product by ID', () => {
    const p1 = getProductById('p1');
    expect(p1).toBeDefined();
    expect(p1?.name).toBe('Laptop');
    expect(typeof p1?.attributes).toBe('object');
    expect(p1?.attributes.color).toBe('silver');
  });

  it('should get product by name', () => {
    const p2 = getProductByName('Lap');
    expect(p2).toBeDefined();
    expect(p2?.name).toBe('Laptop');
  });

  it('should list products by category', () => {
    const products = listProducts({ category: 'Electronics' });
    expect(products.length).toBe(1);
    expect(products[0].name).toBe('Laptop');
  });

  it('should get orders by user ID', () => {
    const orders = getOrdersByUserId('u1');
    expect(orders.length).toBe(1);
    expect(orders[0].items.length).toBe(1);
    expect(typeof orders[0].shippingAddress).toBe('object');
  });
});
