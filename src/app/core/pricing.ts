import { CartItem, DeliveryMethod, OrderTotals } from './models';

export const FREE_SHIPPING_THRESHOLD = 100;
export const TAX_RATE = 0.08;

export const DELIVERY_OPTIONS: Record<
  DeliveryMethod,
  { label: string; description: string; price: number; minDays: number; maxDays: number }
> = {
  standard: {
    label: 'Standard',
    description: '3–5 business days, free over $100',
    price: 4.99,
    minDays: 3,
    maxDays: 5,
  },
  express: {
    label: 'Express',
    description: '1–2 business days',
    price: 14.99,
    minDays: 1,
    maxDays: 2,
  },
};

const roundCents = (value: number) => Math.round(value * 100) / 100;

export function shippingCost(subtotal: number, method: DeliveryMethod): number {
  if (subtotal <= 0) return 0;
  if (method === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return DELIVERY_OPTIONS[method].price;
}

export function calculateTotals(
  items: readonly CartItem[],
  method: DeliveryMethod = 'standard',
): OrderTotals {
  const subtotal = roundCents(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const shipping = shippingCost(subtotal, method);
  const tax = roundCents(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: roundCents(subtotal + shipping + tax) };
}

/** Adds business days (skipping weekends) to a date. */
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date;
}
