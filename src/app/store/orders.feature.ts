import { createFeature, createReducer, on } from '@ngrx/store';
import { Order } from '../core/models';
import { OrdersActions } from './orders.actions';

export interface OrdersState {
  /** Newest first. */
  orders: Order[];
  placing: boolean;
  error: string | null;
}

export const initialOrdersState: OrdersState = { orders: [], placing: false, error: null };

export const ordersFeature = createFeature({
  name: 'orders',
  reducer: createReducer(
    initialOrdersState,
    on(OrdersActions.placeOrder, (state): OrdersState => ({
      ...state,
      placing: true,
      error: null,
    })),
    on(OrdersActions.placeOrderSuccess, (state, { order }): OrdersState => ({
      ...state,
      orders: [order, ...state.orders],
      placing: false,
    })),
    on(OrdersActions.placeOrderFailure, (state, { error }): OrdersState => ({
      ...state,
      placing: false,
      error,
    })),
  ),
});
