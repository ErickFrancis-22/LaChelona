import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  // Pestañas del cliente: ion-tabs necesita un prefijo propio (/tabs/<pestaña>) para armar sus rutas
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'catalog',
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/catalog/catalog.page').then((m) => m.CatalogPage),
          },
          {
            path: ':categoryId',
            loadComponent: () =>
              import('./pages/category-products/category-products.page').then((m) => m.CategoryProductsPage),
          },
        ],
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders.page').then((m) => m.OrdersPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'catalog',
        pathMatch: 'full',
      },
    ],
  },
  // Carrito fuera de las pestañas: el diseño de "Tu pedido" no lleva la barra inferior
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cart/cart.page').then((m) => m.CartPage),
  },
  // Agregar aquí las futuras páginas del proyecto
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
