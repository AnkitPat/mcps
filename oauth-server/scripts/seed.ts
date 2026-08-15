import { db } from '../src/db.js';
import { products } from '../../product-commerce-mcp/src/data/products.ts';
import { orders } from '../../product-commerce-mcp/src/data/orders.ts';

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    brand TEXT,
    category TEXT,
    price INTEGER,
    currency TEXT,
    availability TEXT,
    stock INTEGER,
    rating REAL,
    reviewCount INTEGER,
    attributes TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    total INTEGER,
    currency TEXT,
    status TEXT,
    createdAt TEXT,
    shippingAddress TEXT,
    items TEXT
  );
`);

// Insert Data
const insertProduct = db.prepare(`
  INSERT INTO products (id, name, description, brand, category, price, currency, availability, stock, rating, reviewCount, attributes)
  VALUES (@id, @name, @description, @brand, @category, @price, @currency, @availability, @stock, @rating, @reviewCount, @attributes)
`);

products.forEach(p => {
  insertProduct.run({
    ...p,
    attributes: JSON.stringify(p.attributes)
  });
});

const insertOrder = db.prepare(`
  INSERT INTO orders (id, userId, total, currency, status, createdAt, shippingAddress, items)
  VALUES (@id, @userId, @total, @currency, @status, @createdAt, @shippingAddress, @items)
`);

orders.forEach(o => {
  insertOrder.run({
    ...o,
    shippingAddress: JSON.stringify(o.shippingAddress),
    items: JSON.stringify(o.items)
  });
});

console.log('Database seeded successfully.');
