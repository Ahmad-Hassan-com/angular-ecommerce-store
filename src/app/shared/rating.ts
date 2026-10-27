import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rating',
  imports: [MatIconModule],
  template: `
    @if (count() === 0) {
      <span>No reviews yet</span>
    } @else {
      <span class="stars" aria-hidden="true">
        @for (star of stars(); track $index) {
          <mat-icon>{{ star }}</mat-icon>
        }
      </span>
      <span class="value">{{ rate().toFixed(1) }}</span>
      @if (count() !== null) {
        <span class="count">({{ count() }})</span>
      }
      <span class="cdk-visually-hidden">{{ label() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .stars {
      display: inline-flex;
      color: var(--star-color);
    }
    .stars .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .value {
      color: var(--mat-sys-on-surface);
      font-weight: 500;
    }
  `,
})
export class Rating {
  readonly rate = input.required<number>();
  readonly count = input<number | null>(null);

  readonly stars = computed(() => {
    const rate = Math.round(this.rate() * 2) / 2;
    return [1, 2, 3, 4, 5].map((n) =>
      rate >= n ? 'star' : rate >= n - 0.5 ? 'star_half' : 'star_border',
    );
  });

  readonly label = computed(() => {
    const count = this.count();
    const base = `Rated ${this.rate().toFixed(1)} out of 5`;
    return count === null ? base : `${base} from ${count} reviews`;
  });
}
