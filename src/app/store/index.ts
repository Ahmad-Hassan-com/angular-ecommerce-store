import { isDevMode } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { cartFeature, CartState } from './cart.feature';
import { ordersFeature, OrdersState } from './orders.feature';
import { persistState } from './persist.meta-reducer';
import * as productsEffects from './products.effects';
import { productsFeature, ProductsState } from './products.feature';
import * as storeEffects from './store.effects';

export interface AppState {
  products: ProductsState;
  cart: CartState;
  orders: OrdersState;
}

export function provideAppStore() {
  return [
    provideStore<AppState>(
      {
        products: productsFeature.reducer,
        cart: cartFeature.reducer,
        orders: ordersFeature.reducer,
      },
      { metaReducers: [persistState] },
    ),
    provideEffects(productsEffects, storeEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ];
}
