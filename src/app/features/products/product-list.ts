import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime, filter, map } from 'rxjs';
import { Product } from '../../core/models';
import { CartActions } from '../../store/cart.actions';
import { ProductsActions } from '../../store/products.actions';
import { selectCatalog, selectCategories, selectPriceCeiling } from '../../store/catalog.selectors';
import { productsFeature } from '../../store/products.feature';
import { ProductCard } from './product-card';
import {
  DEFAULT_PAGE_SIZE,
  filterProducts,
  hasActiveFilters,
  PAGE_SIZES,
  parseFilters,
  SORT_OPTIONS,
  SortOption,
} from './product-filters';

const RATING_OPTIONS = [
  { value: null, label: 'Any rating' },
  { value: 4, label: '4 stars & up' },
  { value: 3, label: '3 stars & up' },
  { value: 2, label: '2 stars & up' },
];

@Component({
  selector: 'app-product-list',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    TitleCasePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    ProductCard,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  // Filter state lives in the URL, so results are shareable and survive refresh and Back.
  readonly q = input<string>();
  readonly category = input<string>();
  readonly min = input<string>();
  readonly max = input<string>();
  readonly rating = input<string>();
  readonly sort = input<string>();
  readonly page = input<string>();
  readonly size = input<string>();

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly ratingOptions = RATING_OPTIONS;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly skeletons = Array.from({ length: DEFAULT_PAGE_SIZE });

  protected readonly status = this.store.selectSignal(productsFeature.selectStatus);
  protected readonly error = this.store.selectSignal(productsFeature.selectError);
  private readonly products = this.store.selectSignal(selectCatalog);
  protected readonly categories = this.store.selectSignal(selectCategories);
  protected readonly priceCeiling = this.store.selectSignal(selectPriceCeiling);

  protected readonly filters = computed(() =>
    parseFilters({
      q: this.q(),
      category: this.category(),
      min: this.min(),
      max: this.max(),
      rating: this.rating(),
      sort: this.sort(),
    }),
  );
  protected readonly filtered = computed(() => filterProducts(this.products(), this.filters()));
  protected readonly isFiltered = computed(() => hasActiveFilters(this.filters()));

  protected readonly pageSize = computed(() => {
    const size = Number(this.size());
    return PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE;
  });
  protected readonly pageIndex = computed(() => {
    const lastPage = Math.max(0, Math.ceil(this.filtered().length / this.pageSize()) - 1);
    const requested = Math.floor(Number(this.page()) || 1) - 1;
    return Math.min(Math.max(requested, 0), lastPage);
  });
  protected readonly visible = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });
  protected readonly rangeLabel = computed(() => {
    const total = this.filtered().length;
    if (!total) return 'No products';
    const start = this.pageIndex() * this.pageSize() + 1;
    const end = Math.min(start + this.pageSize() - 1, total);
    return `Showing ${start}–${end} of ${total} ${total === 1 ? 'product' : 'products'}`;
  });

  protected readonly filtersOpen = signal(false);
  protected readonly search = new FormControl('', { nonNullable: true });

  constructor() {
    this.store.dispatch(ProductsActions.loadProducts());

    // Keep the search box in step with the URL (e.g. after "Clear filters" or Back).
    effect(() => {
      const query = this.filters().query;
      if (untracked(() => this.search.value.trim()) !== query) {
        this.search.setValue(query, { emitEvent: false });
      }
    });

    this.search.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        filter((query) => query !== this.filters().query),
        takeUntilDestroyed(),
      )
      .subscribe((query) => this.updateParams({ q: query || null }, true));
  }

  protected setCategory(category: string | null): void {
    this.updateParams({ category });
  }

  protected setRating(rating: number | null): void {
    this.updateParams({ rating });
  }

  protected setMinPrice(value: number): void {
    this.updateParams({ min: value > 0 ? value : null });
  }

  protected setMaxPrice(value: number): void {
    this.updateParams({ max: value < this.priceCeiling() ? value : null });
  }

  protected setSort(sort: SortOption): void {
    this.updateParams({ sort: sort === 'featured' ? null : sort });
  }

  protected onPage(event: PageEvent): void {
    this.router.navigate([], {
      queryParams: {
        page: event.pageIndex > 0 ? event.pageIndex + 1 : null,
        size: event.pageSize === DEFAULT_PAGE_SIZE ? null : event.pageSize,
      },
      queryParamsHandling: 'merge',
    });
  }

  protected clearFilters(): void {
    this.updateParams({ q: null, category: null, min: null, max: null, rating: null });
  }

  protected retry(): void {
    this.store.dispatch(ProductsActions.loadProducts());
  }

  protected addToCart(product: Product): void {
    this.store.dispatch(CartActions.addItem({ product, quantity: 1 }));
  }

  /** Any filter change goes back to the first page. Typing replaces history instead of adding to it. */
  private updateParams(params: Params, replaceUrl = false): void {
    this.router.navigate([], {
      queryParams: { ...params, page: null },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
