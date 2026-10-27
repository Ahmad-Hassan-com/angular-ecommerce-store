import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Order } from '../../core/models';
import { ordersFeature } from '../../store/orders.feature';

@Component({
  selector: 'app-order-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Order history</h1>
          @if (orders().length) {
            <p>
              {{ orders().length }} {{ orders().length === 1 ? 'order' : 'orders' }}, newest first
            </p>
          }
        </div>
      </header>

      @if (orders().length) {
        <ul class="orders">
          @for (order of orders(); track order.id) {
            <li class="panel">
              <div class="meta">
                <div>
                  <span class="label">Order</span>
                  <a [routerLink]="['/orders', order.id]" class="id">{{ order.id }}</a>
                </div>
                <div>
                  <span class="label">Placed</span>
                  <span>{{ order.placedAt | date: 'mediumDate' }}</span>
                </div>
                <div>
                  <span class="label">Items</span>
                  <span>{{ itemCount(order) }}</span>
                </div>
                <div>
                  <span class="label">Total</span>
                  <span class="total">{{ order.totals.total | currency }}</span>
                </div>
              </div>
              <div class="bottom">
                <ul class="thumbs" aria-label="Products in this order">
                  @for (item of order.items.slice(0, 5); track item.productId) {
                    <li [title]="item.title"><img [src]="item.image" [alt]="item.title" /></li>
                  }
                  @if (order.items.length > 5) {
                    <li class="more">+{{ order.items.length - 5 }}</li>
                  }
                </ul>
                <a mat-stroked-button [routerLink]="['/orders', order.id]">View details</a>
              </div>
            </li>
          }
        </ul>
      } @else {
        <div class="panel state">
          <mat-icon>receipt_long</mat-icon>
          <h2>No orders yet</h2>
          <p class="muted">Orders you place will appear here.</p>
          <a mat-flat-button routerLink="/products">Start shopping</a>
        </div>
      }
    </div>
  `,
  styles: `
    .orders {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 16px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;

      div {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
    }
    .label {
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-on-surface-variant);
    }
    .id {
      font: var(--mat-sys-title-small);
    }
    .total {
      font: var(--mat-sys-title-small);
    }
    .bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .thumbs {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 8px;

      li {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        padding: 4px;
        box-sizing: border-box;
        border-radius: 8px;
        background: #fff;
        border: 1px solid var(--mat-sys-outline-variant);
      }
      img {
        max-width: 100%;
        max-height: 100%;
      }
      .more {
        background: var(--mat-sys-surface-container-high);
        font: var(--mat-sys-label-large);
      }
    }
    @media (max-width: 599px) {
      .meta {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class OrderList {
  protected readonly orders = inject(Store).selectSignal(ordersFeature.selectOrders);

  protected itemCount(order: Order): number {
    return order.items.reduce((count, item) => count + item.quantity, 0);
  }
}
