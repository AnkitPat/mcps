import { z } from "zod";
import { getProductById, getProductByName } from "../dal.js";
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
    const product = getProductById(args.productId);
    if (!product) throw new Error("Product not found");
    return product;
  }
  
  if (args.productName) {
    const product = getProductByName(args.productName);
    if (!product) throw new Error("Product not found");
    return product;
  }
  
  throw new Error("Invalid input");
}
