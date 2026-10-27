import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, filter, map, of, withLatestFrom } from 'rxjs';
import { errorMessage, StoreApi } from '../core/store-api';
import { ProductsActions } from './products.actions';
import { productsFeature } from './products.feature';

/** The catalogue is small (20 products), so it is fetched once and filtered client-side. */
export const loadProducts = createEffect(
  (actions$ = inject(Actions), store = inject(Store), api = inject(StoreApi)) =>
    actions$.pipe(
      ofType(ProductsActions.loadProducts),
      withLatestFrom(store.select(productsFeature.selectStatus)),
      filter(([, status]) => status !== 'loaded'),
      exhaustMap(() =>
        api.getProducts().pipe(
          map((products) => ProductsActions.loadProductsSuccess({ products })),
          catchError((error) =>
            of(ProductsActions.loadProductsFailure({ error: errorMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);
