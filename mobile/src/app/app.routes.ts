import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  // Agregar aquí las futuras páginas del proyecto
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
