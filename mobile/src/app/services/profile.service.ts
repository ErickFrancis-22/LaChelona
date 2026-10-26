import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  ChangePasswordRequest,
  MessageResponse,
  Profile,
  ProfileResponse,
  UpdateProfileRequest,
} from '../models/profile.model';

export function toProfile({ data: { user, client } }: ProfileResponse): Profile {
  return {
    name: user.name,
    username: user.username,
    email: client.email ?? user.email,
    business_name: client.business_name,
    contact_name: client.contact_name,
    phone: client.phone,
    address: client.address,
    address_reference: client.address_reference,
    latitude: Number(client.latitude),
    longitude: Number(client.longitude),
  };
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);

  getProfile(): Observable<Profile> {
    return this.api.get<ProfileResponse>('profile').pipe(map(toProfile));
  }

  // El backend solo responde { message }: la página arma el perfil actualizado con lo que envió
  updateProfile(data: UpdateProfileRequest): Observable<MessageResponse> {
    return this.api.put<MessageResponse>('profile', data);
  }

  changePassword(data: ChangePasswordRequest): Observable<MessageResponse> {
    return this.api.patch<MessageResponse>('profile/password', data);
  }
}
