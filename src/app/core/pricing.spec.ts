import { CartItem } from './models';
import { addBusinessDays, calculateTotals } from './pricing';

const item = (price: number, quantity: number): CartItem => ({
  productId: price,
  title: '',
  image: '',
  price,
  quantity,
});

describe('calculateTotals', () => {
  it('charges standard shipping below the free threshold', () => {
    expect(calculateTotals([item(19.99, 2)], 'standard')).toEqual({
      subtotal: 39.98,
      shipping: 4.99,
      tax: 3.2,
      total: 48.17,
    });
  });

  it('ships standard orders free from $100', () => {
    expect(calculateTotals([item(50, 2)], 'standard').shipping).toBe(0);
  });

  it('always charges for express', () => {
    expect(calculateTotals([item(50, 2)], 'express').shipping).toBe(14.99);
  });

  it('is all zeros for an empty cart', () => {
    expect(calculateTotals([], 'express')).toEqual({ subtotal: 0, shipping: 0, tax: 0, total: 0 });
  });
});

describe('addBusinessDays', () => {
  it('skips weekends', () => {
    const friday = new Date(2026, 9, 23);
    expect(addBusinessDays(friday, 1).getDay()).toBe(1);
    expect(addBusinessDays(friday, 3).getDate()).toBe(28);
  });
});
