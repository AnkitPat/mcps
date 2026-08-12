import { z } from "zod";
import { Product } from "../types/product.js";
import { getProductDetails } from "./get_product_details.js";

export const compareProductsInputSchema = {
  products: z
    .array(z.string())
    .min(2, "At least 2 products are required")
    .describe("Array of product IDs or names to compare"),
};

export function compareProducts(args: { products: string[] }): string {
  const resolvedProducts = args.products.map(idOrName => {
    try {
      return getProductDetails({ productId: idOrName });
    } catch {
      try {
        return getProductDetails({ productName: idOrName });
      } catch {
        return null;
      }
    }
  });

  const foundProducts = resolvedProducts.filter((p): p is Product => p !== null);
  if (foundProducts.length < 2) {
    return "Not enough products found to compare.";
  }

  // Comparison Logic (Basic)
  let report = "Comparison Report:\n\n";
  const headers = ["Attribute", ...foundProducts.map(p => p.name)];
  report += headers.join(" | ") + "\n";
  report += headers.map(() => "---").join(" | ") + "\n";

  const compareField = (label: string, field: keyof Product) => {
    report += `${label} | ${foundProducts.map(p => p[field]).join(" | ")}\n`;
  };

  compareField("Brand", "brand");
  compareField("Price", "price");
  compareField("Rating", "rating");

  return report;
}
