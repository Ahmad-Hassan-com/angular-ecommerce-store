import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CartItem, Product } from './models';

export const API_URL = 'https://fakestoreapi.com';

/** Thin client for the Fake Store API (https://fakestoreapi.com/docs). */
@Injectable({ providedIn: 'root' })
export class StoreApi {
  private readonly http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_URL}/products`);
  }

  /** The API accepts the cart but does not persist it, so orders are also kept locally. */
  createCart(items: readonly CartItem[]): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${API_URL}/carts`, {
      userId: 1,
      date: new Date().toISOString(),
      products: items.map(({ productId, quantity }) => ({ productId, quantity })),
    });
  }
}

export function errorMessage(error: unknown): string {
  const status = (error as { status?: number })?.status;
  if (status === 0) return 'Could not reach the store. Check your connection and try again.';
  if (status) return `The store returned an error (${status}). Please try again.`;
  return 'Something went wrong. Please try again.';
}
