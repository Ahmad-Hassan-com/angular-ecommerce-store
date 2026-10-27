import { CurrencyPipe, DatePipe } from '@angular/common';
import { booleanAttribute, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { addBusinessDays, DELIVERY_OPTIONS } from '../../core/pricing';
import { OrderSummary } from '../../shared/order-summary';
import { ordersFeature } from '../../store/orders.feature';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, OrderSummary],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetail {
  readonly id = input.required<string>();
  /** Set by checkout when it redirects here, to show the confirmation banner. */
  readonly placed = input(false, { transform: booleanAttribute });

  private readonly orders = inject(Store).selectSignal(ordersFeature.selectOrders);
  protected readonly order = computed(() => this.orders().find((o) => o.id === this.id()));

  protected readonly delivery = computed(() => {
    const order = this.order();
    if (!order) return null;
    const option = DELIVERY_OPTIONS[order.delivery];
    const placedAt = new Date(order.placedAt);
    return {
      label: option.label,
      from: addBusinessDays(placedAt, option.minDays),
      to: addBusinessDays(placedAt, option.maxDays),
    };
  });
}
