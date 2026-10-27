import { Component, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-quantity-stepper',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="stepper" role="group" [attr.aria-label]="'Quantity for ' + label()">
      <button
        mat-icon-button
        type="button"
        [disabled]="value() <= min()"
        (click)="value.set(value() - 1)"
        [attr.aria-label]="'Decrease quantity of ' + label()"
      >
        <mat-icon>remove</mat-icon>
      </button>
      <output aria-live="polite">{{ value() }}</output>
      <button
        mat-icon-button
        type="button"
        [disabled]="value() >= max()"
        (click)="value.set(value() + 1)"
        [attr.aria-label]="'Increase quantity of ' + label()"
      >
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .stepper {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 999px;
      padding: 0 2px;
    }
    output {
      min-width: 28px;
      text-align: center;
      font: var(--mat-sys-title-small);
    }
  `,
})
export class QuantityStepper {
  readonly value = model.required<number>();
  readonly min = input(1);
  readonly max = input(10);
  readonly label = input('item');
}
