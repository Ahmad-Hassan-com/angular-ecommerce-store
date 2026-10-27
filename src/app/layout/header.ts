import { Component, computed, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { ThemeService } from '../core/theme.service';
import { cartFeature } from '../store/cart.feature';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  template: `
    <mat-toolbar class="toolbar">
      <a class="brand" routerLink="/products" aria-label="Cartwheel home">
        <mat-icon>local_mall</mat-icon>
        <span class="brand-name">Cartwheel</span>
      </a>
      <nav aria-label="Main">
        <a mat-button routerLink="/products" routerLinkActive="active" ariaCurrentWhenActive="page">
          Shop
        </a>
        <a mat-button routerLink="/orders" routerLinkActive="active" ariaCurrentWhenActive="page">
          Orders
        </a>
        <a mat-button routerLink="/admin" routerLinkActive="active" ariaCurrentWhenActive="page">
          Admin
        </a>
      </nav>
      <span class="spacer"></span>
      <button
        mat-icon-button
        type="button"
        (click)="theme.toggle()"
        [matTooltip]="isDark() ? 'Light mode' : 'Dark mode'"
        [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <mat-icon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
      <a
        mat-icon-button
        routerLink="/cart"
        matTooltip="Cart"
        [attr.aria-label]="'Cart, ' + count() + (count() === 1 ? ' item' : ' items')"
      >
        <mat-icon
          [matBadge]="count() > 99 ? '99+' : count()"
          [matBadgeHidden]="count() === 0"
          matBadgeSize="small"
          aria-hidden="true"
          >shopping_cart</mat-icon
        >
      </a>
    </mat-toolbar>
  `,
  styles: `
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      gap: 8px;
      background: var(--mat-sys-surface);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-right: 8px;
      color: var(--mat-sys-primary);
      text-decoration: none;
      font: var(--mat-sys-title-large);
      font-weight: 700;
    }
    nav {
      display: flex;
      gap: 4px;
    }
    nav a.active {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    @media (max-width: 480px) {
      .brand-name {
        display: none;
      }
      nav a {
        padding: 0 10px;
        min-width: 0;
      }
    }
  `,
})
export class Header {
  protected readonly theme = inject(ThemeService);
  protected readonly isDark = computed(() => this.theme.theme() === 'dark');
  protected readonly count = inject(Store).selectSignal(cartFeature.selectItemCount);
}
