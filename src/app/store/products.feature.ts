import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';
import { LoadStatus, Product } from '../core/models';
import { ProductsActions } from './products.actions';

export interface ProductsState extends EntityState<Product> {
  status: LoadStatus;
  error: string | null;
}

const adapter = createEntityAdapter<Product>();

const initialState: ProductsState = adapter.getInitialState({ status: 'idle', error: null });

export const productsFeature = createFeature({
  name: 'products',
  reducer: createReducer(
    initialState,
    on(ProductsActions.loadProducts, (state): ProductsState =>
      state.status === 'loaded' ? state : { ...state, status: 'loading', error: null },
    ),
    on(ProductsActions.loadProductsSuccess, (state, { products }) =>
      adapter.setAll(products, { ...state, status: 'loaded' as const }),
    ),
    on(ProductsActions.loadProductsFailure, (state, { error }): ProductsState => ({
      ...state,
      status: 'error',
      error,
    })),
  ),
  extraSelectors: ({ selectProductsState }) => ({
    selectAllProducts: adapter.getSelectors(selectProductsState).selectAll,
  }),
});
