import { Injectable, signal } from '@angular/core';

// Permite que una pestaña oculte la barra inferior mientras muestra su propia barra de acciones (ej. edición del perfil)
@Injectable({ providedIn: 'root' })
export class TabBarService {
  readonly hidden = signal(false);
}
