# Add Dummy Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Pixel 8a and Sony WH-1000XM5 to the product database, and create a new pending order (ORD-10004).

**Architecture:** Update static data arrays and re-run the existing seed script to sync the SQLite database.

**Tech Stack:** TypeScript, SQLite (via `better-sqlite3`), Node.js (via `tsx`).

## Global Constraints

- Must maintain TypeScript type safety for `Product` and `Order`.
- Must not break existing database schema.
- Must verify changes using `sqlite3`.

---

### Task 1: Update `src/data/products.ts`

**Files:**
- Modify: `src/data/products.ts`

**Interfaces:**
- Produces: `products` array with P1005 (Pixel 8a) and P3001 (Sony WH-1000XM5) added.

- [ ] **Step 1: Append new products to `products` array**

```typescript
// Add to the end of the existing products array in src/data/products.ts
  {
    id: "P1005",
    name: "Pixel 8a",
    description: "Budget-friendly smartphone with flagship features.",
    brand: "Google",
    category: "smartphones",
    price: 49999,
    currency: "INR",
    availability: "in_stock",
    stock: 20,
    rating: 4.5,
    reviewCount: 500,
    attributes: {
      display: "6.1 inch OLED",
      ram: "8 GB",
      storage: "128 GB",
      camera: "64 MP",
      battery: "4492 mAh"
    }
  },
  {
    id: "P3001",
    name: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling headphones.",
    brand: "Sony",
    category: "accessories",
    price: 29990,
    currency: "INR",
    availability: "in_stock",
    stock: 15,
    rating: 4.7,
    reviewCount: 3000,
    attributes: {
      type: "Over-ear",
      batteryLife: "30 hours",
      connectivity: "Bluetooth 5.2"
    }
  }
```

- [ ] **Step 2: Commit**

```bash
git add src/data/products.ts
git commit -m "feat: add dummy products Pixel 8a and Sony WH-1000XM5"
```

---

### Task 2: Update `src/data/orders.ts`

**Files:**
- Modify: `src/data/orders.ts`

**Interfaces:**
- Consumes: P3001 (Sony WH-1000XM5) from Task 1.
- Produces: `orders` array with ORD-10004 added.

- [ ] **Step 1: Append new order to `orders` array**

```typescript
// Add to the end of the existing orders array in src/data/orders.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/data/orders.ts
git commit -m "feat: add dummy order ORD-10004"
```

---

### Task 3: Seed Database and Verify

**Files:**
- Modify: None
- Run: `scripts/seed.ts`
- Verify: `commerce.db`

- [ ] **Step 1: Run seed script**

```bash
npx tsx scripts/seed.ts
```

- [ ] **Step 2: Verify database counts**

Run: `sqlite3 commerce.db "SELECT count(*) FROM products; SELECT count(*) FROM orders;"`
Expected Output:
`8`
`4`

- [ ] **Step 3: Commit verification**

```bash
git add commerce.db
git commit -m "chore: update database with new dummy data"
```
