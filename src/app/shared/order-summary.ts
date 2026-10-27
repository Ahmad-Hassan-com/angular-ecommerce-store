import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { OrderTotals } from '../core/models';

@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe],
  template: `
    <dl>
      <div>
        <dt>Subtotal</dt>
        <dd>{{ totals().subtotal | currency }}</dd>
      </div>
      <div>
        <dt>{{ shippingLabel() }}</dt>
        <dd>{{ totals().shipping === 0 ? 'Free' : (totals().shipping | currency) }}</dd>
      </div>
      <div>
        <dt>Estimated tax (8%)</dt>
        <dd>{{ totals().tax | currency }}</dd>
      </div>
      <div class="total">
        <dt>Total</dt>
        <dd>{{ totals().total | currency }}</dd>
      </div>
    </dl>
  `,
  styles: `
    dl {
      margin: 0;
      display: grid;
      gap: 10px;
    }
    div {
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    dt {
      color: var(--mat-sys-on-surface-variant);
    }
    dd {
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
    .total {
      border-top: 1px solid var(--mat-sys-outline-variant);
      padding-top: 12px;
      font: var(--mat-sys-title-medium);
    }
    .total dt {
      color: var(--mat-sys-on-surface);
    }
  `,
})
export class OrderSummary {
  readonly totals = input.required<OrderTotals>();
  readonly shippingLabel = input('Shipping');
}
