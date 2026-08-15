import { getProductDetails } from "./get_product_details.js";

describe("getProductDetails", () => {
  it("should get product by ID", () => {
    const product = getProductDetails({ productId: "p1" });
    expect(product).toBeDefined();
    expect(product.id).toBe("p1");
  });

  it("should throw error for non-existent product", () => {
    expect(() => getProductDetails({ productId: "non-existent" })).toThrow("Product not found");
  });
});
