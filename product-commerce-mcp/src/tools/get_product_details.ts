import { z } from "zod";
import { products } from "../data/products.js";
import { Product } from "../types/product.js";

export const getProductDetailsInputSchema = {
  productId: z.string().optional().describe("Product ID"),
  productName: z.string().optional().describe("Product Name"),
};

export function getProductDetails(args: {
  productId?: string;
  productName?: string;
}): Product {
  if (args.productId) {
    const product = products.find(p => p.id === args.productId);
    if (!product) throw new Error("Product not found");
    return product;
  }
  
  if (args.productName) {
    const query = args.productName.toLowerCase();
    const product = products.find(p => p.name.toLowerCase().includes(query));
    if (!product) throw new Error("Product not found");
    return product;
  }
  
  throw new Error("Invalid input");
}
