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
  {
    path: 'catalog',
    loadComponent: () => import('./pages/catalog/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'catalog/:categoryId',
    loadComponent: () =>
      import('./pages/category-products/category-products.page').then((m) => m.CategoryProductsPage),
  },
  // Agregar aquí las futuras páginas del proyecto
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
