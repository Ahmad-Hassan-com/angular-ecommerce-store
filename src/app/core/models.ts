export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: { rate: number; count: number };
}

/** A cart line keeps a snapshot of the product so the cart renders before the catalogue loads. */
export interface CartItem {
  productId: number;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export type DeliveryMethod = 'standard' | 'express';

/** Only what is safe to keep: the full card number and CVC never leave the checkout form. */
export interface PaymentSummary {
  cardholder: string;
  brand: string;
  last4: string;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface CheckoutDetails {
  shipping: ShippingAddress;
  delivery: DeliveryMethod;
  payment: PaymentSummary;
}

/** An order line remembers what the item cost the store when it was sold, for profit reports. */
export interface OrderLine extends CartItem {
  unitCost?: number;
}

export interface Order extends CheckoutDetails {
  id: string;
  /** Id returned by the Fake Store API's POST /carts. */
  apiCartId: number | null;
  placedAt: string;
  items: OrderLine[];
  totals: OrderTotals;
}

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** A product created in the admin area. `cost` is what the store pays per unit. */
export interface AdminProduct extends Product {
  cost: number;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Salaries',
  'Marketing',
  'Shipping',
  'Software',
  'Utilities',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  category: ExpenseCategory;
  amount: number;
  note: string;
  /** Generated sample data, not entered by the admin. */
  demo?: boolean;
}
