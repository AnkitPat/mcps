import type { Order } from "../types/order.js";

export const orders: Order[] = [
  {
    id: "ORD-10001",
    userId: "demo-user",
    items: [
      {
        productId: "P1001",
        productName: "ThinkBook Pro 14",
        quantity: 1,
        unitPrice: 69999
      }
    ],
    total: 69999,
    currency: "INR",
    status: "shipped",
    shippingAddress: {
      name: "Demo User",
      addressLine1: "123 Main Street",
      city: "Indore",
      state: "Madhya Pradesh",
      postalCode: "452001",
      country: "India"
    },
    createdAt: "2026-08-01T10:00:00.000Z"
  }
];