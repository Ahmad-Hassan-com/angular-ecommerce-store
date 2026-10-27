import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormGroupDirective,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory } from '../../core/models';
import { AdminActions } from '../../store/admin.actions';
import { adminFeature } from '../../store/admin.feature';
import { PeriodNav } from './period-nav';
import { demoExpenses, fromDateKey, toDateKey } from './reports';

@Component({
  selector: 'app-admin-expenses',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    PeriodNav,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './admin-expenses.html',
  styleUrl: './admin-expenses.scss',
})
export class AdminExpenses {
  private readonly store = inject(Store);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly today = new Date();

  protected readonly categories = EXPENSE_CATEGORIES;
  protected readonly month = signal({
    year: this.today.getFullYear(),
    month: this.today.getMonth(),
  });

  private readonly ownExpenses = this.store.selectSignal(adminFeature.selectExpenses);
  protected readonly includeDemoData = this.store.selectSignal(adminFeature.selectIncludeDemoData);

  protected readonly form = inject(NonNullableFormBuilder).group({
    date: [this.today as Date | null, Validators.required],
    category: ['' as ExpenseCategory | '', Validators.required],
    amount: [
      null as number | null,
      [Validators.required, Validators.min(0.01), Validators.max(1000000)],
    ],
    note: ['', Validators.maxLength(120)],
  });

  protected readonly monthLabel = computed(() => {
    const { year, month } = this.month();
    return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  protected readonly canGoNext = computed(() => {
    const { year, month } = this.month();
    return year * 12 + month < this.today.getFullYear() * 12 + this.today.getMonth();
  });

  /** This month's expenses, yours and (optionally) the demo ones, newest first. */
  protected readonly expenses = computed(() => {
    const { year, month } = this.month();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const own = this.ownExpenses().filter((e) => e.date.startsWith(prefix));
    const demo = this.includeDemoData()
      ? demoExpenses(
          { from: new Date(year, month, 1), to: new Date(year, month + 1, 0) },
          this.today,
        )
      : [];
    return [...own, ...demo].sort((a, b) => b.date.localeCompare(a.date));
  });

  protected readonly total = computed(() => this.expenses().reduce((sum, e) => sum + e.amount, 0));

  protected readonly byCategory = computed(() => {
    const sums = new Map<ExpenseCategory, number>();
    for (const e of this.expenses()) sums.set(e.category, (sums.get(e.category) ?? 0) + e.amount);
    const total = this.total();
    return [...sums.entries()]
      .map(([category, amount]) => ({ category, amount, share: total ? amount / total : 0 }))
      .sort((a, b) => b.amount - a.amount);
  });

  protected step(delta: number): void {
    this.month.update(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  protected dateOf(expense: Expense): Date {
    return fromDateKey(expense.date);
  }

  protected add(formDirective: FormGroupDirective): void {
    if (this.form.invalid || !this.form.value.date) {
      this.form.markAllAsTouched();
      return;
    }
    const { date, category, amount, note } = this.form.getRawValue();
    const expense: Expense = {
      id: `exp-${Date.now().toString(36)}`,
      date: toDateKey(date!),
      category: category as ExpenseCategory,
      amount: Math.round(amount! * 100) / 100,
      note: note.trim(),
    };
    this.store.dispatch(AdminActions.addExpense({ expense }));
    // Jump to the month the expense belongs to so it is visible straight away.
    this.month.set({ year: date!.getFullYear(), month: date!.getMonth() });
    formDirective.resetForm({ date, category: '', amount: null, note: '' });
    this.snackBar.open('Expense added', 'OK', { duration: 3000 });
  }

  protected remove(expense: Expense): void {
    this.store.dispatch(AdminActions.deleteExpense({ id: expense.id }));
    this.snackBar
      .open('Expense deleted', 'Undo', { duration: 5000 })
      .onAction()
      .subscribe(() => this.store.dispatch(AdminActions.addExpense({ expense })));
  }
}
