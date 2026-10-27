import { Routes } from '@angular/router';
import { adminGuard } from '../../core/admin-auth';

export const adminRoutes: Routes = [
  {
    path: 'login',
    title: 'Admin sign in | Cartwheel',
    loadComponent: () => import('./admin-login').then((m) => m.AdminLogin),
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        title: 'Sales dashboard | Cartwheel admin',
        loadComponent: () => import('./dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'products',
        title: 'Products | Cartwheel admin',
        loadComponent: () => import('./admin-products').then((m) => m.AdminProducts),
      },
      {
        path: 'products/new',
        title: 'Add product | Cartwheel admin',
        loadComponent: () => import('./product-form').then((m) => m.ProductForm),
      },
      {
        path: 'products/:id',
        title: 'Edit product | Cartwheel admin',
        loadComponent: () => import('./product-form').then((m) => m.ProductForm),
      },
      {
        path: 'expenses',
        title: 'Expenses | Cartwheel admin',
        loadComponent: () => import('./admin-expenses').then((m) => m.AdminExpenses),
      },
    ],
  },
];
