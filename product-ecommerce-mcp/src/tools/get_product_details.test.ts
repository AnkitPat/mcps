import { describe, it, expect, beforeAll } from 'vitest';
import { getProductDetails } from "./get_product_details.js";
import { db } from "../db.js";

beforeAll(() => {
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
  `);
  db.prepare(`
    INSERT OR REPLACE INTO products (id, name, description, brand, category, price, currency, availability, stock, rating, reviewCount, attributes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('p1', 'Laptop', 'Good laptop', 'Brand', 'Electronics', 1000, 'USD', 'in_stock', 10, 4.5, 100, JSON.stringify({ color: 'silver' }));
});

describe("getProductDetails", () => {
  it("should get product by ID", () => {
    const product = getProductDetails({ productId: "p1" });
    expect(product).toBeDefined();
    expect(product.id).toBe("p1");
  });

  it("should throw error for non-existent product", () => {
    expect(() => getProductDetails({ productId: "non-existent" })).toThrow("Product not found");
  });
});
