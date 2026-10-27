import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="page">
      <div class="panel state">
        <mat-icon>travel_explore</mat-icon>
        <h1>Page not found</h1>
        <p class="muted">The page you're looking for doesn't exist or has moved.</p>
        <a mat-flat-button routerLink="/products">Go to the shop</a>
      </div>
    </div>
  `,
})
export class NotFound {}
