import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuth } from '../../core/admin-auth';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Store admin</h1>
          <p>Manage products and expenses, and track sales and profit.</p>
        </div>
        <button mat-stroked-button type="button" (click)="signOut()">
          <mat-icon>logout</mat-icon>
          Sign out
        </button>
      </header>

      <nav mat-tab-nav-bar [tabPanel]="panel" aria-label="Admin sections">
        @for (link of links; track link.path) {
          <a
            mat-tab-link
            [routerLink]="link.path"
            routerLinkActive
            #rla="routerLinkActive"
            [routerLinkActiveOptions]="{ exact: link.exact }"
            [active]="rla.isActive"
          >
            <mat-icon>{{ link.icon }}</mat-icon>
            {{ link.label }}
          </a>
        }
      </nav>
      <mat-tab-nav-panel #panel class="panel-body">
        <router-outlet />
      </mat-tab-nav-panel>
    </div>
  `,
  styles: `
    nav {
      margin-bottom: 24px;
      background: transparent;
    }
    nav .mat-icon {
      margin-right: 8px;
    }
  `,
})
export class AdminLayout {
  private readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);

  protected readonly links = [
    { path: '/admin', label: 'Dashboard', icon: 'insights', exact: true },
    { path: '/admin/products', label: 'Products', icon: 'inventory_2', exact: false },
    { path: '/admin/expenses', label: 'Expenses', icon: 'receipt_long', exact: false },
  ];

  protected signOut(): void {
    this.auth.signOut();
    this.router.navigate(['/admin/login']);
  }
}
