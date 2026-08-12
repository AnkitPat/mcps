import { z } from "zod";
import { Product } from "../types/product.js";
import { ComparisonError } from "../types/compare.js";
import { getProductDetails } from "./get_product_details.js";

export const compareProductsInputSchema = {
  products: z
    .array(z.string())
    .min(2, "At least 2 products are required")
    .describe("Array of product IDs or names to compare"),
};

type LookupResult =
  | { success: true; product: Product }
  | { success: false; idOrName: string; error: string };

function resolveProduct(idOrName: string): LookupResult {
  try {
    const product = getProductDetails({ productId: idOrName });
    return { success: true, product };
  } catch {
    try {
      const product = getProductDetails({ productName: idOrName });
      return { success: true, product };
    } catch (error: unknown) {
      return {
        success: false,
        idOrName,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export function compareProducts(args: { products: string[] }): string {
  const resolvedProducts = args.products.map(resolveProduct);

  const foundProducts = resolvedProducts
    .filter((r): r is { success: true; product: Product } => r.success)
    .map((r) => r.product);

  const failedProducts = resolvedProducts.filter(
    (r): r is { success: false; idOrName: string; error: string } => !r.success,
  );

  if (failedProducts.length > 0) {
    throw new ComparisonError("Some products could not be found", {
      failed: failedProducts.map((f) => ({ idOrName: f.idOrName, error: f.error })),
    });
  }

  // Comparison Logic (Basic)
  let report = "Comparison Report:\n\n";
  const headers = ["Attribute", ...foundProducts.map((p) => p.name)];
  report += headers.join(" | ") + "\n";
  report += headers.map(() => "---").join(" | ") + "\n";

  const compareField = (label: string, field: keyof Product) => {
    report += `${label} | ${foundProducts.map((p) => p[field]).join(" | ")}\n`;
  };

  compareField("Brand", "brand");
  compareField("Price", "price");
  compareField("Rating", "rating");

  return report;
}
