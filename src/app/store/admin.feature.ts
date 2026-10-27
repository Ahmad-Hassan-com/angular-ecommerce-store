import { createFeature, createReducer, on } from '@ngrx/store';
import { AdminProduct, Expense } from '../core/models';
import { AdminActions } from './admin.actions';

export interface AdminState {
  /** Products created in the admin area, shown in the shop next to the API catalogue. */
  products: AdminProduct[];
  /** Unit costs set for API products; anything missing falls back to a default margin. */
  costs: Record<number, number>;
  /** Expenses entered by the admin, newest date first. */
  expenses: Expense[];
  includeDemoData: boolean;
}

export const initialAdminState: AdminState = {
  products: [],
  costs: {},
  expenses: [],
  includeDemoData: true,
};

export const adminFeature = createFeature({
  name: 'admin',
  reducer: createReducer(
    initialAdminState,
    on(AdminActions.saveProduct, (state, { product }): AdminState => {
      const exists = state.products.some((p) => p.id === product.id);
      return {
        ...state,
        products: exists
          ? state.products.map((p) => (p.id === product.id ? product : p))
          : [...state.products, product],
      };
    }),
    on(AdminActions.deleteProduct, (state, { id }): AdminState => ({
      ...state,
      products: state.products.filter((p) => p.id !== id),
    })),
    on(AdminActions.setProductCost, (state, { productId, cost }): AdminState => ({
      ...state,
      costs: { ...state.costs, [productId]: cost },
    })),
    on(AdminActions.addExpense, (state, { expense }): AdminState => ({
      ...state,
      expenses: [expense, ...state.expenses].sort((a, b) => b.date.localeCompare(a.date)),
    })),
    on(AdminActions.deleteExpense, (state, { id }): AdminState => ({
      ...state,
      expenses: state.expenses.filter((e) => e.id !== id),
    })),
    on(AdminActions.setIncludeDemoData, (state, { include }): AdminState => ({
      ...state,
      includeDemoData: include,
    })),
  ),
});
