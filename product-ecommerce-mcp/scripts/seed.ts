import { db } from "../src/db.js";
console.log("Database instance loaded");
import { products } from "../src/data/products.js";
import { orders } from "../src/data/orders.js";
console.log("Data loaded");

// Create tables
console.log("Creating tables...");
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    brand TEXT,
    category TEXT,
    price INTEGER NOT NULL,
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
    total INTEGER NOT NULL,
    currency TEXT,
    status TEXT,
    createdAt TEXT,
    shippingAddress TEXT
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    productId TEXT NOT NULL,
    productName TEXT,
    quantity INTEGER,
    unitPrice INTEGER,
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );
`);
console.log("Tables created successfully.");

// Insert products
console.log("Inserting products...");
const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (id, name, description, brand, category, price, currency, availability, stock, rating, reviewCount, attributes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of products) {
  insertProduct.run(
    p.id,
    p.name,
    p.description,
    p.brand,
    p.category,
    p.price,
    p.currency,
    p.availability,
    p.stock,
    p.rating,
    p.reviewCount,
    JSON.stringify(p.attributes)
  );
}
console.log("Products inserted.");

// Insert orders and order_items
console.log("Inserting orders...");
const insertOrder = db.prepare(`
  INSERT OR REPLACE INTO orders (id, userId, total, currency, status, createdAt, shippingAddress)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertOrderItem = db.prepare(`
  INSERT INTO order_items (orderId, productId, productName, quantity, unitPrice)
  VALUES (?, ?, ?, ?, ?)
`);

for (const o of orders) {
  insertOrder.run(
    o.id,
    o.userId,
    o.total,
    o.currency,
    o.status,
    o.createdAt,
    JSON.stringify(o.shippingAddress)
  );
  for (const item of o.items) {
    insertOrderItem.run(
      o.id,
      item.productId,
      item.productName,
      item.quantity,
      item.unitPrice
    );
  }
}
console.log("Orders inserted.");

console.log("Database seeded successfully.");
