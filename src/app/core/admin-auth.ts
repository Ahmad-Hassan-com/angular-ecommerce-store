import { inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const SESSION_KEY = 'cartwheel.admin-session';

/** Shown on the login page so reviewers can get in. */
export const DEMO_ADMIN = { email: 'admin@cartwheel.dev', password: 'admin123' };

/**
 * Demo-only admin sign-in. There is no backend, so this gates the UI rather than
 * protecting data; a real store would verify credentials on a server.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuth {
  readonly signedIn = signal(read());

  signIn(email: string, password: string): boolean {
    const ok = email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
    if (ok) {
      this.signedIn.set(true);
      write(true);
    }
    return ok;
  }

  signOut(): void {
    this.signedIn.set(false);
    write(false);
  }
}

export const adminGuard: CanActivateFn = (_route, state) =>
  inject(AdminAuth).signedIn() ||
  inject(Router).createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });

function read(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function write(value: boolean): void {
  try {
    if (value) localStorage.setItem(SESSION_KEY, '1');
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Without storage the session simply lasts until reload.
  }
}
