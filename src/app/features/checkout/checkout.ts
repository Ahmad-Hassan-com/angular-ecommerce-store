import { BreakpointObserver } from '@angular/cdk/layout';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { DeliveryMethod } from '../../core/models';
import {
  addBusinessDays,
  calculateTotals,
  DELIVERY_OPTIONS,
  shippingCost,
} from '../../core/pricing';
import {
  cardNumberValidator,
  detectCardBrand,
  expiryValidator,
  formatCardNumber,
  formatExpiry,
  lastFour,
} from '../../core/validators';
import { OrderSummary } from '../../shared/order-summary';
import { cartFeature } from '../../store/cart.feature';
import { OrdersActions } from '../../store/orders.actions';
import { ordersFeature } from '../../store/orders.feature';

export const COUNTRIES = [
  'Australia',
  'Canada',
  'France',
  'Germany',
  'India',
  'Netherlands',
  'Pakistan',
  'Saudi Arabia',
  'Spain',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
];

const ERROR_MESSAGES: Record<string, string> = {
  required: 'This field is required',
  email: 'Enter a valid email address',
  minlength: 'This is too short',
  phone: 'Enter a valid phone number',
  postalCode: 'Enter a valid postal code',
  cardFormat: 'Card numbers contain digits only',
  cardLength: 'Card numbers are 13 to 19 digits',
  luhn: 'This card number is not valid',
  expiryFormat: 'Use the format MM/YY',
  expired: 'This card has expired',
  cvc: 'Enter the 3 or 4 digit code',
};

@Component({
  selector: 'app-checkout',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatStepperModule,
    OrderSummary,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly store = inject(Store);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly countries = COUNTRIES;
  protected readonly deliveryOptions = Object.entries(DELIVERY_OPTIONS).map(([value, option]) => ({
    value: value as DeliveryMethod,
    ...option,
  }));

  protected readonly shipping = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, patternError(/^\+?[\d\s().-]{7,20}$/, 'phone')]],
    street: ['', Validators.required],
    city: ['', Validators.required],
    postalCode: [
      '',
      [Validators.required, patternError(/^[A-Za-z\d][A-Za-z\d\s-]{1,8}[A-Za-z\d]$/, 'postalCode')],
    ],
    country: ['', Validators.required],
  });

  protected readonly delivery = this.fb.group({
    method: this.fb.control<DeliveryMethod>('standard', Validators.required),
  });

  protected readonly payment = this.fb.group({
    cardholder: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, cardNumberValidator]],
    expiry: ['', [Validators.required, expiryValidator]],
    cvc: ['', [Validators.required, patternError(/^\d{3,4}$/, 'cvc')]],
  });

  protected readonly items = this.store.selectSignal(cartFeature.selectItems);
  protected readonly placing = this.store.selectSignal(ordersFeature.selectPlacing);
  private readonly pastOrders = this.store.selectSignal(ordersFeature.selectOrders);

  protected readonly method = toSignal(this.delivery.controls.method.valueChanges, {
    initialValue: this.delivery.controls.method.value,
  });
  protected readonly totals = computed(() => calculateTotals(this.items(), this.method()));
  protected readonly deliveryOption = computed(() => DELIVERY_OPTIONS[this.method()]);
  protected readonly deliveryEstimate = computed(() => {
    const option = this.deliveryOption();
    const now = new Date();
    return { from: addBusinessDays(now, option.minDays), to: addBusinessDays(now, option.maxDays) };
  });

  protected readonly cardBrand = toSignal(
    this.payment.controls.cardNumber.valueChanges.pipe(map(detectCardBrand)),
    { initialValue: 'Card' },
  );

  protected readonly vertical = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 719px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  /** Returning customers get their last shipping address filled in. */
  protected readonly prefilled = signal(false);

  constructor() {
    const lastOrder = this.pastOrders()[0];
    this.prefilled.set(!!lastOrder);
    if (lastOrder) {
      this.shipping.setValue(lastOrder.shipping);
      this.payment.controls.cardholder.setValue(lastOrder.payment.cardholder);
    }
  }

  protected shippingPrice(method: DeliveryMethod): number {
    return shippingCost(this.totals().subtotal, method);
  }

  protected errorFor(control: AbstractControl): string {
    const key = Object.keys(control.errors ?? {})[0];
    return ERROR_MESSAGES[key] ?? 'This value is not valid';
  }

  protected formatCardInput(): void {
    const control = this.payment.controls.cardNumber;
    control.setValue(formatCardNumber(control.value));
  }

  protected formatExpiryInput(event: Event): void {
    // Let deletions through untouched so Backspace over the slash works.
    if ((event as InputEvent).inputType?.startsWith('delete')) return;
    const control = this.payment.controls.expiry;
    control.setValue(formatExpiry(control.value));
  }

  protected resetAddress(): void {
    this.shipping.reset();
    this.prefilled.set(false);
  }

  protected placeOrder(): void {
    if (this.placing()) return;
    const forms = [this.shipping, this.delivery, this.payment];
    if (forms.some((f) => f.invalid)) {
      forms.forEach((f) => f.markAllAsTouched());
      return;
    }
    const { cardholder, cardNumber } = this.payment.getRawValue();
    this.store.dispatch(
      OrdersActions.placeOrder({
        details: {
          shipping: this.shipping.getRawValue(),
          delivery: this.method(),
          payment: { cardholder, brand: detectCardBrand(cardNumber), last4: lastFour(cardNumber) },
        },
      }),
    );
  }
}

/** Like Validators.pattern, but reports a named error so each field gets a specific message. */
function patternError(pattern: RegExp, error: string) {
  return (control: AbstractControl) =>
    !control.value || pattern.test(control.value) ? null : { [error]: true };
}
