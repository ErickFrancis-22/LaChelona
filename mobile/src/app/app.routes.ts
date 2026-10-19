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
  // Agregar aquí las futuras páginas del proyecto
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
