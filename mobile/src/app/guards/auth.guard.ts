import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Solo revisa que haya token guardado; si ya venció, el primer 401 lo resuelve auth.interceptor.ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).parseUrl('/login');
};

// Login y registro no tienen sentido con la sesión iniciada
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || inject(Router).parseUrl('/tabs/catalog');
};
