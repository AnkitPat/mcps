# Implementation Plan: Require userId in get_orders

## Global Constraints
- userId MUST be required (z.string()).
- No default value for userId.

## Task 1: Create Test for get_orders
**Files:**
- Create: `src/tools/get_orders.test.ts`

**Interfaces:**
- Consumes: `getOrders` from `src/tools/get_orders.ts`
- Produces: Test suite validating `userId` requirement.

## Task 2: Refactor get_orders to require userId
**Files:**
- Edit: `src/tools/get_orders.ts`
