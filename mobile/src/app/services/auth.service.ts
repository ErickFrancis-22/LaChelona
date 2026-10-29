import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { ApiService } from './api.service';
import { CartService } from './cart.service';
import { ProfileResponse } from '../models/profile.model';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    username: string;
    role: 'ADMIN' | 'CLIENT';
  };
}

// El backend pide el nombre dos veces: `name` (usuario) y `contact_name` (encargado del negocio)
export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  business_name: string;
  contact_name: string;
  phone: string;
  address: string;
  address_reference: string | null;
  latitude: number;
  longitude: number;
}

// El registro no devuelve token: el cliente inicia sesión después desde el login
export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
    role: 'CLIENT';
  };
  client: {
    id: number;
    business_name: string;
    contact_name: string;
    phone: string;
    address: string;
    address_reference: string | null;
    latitude: string; // cast decimal:7 de Laravel
    longitude: string;
  };
}

const TOKEN_KEY = 'auth_token';
const USER_NAME_KEY = 'auth_user_name';
const BUSINESS_NAME_KEY = 'auth_business_name';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);

  // El login no trae el nombre del negocio: se pide a GET profile para mostrarlo en "Entregar en".
  // Si esa consulta falla la sesión sigue igual y el catálogo usa el nombre del encargado
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', credentials).pipe(
      tap((res) => {
        this.saveToken(res.token);
        localStorage.setItem(USER_NAME_KEY, res.user.name);
      }),
      switchMap((res) =>
        this.api.get<ProfileResponse>('profile').pipe(
          tap((profile) => localStorage.setItem(BUSINESS_NAME_KEY, profile.data.client.business_name)),
          catchError(() => of(null)),
          map(() => res),
        ),
      ),
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('auth/register', data);
  }

  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUserName(): string | null {
    return localStorage.getItem(USER_NAME_KEY);
  }

  getBusinessName(): string | null {
    return localStorage.getItem(BUSINESS_NAME_KEY);
  }

  // Se llama al guardar el perfil para que el catálogo no muestre nombres viejos
  saveNames(userName: string, businessName: string): void {
    localStorage.setItem(USER_NAME_KEY, userName);
    localStorage.setItem(BUSINESS_NAME_KEY, businessName);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Revoca el token en el backend; la sesión local se borra aunque esa llamada falle (sin conexión, token vencido)
  logoutFromServer(): Observable<void> {
    return this.api.post<unknown>('auth/logout', {}).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this.logout()),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(BUSINESS_NAME_KEY);
    // Otra cuenta en el mismo teléfono no debe heredar el carrito
    this.cart.clear();
  }
}
