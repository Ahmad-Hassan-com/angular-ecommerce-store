import { Expense, ExpenseCategory, Order } from '../../core/models';
import { defaultCost } from '../../store/catalog.selectors';

/** One row of a report: a single day or a single month. */
export interface PeriodStats {
  key: string;
  start: Date;
  orders: number;
  /** Sales excluding tax (tax is collected for the government, not earned). */
  revenue: number;
  /** Cost of goods sold. */
  cogs: number;
  /** Operating expenses: rent, salaries, marketing and so on. */
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface ReportSource {
  orders: readonly Order[];
  expenses: readonly Expense[];
  includeDemoData: boolean;
  /** Injected so tests can pin "today". */
  today?: Date;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Local calendar date as YYYY-MM-DD (not UTC, so late-evening orders land on the right day). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function emptyRow(start: Date, key: string): PeriodStats {
  return { key, start, orders: 0, revenue: 0, cogs: 0, expenses: 0, grossProfit: 0, netProfit: 0 };
}

function finish(row: PeriodStats): PeriodStats {
  const revenue = round2(row.revenue);
  const cogs = round2(row.cogs);
  const expenses = round2(row.expenses);
  return {
    ...row,
    revenue,
    cogs,
    expenses,
    grossProfit: round2(revenue - cogs),
    netProfit: round2(revenue - cogs - expenses),
  };
}

/** Daily rows for every day of `month` (0-11) up to today. */
export function dailyReport(year: number, month: number, source: ReportSource): PeriodStats[] {
  const today = startOfDay(source.today ?? new Date());
  const rows = new Map<string, PeriodStats>();
  for (
    let d = new Date(year, month, 1);
    d.getMonth() === month && d <= today;
    d.setDate(d.getDate() + 1)
  ) {
    const day = new Date(d);
    rows.set(toDateKey(day), emptyRow(day, toDateKey(day)));
  }
  fill(rows, (key) => key, source, today);
  return [...rows.values()].map(finish);
}

/** Monthly rows for every month of `year` up to the current month. */
export function monthlyReport(year: number, source: ReportSource): PeriodStats[] {
  const today = startOfDay(source.today ?? new Date());
  const rows = new Map<string, PeriodStats>();
  for (let m = 0; m < 12 && new Date(year, m, 1) <= today; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`;
    rows.set(key, emptyRow(new Date(year, m, 1), key));
  }
  fill(rows, (key) => key.slice(0, 7), source, today);
  return [...rows.values()].map(finish);
}

export function totals(rows: readonly PeriodStats[]): Omit<PeriodStats, 'key' | 'start'> {
  const sum = rows.reduce(
    (acc, r) => ({
      ...acc,
      orders: acc.orders + r.orders,
      revenue: acc.revenue + r.revenue,
      cogs: acc.cogs + r.cogs,
      expenses: acc.expenses + r.expenses,
    }),
    emptyRow(new Date(0), ''),
  );
  const { key, start, ...rest } = finish(sum);
  return rest;
}

/** Adds every order, expense and (optionally) demo day that falls into one of the rows. */
function fill(
  rows: Map<string, PeriodStats>,
  bucketOf: (dateKey: string) => string,
  source: ReportSource,
  today: Date,
): void {
  const add = (dateKey: string, change: Partial<PeriodStats>) => {
    const row = rows.get(bucketOf(dateKey));
    if (!row) return;
    row.orders += change.orders ?? 0;
    row.revenue += change.revenue ?? 0;
    row.cogs += change.cogs ?? 0;
    row.expenses += change.expenses ?? 0;
  };

  for (const order of source.orders) {
    add(toDateKey(new Date(order.placedAt)), {
      orders: 1,
      revenue: order.totals.subtotal + order.totals.shipping,
      cogs: order.items.reduce(
        (sum, i) => sum + (i.unitCost ?? defaultCost(i.price)) * i.quantity,
        0,
      ),
    });
  }

  const expenses = source.includeDemoData
    ? [...source.expenses, ...demoExpenses(rowRange(rows), today)]
    : source.expenses;
  for (const expense of expenses) add(expense.date, { expenses: expense.amount });

  if (source.includeDemoData) {
    const { from, to } = rowRange(rows);
    for (let d = new Date(from); d <= to && d <= today; d.setDate(d.getDate() + 1)) {
      add(toDateKey(d), demoSales(d));
    }
  }
}

/** First and last calendar day covered by the rows. */
function rowRange(rows: Map<string, PeriodStats>): { from: Date; to: Date } {
  const starts = [...rows.values()].map((r) => r.start);
  const from = starts[0] ?? new Date();
  const last = starts[starts.length - 1] ?? new Date();
  const monthly = [...rows.keys()][0]?.length === 7;
  const to = monthly ? new Date(last.getFullYear(), last.getMonth() + 1, 0) : last;
  return { from, to };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// ---------------------------------------------------------------------------
// Demo data. Generated from the date itself, so it is stable across reloads
// without being stored, and a new store still has a year of history to explore.
// ---------------------------------------------------------------------------

/** Small seeded PRNG (mulberry32): the same seed always gives the same sequence. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const daySeed = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/** A plausible day of sales: busier at weekends and in Nov/Dec, growing slowly over time. */
export function demoSales(date: Date): { orders: number; revenue: number; cogs: number } {
  const rand = random(daySeed(date));
  const weekend = date.getDay() === 0 || date.getDay() === 6 ? 1.35 : 1;
  const season = [0.85, 0.8, 0.9, 0.95, 1, 0.95, 0.9, 0.95, 1, 1.05, 1.35, 1.5][date.getMonth()];
  const growth = 1 + (date.getFullYear() - 2025) * 0.15 + date.getMonth() * 0.012;
  const orders = Math.max(0, Math.round((5 + rand() * 8) * weekend * season * growth));
  const averageOrder = 70 + rand() * 70;
  const revenue = round2(orders * averageOrder);
  return { orders, revenue, cogs: round2(revenue * (0.5 + rand() * 0.12)) };
}

/** Recurring monthly costs plus weekly marketing spend, for each month touching the range. */
export function demoExpenses(range: { from: Date; to: Date }, today: Date): Expense[] {
  const result: Expense[] = [];
  const entry = (date: Date, category: ExpenseCategory, amount: number, note: string) => {
    if (date < range.from || date > range.to || date > today) return;
    const key = toDateKey(date);
    result.push({
      id: `demo-${key}-${category}`,
      date: key,
      category,
      amount: round2(amount),
      note,
      demo: true,
    });
  };

  for (
    let m = new Date(range.from.getFullYear(), range.from.getMonth(), 1);
    m <= range.to;
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  ) {
    const rand = random(m.getFullYear() * 100 + m.getMonth());
    const day = (d: number) => new Date(m.getFullYear(), m.getMonth(), d);
    entry(day(1), 'Rent', 1800, 'Warehouse rent');
    entry(day(5), 'Software', 149, 'Hosting and tools');
    entry(day(12), 'Utilities', 180 + rand() * 90, 'Electricity and internet');
    entry(day(15), 'Shipping', 220 + rand() * 200, 'Packaging supplies');
    entry(day(28), 'Salaries', 4200, 'Staff wages');
    for (let d = day(1); d.getMonth() === m.getMonth(); d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 1) entry(new Date(d), 'Marketing', 250 + rand() * 350, 'Social media ads');
    }
  }
  return result;
}
