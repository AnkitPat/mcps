import { z } from "zod";
import { products } from "../data/products.js";
import { Product } from "../types/product.js";

export const getProductDetailsInputSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().optional(),
}).refine(data => !!data.productId !== !!data.productName, {
  message: "Provide either productId or productName, but not both",
});
