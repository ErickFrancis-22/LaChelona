import { environment } from '../../environments/environment';

// El backend sirve las imágenes desde su propio origen (sin el sufijo /api)
const BACKEND_ORIGIN = new URL(environment.apiUrl).origin;

// La API devuelve rutas relativas (/images/...); sin esto el navegador las pide a localhost:8100
export function resolveImageUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }
  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }
  return `${BACKEND_ORIGIN}/${url.replace(/^\/+/, '')}`;
}
