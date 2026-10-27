import { CurrencyPipe, PercentPipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AdminProduct } from '../../core/models';
import { AdminActions } from '../../store/admin.actions';
import { adminFeature } from '../../store/admin.feature';
import { selectCatalog, selectUnitCosts } from '../../store/catalog.selectors';
import { ProductsActions } from '../../store/products.actions';
import { productsFeature } from '../../store/products.feature';

@Component({
  selector: 'app-admin-products',
  imports: [
    RouterLink,
    CurrencyPipe,
    PercentPipe,
    TitleCasePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
  ],
  template: `
    <div class="toolbar">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
        <mat-icon matPrefix>search</mat-icon>
        <mat-label>Search products</mat-label>
        <input
          matInput
          type="search"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </mat-form-field>
      <a mat-flat-button routerLink="/admin/products/new">
        <mat-icon>add</mat-icon>
        Add product
      </a>
    </div>

    <p class="muted summary">
      {{ ownCount() }} added by you · {{ apiCount() }} from the Fake Store API. API products can't
      be changed, but you can set what each one costs you.
    </p>

    @if (status() === 'error') {
      <p class="muted">
        The API products couldn't be loaded, so only your own products are listed.
      </p>
    }

    <div class="panel table-panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Category</th>
              <th scope="col" class="num">Price</th>
              <th scope="col" class="num">Unit cost</th>
              <th scope="col" class="num">Margin</th>
              <th scope="col">Source</th>
              <th scope="col"><span class="cdk-visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (p of rows(); track p.id) {
              <tr>
                <td>
                  <div class="product">
                    <span class="thumb"><img [src]="p.image" alt="" /></span>
                    <a [routerLink]="['/products', p.id]">{{ p.title }}</a>
                  </div>
                </td>
                <td>{{ p.category | titlecase }}</td>
                <td class="num">{{ p.price | currency }}</td>
                <td class="num">{{ p.cost | currency }}</td>
                <td class="num">{{ p.margin | percent: '1.0-0' }}</td>
                <td>
                  <span class="chip" [class.own]="p.own">{{ p.own ? 'Yours' : 'API' }}</span>
                </td>
                <td class="actions">
                  <a
                    mat-icon-button
                    [routerLink]="['/admin/products', p.id]"
                    [matTooltip]="p.own ? 'Edit' : 'Set cost'"
                    [attr.aria-label]="(p.own ? 'Edit ' : 'Set cost of ') + p.title"
                  >
                    <mat-icon>{{ p.own ? 'edit' : 'price_change' }}</mat-icon>
                  </a>
                  @if (p.own) {
                    <button
                      mat-icon-button
                      type="button"
                      matTooltip="Delete"
                      [attr.aria-label]="'Delete ' + p.title"
                      (click)="remove(p.id)"
                    >
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty muted">
                  {{
                    status() === 'loading' ? 'Loading products…' : 'No products match your search.'
                  }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .search {
      flex: 1 1 260px;
    }
    .summary {
      margin: 12px 0 16px;
      font: var(--mat-sys-body-small);
    }
    .table-panel {
      padding: 0;
      overflow: hidden;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      white-space: nowrap;
    }
    thead th {
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface-variant);
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .product {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 240px;
      max-width: 420px;
      white-space: normal;

      a {
        color: var(--mat-sys-on-surface);
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    }
    .thumb {
      flex: none;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 4px;
      box-sizing: border-box;
      border-radius: 6px;
      background: #fff;

      img {
        max-width: 100%;
        max-height: 100%;
      }
    }
    .chip.own {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .actions {
      text-align: right;
    }
    .empty {
      text-align: center;
      padding: 32px;
    }
  `,
})
export class AdminProducts {
  private readonly store = inject(Store);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly query = signal('');
  protected readonly status = this.store.selectSignal(productsFeature.selectStatus);
  private readonly catalog = this.store.selectSignal(selectCatalog);
  private readonly costs = this.store.selectSignal(selectUnitCosts);
  private readonly own = this.store.selectSignal(adminFeature.selectProducts);

  protected readonly ownCount = computed(() => this.own().length);
  protected readonly apiCount = computed(() => this.catalog().length - this.own().length);

  /** Your own products first, newest first, then the API catalogue. */
  protected readonly rows = computed(() => {
    const ownIds = new Set(this.own().map((p) => p.id));
    const terms = this.query().toLowerCase().trim();
    return this.catalog()
      .filter((p) => !terms || `${p.title} ${p.category}`.toLowerCase().includes(terms))
      .map((p) => {
        const cost = this.costs()[p.id] ?? 0;
        return {
          ...p,
          cost,
          own: ownIds.has(p.id),
          margin: p.price ? (p.price - cost) / p.price : 0,
        };
      })
      .sort((a, b) => Number(b.own) - Number(a.own) || (a.own ? b.id - a.id : a.id - b.id));
  });

  constructor() {
    this.store.dispatch(ProductsActions.loadProducts());
  }

  protected remove(id: number): void {
    const product = this.own().find((p) => p.id === id) as AdminProduct;
    this.store.dispatch(AdminActions.deleteProduct({ id }));
    this.snackBar
      .open(`Deleted ${product.title.slice(0, 40)}`, 'Undo', { duration: 5000 })
      .onAction()
      .subscribe(() => this.store.dispatch(AdminActions.saveProduct({ product })));
  }
}
