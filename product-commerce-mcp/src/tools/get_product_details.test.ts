import { describe, it } from "node:test";
import assert from "node:assert";
import { getProductDetailsInputSchema } from "./get_product_details.js";

describe("getProductDetailsInputSchema", () => {
  it("should validate when only productId is provided", () => {
    const result = getProductDetailsInputSchema.safeParse({ productId: "1" });
    assert.strictEqual(result.success, true);
  });

  it("should validate when only productName is provided", () => {
    const result = getProductDetailsInputSchema.safeParse({ productName: "laptop" });
    assert.strictEqual(result.success, true);
  });

  it("should fail when both are provided", () => {
    const result = getProductDetailsInputSchema.safeParse({ productId: "1", productName: "laptop" });
    assert.strictEqual(result.success, false);
  });

  it("should fail when neither is provided", () => {
    const result = getProductDetailsInputSchema.safeParse({});
    assert.strictEqual(result.success, false);
  });
});
