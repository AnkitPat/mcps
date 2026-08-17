# Submit Order Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new MCP tool `submit_order` to the `product-commerce-mcp` project to allow users to place an order for a single product.

**Architecture:** The tool will be implemented as a new function in `src/tools/`, with database interaction handled in `src/dal.ts`.

**Tech Stack:** Node.js, TypeScript, SQLite, Zod.

## Global Constraints

*   `userId` is a required string.
*   Product identification: either `productId` OR `productName` is required.
*   `quantity` is a required number (default: 1).
*   `shippingAddress` is a required object with fields: `name`, `addressLine1`, `city`, `state`, `postalCode`, `country`.
*   The solution must be testable via unit and integration tests.

---

### Task 1: Update DAL for Order Creation

**Files:**
- Modify: `product-commerce-mcp/src/dal.ts`
- Test: `product-commerce-mcp/src/dal.test.ts`

**Interfaces:**
- Produces: `export function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Order;`

- [ ] **Step 1: Write failing test for `createOrder`**

Add this to `dal.test.ts`:

```typescript
import { createOrder } from "./dal";

test("createOrder should create a new order", () => {
  const newOrder = {
    userId: "user1",
    items: [{ productId: "p1", productName: "Product 1", quantity: 1, unitPrice: 10 }],
    total: 10,
    currency: "USD",
    status: "pending" as const,
    shippingAddress: {
      name: "John Doe",
      addressLine1: "123 Main St",
      city: "Anytown",
      state: "CA",
      postalCode: "12345",
      country: "USA"
    }
  };
  const order = createOrder(newOrder);
  expect(order.id).toBeDefined();
  expect(order.userId).toBe("user1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL (createOrder not implemented)

- [ ] **Step 3: Implement `createOrder` in `dal.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/dal.ts src/dal.test.ts
git commit -m "feat: add createOrder to DAL"
```

### Task 2: Implement Submit Order Tool

**Files:**
- Create: `product-commerce-mcp/src/tools/submit_order.ts`
- Modify: `product-commerce-mcp/src/tools/index.ts`
- Test: `product-commerce-mcp/src/tools/submit_order.test.ts`

**Interfaces:**
- Consumes: `createOrder` from `dal.ts`, `getProductById` from `dal.ts`, `getProductByName` from `dal.ts`.

- [ ] **Step 1: Create `submit_order.ts`**

```typescript
import { z } from "zod";
import { createOrder, getProductById, getProductByName } from "../dal.js";

export const submitOrderInputSchema = z.object({
  userId: z.string().describe("User ID"),
  productId: z.string().optional().describe("Product ID"),
  productName: z.string().optional().describe("Product Name"),
  quantity: z.number().int().min(1).default(1).describe("Quantity"),
  shippingAddress: z.object({
    name: z.string(),
    addressLine1: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
}).refine(data => data.productId || data.productName, {
  message: "Either productId or productName must be provided",
  path: ["productId"]
});

export async function submitOrder(args: z.infer<typeof submitOrderInputSchema>) {
  let product;
  if (args.productId) {
    product = getProductById(args.productId);
  } else if (args.productName) {
    product = getProductByName(args.productName);
  }
  
  if (!product) throw new Error("Product not found");
  
  return createOrder({
    userId: args.userId,
    items: [{
      productId: product.id,
      productName: product.name,
      quantity: args.quantity,
      unitPrice: product.price
    }],
    total: product.price * args.quantity,
    currency: product.currency,
    status: "pending",
    shippingAddress: args.shippingAddress
  });
}

export const submit_order_tool = {
  name: "submit_order",
  schema: {
    title: "Submit Order",
    description: "Submit a new order for a single product.",
    inputSchema: submitOrderInputSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: true,
    },
  },
  execute: submitOrder,
};
```

- [ ] **Step 2: Register in `tools/index.ts`**

Add `submit_order_tool` to exports.

- [ ] **Step 3: Add test in `submit_order.test.ts`**

```typescript
import { submitOrder } from "./submit_order";

test("submitOrder should create an order", async () => {
  const result = await submitOrder({
    userId: "u1",
    productId: "p1",
    quantity: 1,
    shippingAddress: {
      name: "John",
      addressLine1: "123",
      city: "NY",
      state: "NY",
      postalCode: "1",
      country: "USA"
    }
  });
  expect(result.id).toBeDefined();
});
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tools/submit_order.ts src/tools/index.ts src/tools/submit_order.test.ts
git commit -m "feat: implement submit_order tool"
```
