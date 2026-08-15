import { z } from "zod";
import { getProductById, getProductByName } from "../dal.js";
export const getProductDetailsInputSchema = z.object({
    productId: z.string().optional().describe("Product ID"),
    productName: z.string().optional().describe("Product Name"),
});
export function getProductDetails(args) {
    if (args.productId) {
        const product = getProductById(args.productId);
        if (!product)
            throw new Error("Product not found");
        return product;
    }
    if (args.productName) {
        const product = getProductByName(args.productName);
        if (!product)
            throw new Error("Product not found");
        return product;
    }
    throw new Error("Invalid input");
}
export const get_product_details_tool = {
    name: "get_product_details",
    schema: {
        title: "Get Product Details",
        description: "Get complete details for a specific product.",
        inputSchema: getProductDetailsInputSchema,
        annotations: {
            readOnlyHint: true,
            openWorldHint: false,
            destructiveHint: false,
        },
    },
    execute: getProductDetails,
};
