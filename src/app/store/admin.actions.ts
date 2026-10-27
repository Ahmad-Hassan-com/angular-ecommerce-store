import { createActionGroup, props } from '@ngrx/store';
import { AdminProduct, Expense } from '../core/models';

export const AdminActions = createActionGroup({
  source: 'Admin',
  events: {
    'Save Product': props<{ product: AdminProduct }>(),
    'Delete Product': props<{ id: number }>(),
    'Set Product Cost': props<{ productId: number; cost: number }>(),
    'Add Expense': props<{ expense: Expense }>(),
    'Delete Expense': props<{ id: string }>(),
    'Set Include Demo Data': props<{ include: boolean }>(),
  },
});
