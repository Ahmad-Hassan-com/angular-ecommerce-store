import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, of, tap, withLatestFrom } from 'rxjs';
import { Order } from '../core/models';
import { calculateTotals } from '../core/pricing';
import { errorMessage, StoreApi } from '../core/store-api';
import { CartActions } from './cart.actions';
import { cartFeature } from './cart.feature';
import { OrdersActions } from './orders.actions';

export const placeOrder = createEffect(
  (actions$ = inject(Actions), store = inject(Store), api = inject(StoreApi)) =>
    actions$.pipe(
      ofType(OrdersActions.placeOrder),
      withLatestFrom(store.select(cartFeature.selectItems)),
      exhaustMap(([{ details }, items]) =>
        api.createCart(items).pipe(
          map((response) => {
            const order: Order = {
              ...details,
              id: `CW-${Date.now().toString(36).toUpperCase()}`,
              apiCartId: response?.id ?? null,
              placedAt: new Date().toISOString(),
              items,
              totals: calculateTotals(items, details.delivery),
            };
            return OrdersActions.placeOrderSuccess({ order });
          }),
          catchError((error) =>
            of(OrdersActions.placeOrderFailure({ error: errorMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const showOrderConfirmation = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(OrdersActions.placeOrderSuccess),
      tap(({ order }) =>
        router.navigate(['/orders', order.id], { queryParams: { placed: true }, replaceUrl: true }),
      ),
    ),
  { functional: true, dispatch: false },
);

export const notifyOrderFailure = createEffect(
  (actions$ = inject(Actions), snackBar = inject(MatSnackBar)) =>
    actions$.pipe(
      ofType(OrdersActions.placeOrderFailure),
      tap(({ error }) => snackBar.open(error, 'Dismiss', { duration: 6000 })),
    ),
  { functional: true, dispatch: false },
);

export const notifyItemAdded = createEffect(
  (actions$ = inject(Actions), snackBar = inject(MatSnackBar), router = inject(Router)) =>
    actions$.pipe(
      ofType(CartActions.addItem),
      tap(({ product, quantity }) => {
        const name = shorten(product.title);
        const label = quantity > 1 ? `${quantity} × ${name}` : name;
        snackBar
          .open(`Added ${label} to your cart`, 'View cart', { duration: 4000 })
          .onAction()
          .subscribe(() => router.navigate(['/cart']));
      }),
    ),
  { functional: true, dispatch: false },
);

function shorten(title: string, max = 32): string {
  return title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;
}
