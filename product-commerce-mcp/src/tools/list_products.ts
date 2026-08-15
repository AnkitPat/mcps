import { z } from "zod";
import { listProducts as dalListProducts } from "../dal.js";

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

export function listProducts(args: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}) {
  return dalListProducts(args);
}