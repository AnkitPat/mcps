import { z } from "zod";
import { ComparisonError } from "../types/compare.js";
import { getProductDetails } from "./get_product_details.js";
export const compareProductsInputSchema = z.object({
    products: z
        .array(z.string())
        .min(2, "At least 2 products are required")
        .describe("Array of product IDs or names to compare"),
});
function resolveProduct(idOrName) {
    try {
        const product = getProductDetails({ productId: idOrName });
        return { success: true, product };
    }
    catch {
        try {
            const product = getProductDetails({ productName: idOrName });
            return { success: true, product };
        }
        catch (error) {
            return {
                success: false,
                idOrName,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}
export function compareProducts(args) {
    const resolvedProducts = args.products.map(resolveProduct);
    const foundProducts = resolvedProducts
        .filter((r) => r.success)
        .map((r) => r.product);
    const failedProducts = resolvedProducts.filter((r) => !r.success);
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
    const compareField = (label, field) => {
        report += `${label} | ${foundProducts.map((p) => p[field]).join(" | ")}\n`;
    };
    compareField("Brand", "brand");
    compareField("Price", "price");
    compareField("Rating", "rating");
    return report;
}
export const compare_products_tool = {
    name: "compare_products",
    schema: {
        title: "Compare Products",
        description: "Compare multiple products across price, rating and attributes.",
        inputSchema: compareProductsInputSchema,
        annotations: {
            readOnlyHint: true,
            openWorldHint: false,
            destructiveHint: false,
        },
    },
    execute: compareProducts,
};
