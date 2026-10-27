import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CartItem } from '../../core/models';
import { calculateTotals, FREE_SHIPPING_THRESHOLD } from '../../core/pricing';
import { OrderSummary } from '../../shared/order-summary';
import { QuantityStepper } from '../../shared/quantity-stepper';
import { CartActions } from '../../store/cart.actions';
import { cartFeature, MAX_QUANTITY } from '../../store/cart.feature';

@Component({
  selector: 'app-cart',
  imports: [
    RouterLink,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    OrderSummary,
    QuantityStepper,
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  private readonly store = inject(Store);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly maxQuantity = MAX_QUANTITY;
  protected readonly items = this.store.selectSignal(cartFeature.selectItems);
  protected readonly count = this.store.selectSignal(cartFeature.selectItemCount);
  protected readonly totals = computed(() => calculateTotals(this.items(), 'standard'));

  protected readonly toFreeShipping = computed(() =>
    Math.max(0, FREE_SHIPPING_THRESHOLD - this.totals().subtotal),
  );
  protected readonly freeShippingProgress = computed(() =>
    Math.min(100, (this.totals().subtotal / FREE_SHIPPING_THRESHOLD) * 100),
  );

  protected setQuantity(item: CartItem, quantity: number): void {
    this.store.dispatch(CartActions.updateQuantity({ productId: item.productId, quantity }));
  }

  protected remove(item: CartItem): void {
    this.store.dispatch(CartActions.removeItem({ productId: item.productId }));
    this.snackBar
      .open(`Removed ${item.title.slice(0, 40)} from your cart`, 'Undo', { duration: 5000 })
      .onAction()
      .subscribe(() => this.store.dispatch(CartActions.restoreItem({ item })));
  }
}
