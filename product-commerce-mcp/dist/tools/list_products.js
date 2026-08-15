import { z } from "zod";
import { products } from "../data/products.js";
export const listProductsInputSchema = {
    query: z
        .string()
        .optional()
        .describe("Search term for product name, brand or description"),
    category: z
        .string()
        .optional()
        .describe("Product category"),
    minPrice: z
        .number()
        .optional()
        .describe("Minimum price"),
    maxPrice: z
        .number()
        .optional()
        .describe("Maximum price"),
    limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum number of products to return")
};
export function listProducts(args) {
    const query = args.query?.toLowerCase();
    let result = products.filter((product) => {
        if (query) {
            const searchableText = [
                product.name,
                product.brand,
                product.description,
                product.category
            ]
                .join(" ")
                .toLowerCase();
            if (!searchableText.includes(query)) {
                return false;
            }
        }
        if (args.category &&
            product.category.toLowerCase() !== args.category.toLowerCase()) {
            return false;
        }
        if (args.minPrice !== undefined && product.price < args.minPrice) {
            return false;
        }
        if (args.maxPrice !== undefined && product.price > args.maxPrice) {
            return false;
        }
        return true;
    });
    result = result.slice(0, args.limit ?? 10);
    return result;
}
