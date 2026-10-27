import { Expense, Order } from '../../core/models';
import {
  dailyReport,
  demoExpenses,
  demoSales,
  monthlyReport,
  ReportSource,
  totals,
} from './reports';

const today = new Date(2026, 9, 27, 15, 0); // Tue 27 Oct 2026

const order = (placedAt: Date, subtotal: number, shipping: number, unitCost?: number): Order =>
  ({
    id: 'CW-1',
    placedAt: placedAt.toISOString(),
    items: [{ productId: 1, title: '', image: '', price: subtotal, quantity: 1, unitCost }],
    totals: { subtotal, shipping, tax: subtotal * 0.08, total: subtotal * 1.08 + shipping },
  }) as Order;

const expense = (date: string, amount: number): Expense => ({
  id: date,
  date,
  category: 'Rent',
  amount,
  note: '',
});

const source = (overrides: Partial<ReportSource>): ReportSource => ({
  orders: [],
  expenses: [],
  includeDemoData: false,
  today,
  ...overrides,
});

describe('dailyReport', () => {
  it('has one row per day up to today', () => {
    const rows = dailyReport(2026, 9, source({}));
    expect(rows.length).toBe(27);
    expect(rows[0].key).toBe('2026-10-01');
    expect(rows.at(-1)!.key).toBe('2026-10-27');
  });

  it('computes revenue (excluding tax), cost of goods, expenses and profit', () => {
    const rows = dailyReport(
      2026,
      9,
      source({
        orders: [order(new Date(2026, 9, 3, 10), 100, 4.99, 60)],
        expenses: [expense('2026-10-03', 20)],
      }),
    );
    expect(rows[2]).toMatchObject({
      key: '2026-10-03',
      orders: 1,
      revenue: 104.99,
      cogs: 60,
      expenses: 20,
      grossProfit: 44.99,
      netProfit: 24.99,
    });
  });

  it('falls back to the default cost ratio for orders placed before costs were recorded', () => {
    const rows = dailyReport(2026, 9, source({ orders: [order(new Date(2026, 9, 5), 50, 0)] }));
    expect(rows[4].cogs).toBe(30);
  });

  it('ignores activity outside the month', () => {
    const rows = dailyReport(
      2026,
      9,
      source({
        orders: [order(new Date(2026, 8, 30), 100, 0)],
        expenses: [expense('2026-11-01', 5)],
      }),
    );
    expect(totals(rows).orders).toBe(0);
    expect(totals(rows).expenses).toBe(0);
  });
});

describe('monthlyReport', () => {
  it('rolls days up into months, up to the current month', () => {
    const rows = monthlyReport(
      2026,
      source({
        orders: [
          order(new Date(2026, 1, 10), 200, 0, 100),
          order(new Date(2026, 1, 20), 100, 0, 50),
        ],
        expenses: [expense('2026-02-01', 120)],
      }),
    );
    expect(rows.length).toBe(10);
    expect(rows[1]).toMatchObject({
      key: '2026-02',
      orders: 2,
      revenue: 300,
      cogs: 150,
      netProfit: 30,
    });
  });

  it('matches the sum of the daily reports when demo data is on', () => {
    const src = source({ includeDemoData: true });
    const september = monthlyReport(2026, src)[8];
    const days = totals(dailyReport(2026, 8, src));
    expect(september.revenue).toBeCloseTo(days.revenue, 2);
    expect(september.expenses).toBeCloseTo(days.expenses, 2);
  });
});

describe('demo data', () => {
  it('is stable for a given day', () => {
    const day = new Date(2026, 4, 12);
    expect(demoSales(day)).toEqual(demoSales(new Date(2026, 4, 12)));
    expect(demoSales(day).cogs).toBeLessThan(demoSales(day).revenue);
  });

  it('never generates expenses after today', () => {
    const list = demoExpenses({ from: new Date(2026, 9, 1), to: new Date(2026, 9, 31) }, today);
    expect(list.every((e) => e.date <= '2026-10-27')).toBe(true);
    expect(list.some((e) => e.category === 'Rent')).toBe(true);
    expect(list.some((e) => e.category === 'Salaries')).toBe(false); // paid on the 28th
  });
});
