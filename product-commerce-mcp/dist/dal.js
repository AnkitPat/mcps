import { db } from "./db.js";
export function getProductById(id) {
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!row)
        return undefined;
    return { ...row, attributes: JSON.parse(row.attributes) };
}
export function getProductByName(name) {
    const row = db.prepare("SELECT * FROM products WHERE name LIKE ?").get(`%${name}%`);
    if (!row)
        return undefined;
    return { ...row, attributes: JSON.parse(row.attributes) };
}
export function listProducts(args) {
    let query = "SELECT * FROM products WHERE 1=1";
    const params = [];
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
    const rows = db.prepare(query).all(...params);
    return rows.map(row => ({ ...row, attributes: JSON.parse(row.attributes) }));
}
export function getOrdersByUserId(userId) {
    const orders = db.prepare("SELECT * FROM orders WHERE userId = ?").all(userId);
    return orders.map(order => {
        const items = db.prepare("SELECT * FROM order_items WHERE orderId = ?").all(order.id);
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
