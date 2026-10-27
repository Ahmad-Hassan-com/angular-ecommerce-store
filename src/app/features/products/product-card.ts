import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models';
import { Rating } from '../../shared/rating';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, CurrencyPipe, TitleCasePipe, MatButtonModule, MatIconModule, Rating],
  template: `
    @let p = product();
    <article>
      <a class="image" [routerLink]="['/products', p.id]" tabindex="-1" aria-hidden="true">
        <img [src]="p.image" alt="" loading="lazy" />
      </a>
      <div class="body">
        <span class="category">{{ p.category | titlecase }}</span>
        <h3>
          <a [routerLink]="['/products', p.id]">{{ p.title }}</a>
        </h3>
        <app-rating [rate]="p.rating.rate" [count]="p.rating.count" />
        <div class="footer">
          <span class="price">{{ p.price | currency }}</span>
          <button
            mat-flat-button
            type="button"
            (click)="addToCart.emit(p)"
            [attr.aria-label]="'Add ' + p.title + ' to cart'"
          >
            <mat-icon>add_shopping_cart</mat-icon>
            Add
          </button>
        </div>
      </div>
    </article>
  `,
  styles: `
    article {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      overflow: hidden;
      transition:
        box-shadow 150ms ease,
        transform 150ms ease;

      &:hover {
        box-shadow: var(--mat-sys-level2);
        transform: translateY(-2px);
      }
    }
    .image {
      position: relative;
      display: block;
      aspect-ratio: 1;
      background: #fff;

      img {
        position: absolute;
        inset: 24px;
        width: calc(100% - 48px);
        height: calc(100% - 48px);
        object-fit: contain;
      }
    }
    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .category {
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-on-surface-variant);
    }
    h3 {
      margin: 0;
      font: var(--mat-sys-title-small);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;

      a {
        color: inherit;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
    .footer {
      margin-top: auto;
      padding-top: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .price {
      font: var(--mat-sys-title-large);
      font-weight: 600;
    }
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly addToCart = output<Product>();
}
