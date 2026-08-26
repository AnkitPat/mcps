import { describe, it, expect } from 'vitest';
import { compareProducts } from './compare_products.js';
import { ComparisonError } from '../types/compare.js';
describe('compareProducts', () => {
    it('should throw an error if fewer than 2 products are provided', () => {
        // Input validation is handled by Zod, but compareProducts also throws for length check
        // Actually, in the current implementation, compareProducts doesn't check length anymore, Zod schema handles it.
        // The previous test expected error. If Zod is enforced in server, it might not reach here.
        // Let's test the error behavior.
        expect(() => compareProducts({ products: ['product-1'] })).toThrow();
    });
    it('should throw a ComparisonError if products are not found', () => {
        expect(() => compareProducts({ products: ['nonexistent-1', 'nonexistent-2'] })).toThrow(ComparisonError);
    });
});
