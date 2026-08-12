import { describe, it } from "node:test";
import assert from "node:assert";
import { getProductDetailsInputSchema, getProductDetails } from "./get_product_details.js";
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
describe("getProductDetails", () => {
    it("should return product by productId", () => {
        const product = getProductDetails({ productId: "P1001" });
        assert.strictEqual(product.id, "P1001");
        assert.strictEqual(product.name, "ThinkBook Pro 14");
    });
    it("should return product by productName", () => {
        const product = getProductDetails({ productName: "ThinkBook Pro 14" });
        assert.strictEqual(product.id, "P1001");
        assert.strictEqual(product.name, "ThinkBook Pro 14");
    });
    it("should throw error if product not found by id", () => {
        assert.throws(() => getProductDetails({ productId: "invalid" }), /Product not found/);
    });
    it("should throw error if product not found by name", () => {
        assert.throws(() => getProductDetails({ productName: "invalid" }), /Product not found/);
    });
});
