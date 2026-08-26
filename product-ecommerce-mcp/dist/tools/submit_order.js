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
export async function submitOrder(args) {
    let product;
    if (args.productId) {
        product = getProductById(args.productId);
    }
    else if (args.productName) {
        product = getProductByName(args.productName);
    }
    if (!product)
        throw new Error("Product not found");
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
