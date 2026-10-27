import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AdminAuth, DEMO_ADMIN } from '../../core/admin-auth';

@Component({
  selector: 'app-admin-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="page">
      <section class="panel card">
        <mat-icon class="icon">admin_panel_settings</mat-icon>
        <h1>Admin sign in</h1>
        <p class="muted">Manage products and expenses, and see sales and profit reports.</p>

        <div class="demo">
          <span>
            Demo login: <strong>{{ demo.email }}</strong> / <strong>{{ demo.password }}</strong>
          </span>
          <button mat-button type="button" (click)="fillDemo()">Fill in</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (failed()) {
            <p class="error" role="alert">
              <mat-icon>error_outline</mat-icon>
              That email and password don't match.
            </p>
          }
          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="username" />
            @if (form.controls.email.hasError('required')) {
              <mat-error>Enter your email</mat-error>
            } @else if (form.controls.email.hasError('email')) {
              <mat-error>Enter a valid email address</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Password</mat-label>
            <input
              matInput
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="showPassword.set(!showPassword())"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            >
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.controls.password.hasError('required')) {
              <mat-error>Enter your password</mat-error>
            }
          </mat-form-field>
          <button mat-flat-button type="submit">Sign in</button>
        </form>
      </section>
    </div>
  `,
  styles: `
    .card {
      max-width: 420px;
      margin: 24px auto;
      padding: 32px;
    }
    .icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
      color: var(--mat-sys-primary);
    }
    h1 {
      margin: 8px 0 4px;
      font: var(--mat-sys-headline-small);
    }
    .demo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 4px 8px;
      margin: 16px 0;
      padding: 8px 4px 8px 12px;
      border-radius: 8px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font: var(--mat-sys-body-small);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .error {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    button[type='submit'] {
      height: 48px;
    }
    @media (max-width: 599px) {
      .card {
        padding: 24px 20px;
        margin: 0 auto;
      }
    }
  `,
})
export class AdminLogin {
  private readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();

  protected readonly demo = DEMO_ADMIN;
  protected readonly failed = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.auth.signedIn()) this.router.navigateByUrl('/admin', { replaceUrl: true });
  }

  protected fillDemo(): void {
    this.form.setValue({ email: DEMO_ADMIN.email, password: DEMO_ADMIN.password });
    this.failed.set(false);
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    if (!this.auth.signIn(email, password)) {
      this.failed.set(true);
      return;
    }
    // Only follow same-app admin paths, never an arbitrary URL from the query string.
    const target = this.returnUrl()?.startsWith('/admin') ? this.returnUrl()! : '/admin';
    this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
