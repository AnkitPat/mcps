# Design Spec: Submit Order Tool

## Purpose
Add a new MCP tool `submit_order` to the `product-commerce-mcp` project to allow users to place an order for a single product.

## Architecture
The tool will:
1. Validate inputs using Zod.
2. Resolve the product using either `productId` or `productName`.
3. Create a new order entry and associated order item in the database.
4. Return the newly created order details.

## Input Schema
The tool accepts an object with the following fields:
*   `userId`: Required string.
*   `productId`: Optional string.
*   `productName`: Optional string. (Validation: either `productId` or `productName` must be provided).
*   `quantity`: Required number (default: 1).
*   `shippingAddress`: Required object:
    *   `name`: string
    *   `addressLine1`: string
    *   `city`: string
    *   `state`: string
    *   `postalCode`: string
    *   `country`: string

## Data Flow
1. Receive input via MCP tool request.
2. Query database for product details.
3. If not found, return an error.
4. If found, calculate total price based on product unit price and quantity.
5. Insert order into `orders` table.
6. Insert order item into `order_items` table.
7. Return the structured `Order` object.

## Error Handling
*   Input validation errors (missing required fields, invalid types).
*   Product not found.
*   Database insertion errors.

## Testing
*   Unit tests for tool schema validation.
*   Integration tests for the database interaction (creating an order).
