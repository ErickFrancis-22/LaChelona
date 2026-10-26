import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Usuario: letras, números y punto, sin espacios (ej. minisuper.elroble)
export const USERNAME_PATTERN = /^[A-Za-z0-9.]+$/;

// Teléfono de 8 dígitos con o sin guion (ej. 7777-7777)
export const PHONE_PATTERN = /^\d{4}-?\d{4}$/;

// Compara contra otro control del mismo grupo; el que se compara debe revalidar este al cambiar
export function matchControl(otherName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(otherName);
    if (!other || !control.value) {
      return null;
    }
    return control.value === other.value ? null : { mismatch: true };
  };
}

// Lo contrario de matchControl: el valor debe ser distinto (ej. la nueva contraseña frente a la actual)
export function differentFrom(otherName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(otherName);
    if (!other || !control.value) {
      return null;
    }
    return control.value === other.value ? { sameAsOther: true } : null;
  };
}
