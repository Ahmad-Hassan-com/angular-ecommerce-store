import { createActionGroup, props } from '@ngrx/store';
import { CheckoutDetails, Order } from '../core/models';

export const OrdersActions = createActionGroup({
  source: 'Orders',
  events: {
    'Place Order': props<{ details: CheckoutDetails }>(),
    'Place Order Success': props<{ order: Order }>(),
    'Place Order Failure': props<{ error: string }>(),
  },
});
