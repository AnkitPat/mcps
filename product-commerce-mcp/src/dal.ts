import crypto from "node:crypto";
import { db } from "./db.js";
import { Product } from "./types/product.js";
import { Order } from "./types/order.js";

export function getProductById(id: string): Product | undefined {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
  if (!row) return undefined;
  return { ...row, attributes: JSON.parse(row.attributes) };
}

export function getProductByName(name: string): Product | undefined {
  const row = db.prepare("SELECT * FROM products WHERE name LIKE ?").get(`%${name}%`) as any;
  if (!row) return undefined;
  return { ...row, attributes: JSON.parse(row.attributes) };
}

export function listProducts(args: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}): Product[] {
  let query = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];

  if (args.query) {
    query += " AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)";
    params.push(`%${args.query}%`, `%${args.query}%`, `%${args.query}%`);
  }

  if (args.category) {
    query += " AND category = ?";
    params.push(args.category);
  }

  if (args.minPrice !== undefined) {
    query += " AND price >= ?";
    params.push(args.minPrice);
  }

  if (args.maxPrice !== undefined) {
    query += " AND price <= ?";
    params.push(args.maxPrice);
  }

  query += " LIMIT ?";
  params.push(args.limit ?? 10);

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(row => ({ ...row, attributes: JSON.parse(row.attributes) }));
}

export function getOrdersByUserId(userId: string): Order[] {
  const orders = db.prepare("SELECT * FROM orders WHERE userId = ?").all(userId) as any[];
  
  return orders.map(order => {
    const items = db.prepare("SELECT * FROM order_items WHERE orderId = ?").all(order.id) as any[];
    return {
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };
  });
}

export function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Order {
  const orderId = crypto.randomUUID();
  db.prepare(`INSERT INTO orders (id, userId, total, currency, status, shippingAddress) VALUES (?, ?, ?, ?, ?, ?)`).run(
    orderId, order.userId, order.total, order.currency, order.status, JSON.stringify(order.shippingAddress)
  );

  for (const item of order.items) {
    db.prepare(`INSERT INTO order_items (orderId, productId, productName, quantity, unitPrice) VALUES (?, ?, ?, ?, ?)`).run(
      orderId, item.productId, item.productName, item.quantity, item.unitPrice
    );
  }

  return { ...order, id: orderId, createdAt: new Date().toISOString() };
}
