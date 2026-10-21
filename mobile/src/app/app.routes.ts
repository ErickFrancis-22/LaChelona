import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  // Pestañas del cliente: ion-tabs necesita un prefijo propio (/tabs/<pestaña>) para armar sus rutas
  {
    path: 'tabs',
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
  // Agregar aquí las futuras páginas del proyecto
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
