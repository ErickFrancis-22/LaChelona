import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api
      .post<LoginResponse>('auth/login', credentials)
      .pipe(
        tap((res) => {
          this.saveToken(res.token);
          localStorage.setItem(USER_NAME_KEY, res.user.name);
        }),
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

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
  }
}
