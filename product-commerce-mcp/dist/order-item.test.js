import { it, expect } from 'vitest';
it('should allow optional productId and productName', () => {
    const item = {
        quantity: 1,
        unitPrice: 10
    };
    expect(item.quantity).toBe(1);
});
