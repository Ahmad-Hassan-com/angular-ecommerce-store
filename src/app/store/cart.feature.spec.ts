import { Order, Product } from '../core/models';
import { CartActions } from './cart.actions';
import { cartFeature, initialCartState, MAX_QUANTITY } from './cart.feature';
import { OrdersActions } from './orders.actions';

const { reducer, selectItems, selectItemCount } = cartFeature;

const product = (id: number, price = 10): Product => ({
  id,
  title: `Product ${id}`,
  price,
  description: '',
  category: 'electronics',
  image: `https://example.com/${id}.png`,
  rating: { rate: 4, count: 10 },
});

describe('cart reducer', () => {
  it('adds a new item with a snapshot of the product', () => {
    const state = reducer(
      initialCartState,
      CartActions.addItem({ product: product(1), quantity: 2 }),
    );
    expect(selectItems.projector(state)).toEqual([
      {
        productId: 1,
        title: 'Product 1',
        price: 10,
        image: 'https://example.com/1.png',
        quantity: 2,
      },
    ]);
  });

  it('merges repeat adds and caps the quantity', () => {
    let state = reducer(
      initialCartState,
      CartActions.addItem({ product: product(1), quantity: 6 }),
    );
    state = reducer(state, CartActions.addItem({ product: product(1), quantity: 6 }));
    expect(state.ids).toEqual([1]);
    expect(state.entities[1]?.quantity).toBe(MAX_QUANTITY);
  });

  it('removes an item when its quantity drops below 1', () => {
    let state = reducer(
      initialCartState,
      CartActions.addItem({ product: product(1), quantity: 1 }),
    );
    state = reducer(state, CartActions.updateQuantity({ productId: 1, quantity: 0 }));
    expect(state.ids).toEqual([]);
  });

  it('restores a removed item (undo)', () => {
    let state = reducer(
      initialCartState,
      CartActions.addItem({ product: product(1), quantity: 3 }),
    );
    const item = state.entities[1]!;
    state = reducer(state, CartActions.removeItem({ productId: 1 }));
    state = reducer(state, CartActions.restoreItem({ item }));
    expect(state.entities[1]?.quantity).toBe(3);
  });

  it('empties the cart once an order is placed', () => {
    const state = reducer(
      initialCartState,
      CartActions.addItem({ product: product(1), quantity: 1 }),
    );
    const next = reducer(state, OrdersActions.placeOrderSuccess({ order: {} as Order }));
    expect(next).toEqual(initialCartState);
  });

  it('counts units, not lines', () => {
    let state = reducer(
      initialCartState,
      CartActions.addItem({ product: product(1), quantity: 2 }),
    );
    state = reducer(state, CartActions.addItem({ product: product(2), quantity: 3 }));
    expect(selectItemCount.projector(selectItems.projector(state))).toBe(5);
  });
});
