import { ActionReducer, INIT, UPDATE } from '@ngrx/store';
import { Order } from '../core/models';
import { CartState } from './cart.feature';
import type { AppState } from './index';

const STORAGE_KEY = 'cartwheel.state.v1';

interface PersistedState {
  cart: CartState;
  orders: Order[];
}

/** Restores the cart and order history on startup and writes them back whenever they change. */
export function persistState(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return (state, action) => {
    const next = reducer(state, action);

    if (action.type === INIT || action.type === UPDATE) {
      const saved = load();
      return saved
        ? { ...next, cart: saved.cart, orders: { ...next.orders, orders: saved.orders } }
        : next;
    }

    if (state && (next.cart !== state.cart || next.orders.orders !== state.orders.orders)) {
      save({ cart: next.cart, orders: next.orders.orders });
    }
    return next;
  };
}

function load(): PersistedState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as PersistedState | null;
    const valid =
      parsed &&
      Array.isArray(parsed.cart?.ids) &&
      typeof parsed.cart.entities === 'object' &&
      Array.isArray(parsed.orders);
    return valid ? parsed : null;
  } catch {
    return null;
  }
}

function save(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private mode); the app keeps working in memory.
  }
}
