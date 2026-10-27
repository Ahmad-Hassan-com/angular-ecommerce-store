import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CartItem, Product } from '../core/models';

export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Add Item': props<{ product: Product; quantity: number }>(),
    'Update Quantity': props<{ productId: number; quantity: number }>(),
    'Remove Item': props<{ productId: number }>(),
    'Restore Item': props<{ item: CartItem }>(),
    'Clear Cart': emptyProps(),
  },
});
