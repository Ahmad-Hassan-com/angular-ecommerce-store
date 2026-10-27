import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Store } from '@ngrx/store';
import { cartFeature } from './store/cart.feature';

/** Checkout needs something to buy; an empty cart is sent back to the cart page. */
const cartNotEmpty: CanActivateFn = () =>
  inject(Store).selectSignal(cartFeature.selectItemCount)() > 0 ||
  inject(Router).createUrlTree(['/cart']);

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  {
    path: 'products',
    title: 'Shop | Cartwheel',
    loadComponent: () => import('./features/products/product-list').then((m) => m.ProductList),
  },
  {
    path: 'products/:id',
    title: 'Product | Cartwheel',
    loadComponent: () => import('./features/products/product-detail').then((m) => m.ProductDetail),
  },
  {
    path: 'cart',
    title: 'Your cart | Cartwheel',
    loadComponent: () => import('./features/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'checkout',
    title: 'Checkout | Cartwheel',
    canActivate: [cartNotEmpty],
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'orders',
    title: 'Order history | Cartwheel',
    loadComponent: () => import('./features/orders/order-list').then((m) => m.OrderList),
  },
  {
    path: 'orders/:id',
    title: 'Order details | Cartwheel',
    loadComponent: () => import('./features/orders/order-detail').then((m) => m.OrderDetail),
  },
  {
    path: '**',
    title: 'Page not found | Cartwheel',
    loadComponent: () => import('./features/errors/not-found').then((m) => m.NotFound),
  },
];
