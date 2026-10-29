// Perfil del cliente en un solo objeto: une `user` y `client` de GET profile
export interface Profile {
  name: string;
  username: string;
  email: string;
  business_name: string;
  contact_name: string;
  phone: string;
  address: string;
  address_reference: string | null;
  latitude: number;
  longitude: number;
}

export interface ProfileResponse {
  data: {
    user: {
      id: number;
      name: string;
      username: string;
      email: string;
    };
    client: {
      business_name: string;
      contact_name: string;
      phone: string;
      email: string | null;
      address: string;
      address_reference: string | null;
      latitude: string | number; // cast decimal:7 de Laravel
      longitude: string | number;
    };
  };
}

// El backend pide `name` (usuario) y `contact_name` (encargado) por separado: la app envía el mismo nombre en ambos
export interface UpdateProfileRequest {
  name: string;
  email: string;
  business_name: string;
  contact_name: string;
  phone: string;
  address: string;
  address_reference: string | null;
  latitude: number;
  longitude: number;
}

// Laravel valida la confirmación con la regla `confirmed`, que busca `new_password_confirmation`
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface MessageResponse {
  message: string;
}
