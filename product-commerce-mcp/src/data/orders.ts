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
  },
  {
    id: "ORD-10002",
    userId: "demo-user",
    items: [
      {
        productId: "P2002",
        productName: "Galaxy S24 Ultra",
        quantity: 1,
        unitPrice: 119999
      }
    ],
    total: 119999,
    currency: "INR",
    status: "pending",
    shippingAddress: {
      name: "Demo User",
      addressLine1: "456 Side Street",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India"
    },
    createdAt: "2026-08-14T09:00:00.000Z"
  },
  {
    id: "ORD-10003",
    userId: "demo-user",
    items: [
      {
        productId: "P1001",
        productName: "ThinkBook Pro 14",
        quantity: 2,
        unitPrice: 69999
      }
    ],
    total: 139998,
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
    createdAt: "2026-08-13T15:30:00.000Z"
  },
  {
    id: "ORD-10004",
    userId: "demo-user",
    items: [
      {
        productId: "P3001",
        productName: "Sony WH-1000XM5",
        quantity: 1,
        unitPrice: 29990
      }
    ],
    total: 29990,
    currency: "INR",
    status: "pending",
    shippingAddress: {
      name: "Demo User",
      addressLine1: "789 Tech Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      country: "India"
    },
    createdAt: "2026-08-14T10:00:00.000Z"
  }
];