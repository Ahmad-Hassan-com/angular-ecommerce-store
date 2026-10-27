import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Product } from '../../core/models';
import { FREE_SHIPPING_THRESHOLD } from '../../core/pricing';
import { QuantityStepper } from '../../shared/quantity-stepper';
import { Rating } from '../../shared/rating';
import { CartActions } from '../../store/cart.actions';
import { cartFeature, MAX_QUANTITY } from '../../store/cart.feature';
import { ProductsActions } from '../../store/products.actions';
import { productsFeature } from '../../store/products.feature';
import { ProductCard } from './product-card';

@Component({
  selector: 'app-product-detail',
  imports: [
    RouterLink,
    CurrencyPipe,
    TitleCasePipe,
    MatButtonModule,
    MatIconModule,
    Rating,
    QuantityStepper,
    ProductCard,
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private readonly store = inject(Store);

  readonly id = input.required<string>();

  protected readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  protected readonly status = this.store.selectSignal(productsFeature.selectStatus);
  protected readonly error = this.store.selectSignal(productsFeature.selectError);
  private readonly entities = this.store.selectSignal(productsFeature.selectEntities);
  private readonly all = this.store.selectSignal(productsFeature.selectAllProducts);
  private readonly cart = this.store.selectSignal(cartFeature.selectEntities);

  protected readonly product = computed(() => this.entities()[Number(this.id())]);
  protected readonly related = computed(() => {
    const product = this.product();
    if (!product) return [];
    return this.all()
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  });
  protected readonly inCart = computed(() => this.cart()[Number(this.id())]?.quantity ?? 0);
  protected readonly maxAddable = computed(() => MAX_QUANTITY - this.inCart());

  /** Resets to 1 whenever the user navigates to another product. */
  protected readonly quantity = linkedSignal({
    source: () => this.id(),
    computation: () => 1,
  });

  constructor() {
    this.store.dispatch(ProductsActions.loadProducts());

    const title = inject(Title);
    effect(() => {
      const product = this.product();
      if (product) title.setTitle(`${product.title} | Cartwheel`);
    });
  }

  protected add(product: Product): void {
    const quantity = Math.min(this.quantity(), this.maxAddable());
    if (quantity > 0) this.store.dispatch(CartActions.addItem({ product, quantity }));
    this.quantity.set(1);
  }

  protected addRelated(product: Product): void {
    this.store.dispatch(CartActions.addItem({ product, quantity: 1 }));
  }

  protected retry(): void {
    this.store.dispatch(ProductsActions.loadProducts());
  }
}
