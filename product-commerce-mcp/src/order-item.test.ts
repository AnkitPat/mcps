import { it, expect } from 'vitest';
import { OrderItem } from './types/order.js';

it('should allow optional productId and productName', () => {
  const item: OrderItem = {
    quantity: 1,
    unitPrice: 10
  };
  expect(item.quantity).toBe(1);
});
