import { HttpErrorResponse } from '@angular/common/http';

// Errores de validación de Laravel (422): { message, errors: { campo: [mensajes] } }
export const validationErrors = (err: HttpErrorResponse): Record<string, string[]> =>
  err.status === 422 ? ((err.error?.errors ?? {}) as Record<string, string[]>) : {};

// PUT orders/{id} y PATCH orders/{id}/cancel responden 422 en `order` cuando el pedido ya no está PENDING
// (por ejemplo, el administrador lo confirmó mientras el cliente lo editaba)
export const isOrderLockedError = (err: HttpErrorResponse): boolean => !!validationErrors(err)['order'];

// Todos los mensajes del 422 en un solo texto, o el mensaje por defecto
export const validationMessage = (err: HttpErrorResponse, fallback: string): string =>
  Object.values(validationErrors(err)).flat().join('\n') || (err.error?.message ?? fallback);
