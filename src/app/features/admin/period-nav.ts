import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** "‹ October 2026 ›" style stepper for moving between months or years. */
@Component({
  selector: 'app-period-nav',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-icon-button
      type="button"
      (click)="previous.emit()"
      [attr.aria-label]="'Previous ' + unit()"
    >
      <mat-icon>chevron_left</mat-icon>
    </button>
    <span class="label" aria-live="polite">{{ label() }}</span>
    <button
      mat-icon-button
      type="button"
      (click)="next.emit()"
      [disabled]="!canGoNext()"
      [attr.aria-label]="'Next ' + unit()"
    >
      <mat-icon>chevron_right</mat-icon>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .label {
      min-width: 132px;
      text-align: center;
      font: var(--mat-sys-title-medium);
    }
  `,
})
export class PeriodNav {
  readonly label = input.required<string>();
  readonly unit = input('period');
  readonly canGoNext = input(true);
  readonly previous = output();
  readonly next = output();
}
