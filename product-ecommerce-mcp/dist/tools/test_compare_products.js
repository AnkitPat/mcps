import { compareProducts } from './compare_products.js';
import assert from 'node:assert';
console.log("Running tests...");
// Test 1: Fewer than 2 products (should throw)
assert.throws(() => compareProducts({ products: ['product-1'] }), {
    message: /At least 2 products are required/
});
console.log("Test 1 passed: Fewer than 2 products");
// Test 2: Products not found (should throw)
assert.throws(() => compareProducts({ products: ['nonexistent-1', 'nonexistent-2'] }), {
    message: /Products not found/
});
console.log("Test 2 passed: Products not found");
console.log("All tests passed!");
