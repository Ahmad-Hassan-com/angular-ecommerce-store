import { CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Store } from '@ngrx/store';
import { ChartConfiguration } from 'chart.js';
import { ChartColors, ChartComponent } from '../../shared/chart';
import { AdminActions } from '../../store/admin.actions';
import { adminFeature } from '../../store/admin.feature';
import { ordersFeature } from '../../store/orders.feature';
import { PeriodNav } from './period-nav';
import {
  dailyReport,
  monthlyReport,
  PeriodStats,
  ReportSource,
  toDateKey,
  totals,
} from './reports';

type View = 'daily' | 'monthly';
type Totals = ReturnType<typeof totals>;

interface Kpi {
  label: string;
  value: number;
  previous: number;
  format: 'currency' | 'number';
  /** For costs, going up is bad news. */
  higherIsBetter: boolean;
  note?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    PercentPipe,
    MatButtonToggleModule,
    MatIconModule,
    MatSlideToggleModule,
    ChartComponent,
    PeriodNav,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboard {
  private readonly store = inject(Store);
  private readonly today = new Date();

  protected readonly view = signal<View>('daily');
  protected readonly month = signal({
    year: this.today.getFullYear(),
    month: this.today.getMonth(),
  });
  protected readonly year = signal(this.today.getFullYear());

  protected readonly includeDemoData = this.store.selectSignal(adminFeature.selectIncludeDemoData);
  private readonly orders = this.store.selectSignal(ordersFeature.selectOrders);
  private readonly expenses = this.store.selectSignal(adminFeature.selectExpenses);

  private readonly source = computed<ReportSource>(() => ({
    orders: this.orders(),
    expenses: this.expenses(),
    includeDemoData: this.includeDemoData(),
  }));

  protected readonly rows = computed(() => this.reportFor(0));
  private readonly previousRows = computed(() => this.reportFor(-1));
  protected readonly newestFirst = computed(() => [...this.rows()].reverse());
  protected readonly total = computed(() => totals(this.rows()));

  /** Compare like with like: a part-finished month or year against the same stretch of the one before. */
  private readonly previousTotal = computed(() =>
    totals(this.previousRows().slice(0, this.rows().length)),
  );

  protected readonly todayStats = computed(() => {
    const now = this.today;
    const rows = dailyReport(now.getFullYear(), now.getMonth(), this.source());
    return rows.find((r) => r.key === toDateKey(now));
  });

  protected readonly periodLabel = computed(() => {
    if (this.view() === 'monthly') return String(this.year());
    const { year, month } = this.month();
    return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  protected readonly previousLabel = computed(() => {
    if (this.view() === 'monthly') return `same months of ${this.year() - 1}`;
    const { year, month } = this.month();
    const prev = new Date(year, month - 1, 1);
    return `same days of ${prev.toLocaleDateString('en-US', { month: 'short' })}`;
  });

  protected readonly canGoNext = computed(() => {
    const now = this.today;
    if (this.view() === 'monthly') return this.year() < now.getFullYear();
    const { year, month } = this.month();
    return year * 12 + month < now.getFullYear() * 12 + now.getMonth();
  });

  protected readonly kpis = computed<Kpi[]>(() => {
    const t = this.total();
    const p = this.previousTotal();
    const margin = t.revenue ? t.netProfit / t.revenue : 0;
    return [
      kpi('Revenue', t, p, 'revenue', true, 'Excludes sales tax'),
      kpi('Cost of goods', t, p, 'cogs', false, 'What the sold items cost the store'),
      kpi('Expenses', t, p, 'expenses', false, 'Rent, salaries, marketing and more'),
      kpi('Gross profit', t, p, 'grossProfit', true, 'Revenue minus cost of goods'),
      {
        ...kpi('Net profit', t, p, 'netProfit', true),
        note: `${(margin * 100).toFixed(1)}% net margin`,
      },
      { ...kpi('Orders', t, p, 'orders', true), format: 'number' },
    ];
  });

  protected readonly chartLabel = computed(
    () =>
      `Revenue, total costs and net profit by ${this.view() === 'daily' ? 'day' : 'month'} for ${this.periodLabel()}. The same figures are in the table below.`,
  );

  protected readonly buildChart = computed(() => {
    const rows = this.rows();
    const daily = this.view() === 'daily';
    return (colors: ChartColors): ChartConfiguration => salesChart(rows, daily, colors);
  });

  protected setView(view: View): void {
    this.view.set(view);
  }

  protected step(delta: number): void {
    if (this.view() === 'monthly') {
      this.year.update((y) => y + delta);
    } else {
      this.month.update(({ year, month }) => {
        const d = new Date(year, month + delta, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
      });
    }
  }

  protected setDemoData(include: boolean): void {
    this.store.dispatch(AdminActions.setIncludeDemoData({ include }));
  }

  protected change(k: Kpi): number | null {
    if (!k.previous) return null;
    return (k.value - k.previous) / Math.abs(k.previous);
  }

  protected isGood(k: Kpi): boolean {
    const c = this.change(k) ?? 0;
    return k.higherIsBetter ? c >= 0 : c <= 0;
  }

  private reportFor(offset: number): PeriodStats[] {
    const source = this.source();
    if (this.view() === 'monthly') return monthlyReport(this.year() + offset, source);
    const { year, month } = this.month();
    const d = new Date(year, month + offset, 1);
    return dailyReport(d.getFullYear(), d.getMonth(), source);
  }
}

function kpi(
  label: string,
  current: Totals,
  previous: Totals,
  field: keyof Totals,
  higherIsBetter: boolean,
  note?: string,
): Kpi {
  return {
    label,
    value: current[field],
    previous: previous[field],
    format: 'currency',
    higherIsBetter,
    note,
  };
}

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const fullCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function salesChart(rows: PeriodStats[], daily: boolean, colors: ChartColors): ChartConfiguration {
  const [revenueColor, costColor, profitColor] = colors.series;
  const bar = { borderRadius: 4, borderSkipped: 'start' as const, maxBarThickness: 18 };
  return {
    type: 'bar',
    data: {
      labels: rows.map((r) => (daily ? String(r.start.getDate()) : MONTHS[r.start.getMonth()])),
      datasets: [
        {
          type: 'bar',
          label: 'Revenue',
          data: rows.map((r) => r.revenue),
          backgroundColor: revenueColor,
          ...bar,
          order: 2,
        },
        {
          type: 'bar',
          label: 'Total costs (goods + expenses)',
          data: rows.map((r) => r.cogs + r.expenses),
          backgroundColor: costColor,
          ...bar,
          order: 2,
        },
        {
          type: 'line',
          label: 'Net profit',
          data: rows.map((r) => r.netProfit),
          borderColor: profitColor,
          backgroundColor: profitColor,
          borderWidth: 2,
          pointRadius: daily ? 0 : 4,
          pointHoverRadius: 6,
          pointBorderColor: 'transparent',
          // Monotone keeps the curve from overshooting the real values between points.
          cubicInterpolationMode: 'monotone',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      datasets: { bar: { categoryPercentage: 0.75, barPercentage: 0.9 } },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            color: colors.text,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            // Datasets use `order` to draw the line on top; keep the legend in series order.
            sort: (a, b) => (a.datasetIndex ?? 0) - (b.datasetIndex ?? 0),
          },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const row = rows[items[0].dataIndex];
              return row.start.toLocaleDateString(
                'en-US',
                daily
                  ? { weekday: 'short', day: 'numeric', month: 'short' }
                  : { month: 'long', year: 'numeric' },
              );
            },
            label: (item) => ` ${item.dataset.label}: ${fullCurrency.format(item.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: colors.grid },
          ticks: { color: colors.text, autoSkip: true, maxRotation: 0 },
        },
        y: {
          grid: { color: colors.grid },
          border: { display: false },
          ticks: { color: colors.text, callback: (v) => compactCurrency.format(Number(v)) },
        },
      },
    },
  };
}
