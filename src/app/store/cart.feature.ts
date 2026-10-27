import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { CartItem } from '../core/models';
import { CartActions } from './cart.actions';
import { OrdersActions } from './orders.actions';

export const MAX_QUANTITY = 10;

export type CartState = EntityState<CartItem>;

const adapter = createEntityAdapter<CartItem>({ selectId: (item) => item.productId });

export const initialCartState: CartState = adapter.getInitialState();

const clampQuantity = (quantity: number) =>
  Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity)));

export const cartFeature = createFeature({
  name: 'cart',
  reducer: createReducer(
    initialCartState,
    on(CartActions.addItem, (state, { product, quantity }) => {
      const existing = state.entities[product.id];
      if (existing) {
        return adapter.updateOne(
          { id: product.id, changes: { quantity: clampQuantity(existing.quantity + quantity) } },
          state,
        );
      }
      const { id, title, price, image } = product;
      return adapter.addOne(
        { productId: id, title, price, image, quantity: clampQuantity(quantity) },
        state,
      );
    }),
    on(CartActions.updateQuantity, (state, { productId, quantity }) =>
      quantity < 1
        ? adapter.removeOne(productId, state)
        : adapter.updateOne(
            { id: productId, changes: { quantity: clampQuantity(quantity) } },
            state,
          ),
    ),
    on(CartActions.removeItem, (state, { productId }) => adapter.removeOne(productId, state)),
    on(CartActions.restoreItem, (state, { item }) => adapter.upsertOne(item, state)),
    on(CartActions.clearCart, OrdersActions.placeOrderSuccess, () => initialCartState),
  ),
  extraSelectors: ({ selectCartState }) => {
    const { selectAll } = adapter.getSelectors(selectCartState);
    return {
      selectItems: selectAll,
      selectItemCount: createSelector(selectAll, (items) =>
        items.reduce((count, item) => count + item.quantity, 0),
      ),
    };
  },
});
