import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of, switchMap } from 'rxjs';
import {
  AlertController,
  IonButton,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonModal,
  IonTextarea,
  LoadingController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, chevronBack, chevronForward, locationOutline } from 'ionicons/icons';
import { AuthService, RegisterRequest } from '../../services/auth.service';
import { Coordinates, LocationPickerComponent } from '../../components/location-picker/location-picker.component';
import { RegisterSuccessComponent } from '../../components/register-success/register-success.component';
import { PHONE_PATTERN, USERNAME_PATTERN, matchControl } from '../../utils/validators';

type FieldName = keyof RegisterPage['form']['controls'];

const TOTAL_STEPS = 3;

// Campos que se validan antes de avanzar de cada paso
const STEP_FIELDS: Record<number, FieldName[]> = {
  1: ['business_name', 'name', 'contact_phone', 'email'],
  2: ['address', 'address_reference', 'latitude', 'longitude'],
  3: ['username', 'password', 'password_confirmation', 'terms'],
};

const STEP_TEXTS: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Datos del negocio', subtitle: 'Con estos datos te identificaremos al recibir tus pedidos.' },
  2: { title: 'Dirección de entrega', subtitle: 'Aquí llevaremos tus pedidos.' },
  3: { title: 'Crea tu acceso', subtitle: 'Con tu usuario y contraseña entrarás a la app.' },
};

// Mensajes por campo y tipo de error; `taken` lo marca el backend cuando el dato ya existe
const ERROR_MESSAGES: Partial<Record<FieldName, Record<string, string>>> = {
  business_name: { required: 'Escribe el nombre de tu negocio' },
  name: { required: 'Escribe el nombre del encargado' },
  contact_phone: { required: 'Escribe un teléfono de contacto', pattern: 'Usa el formato 0000-0000' },
  email: {
    required: 'Escribe un correo electrónico',
    email: 'Revisa el formato del correo',
    taken: 'Ese correo ya está registrado',
  },
  address: { required: 'Escribe la dirección de entrega' },
  address_reference: { required: 'Escribe un punto de referencia' },
  latitude: { required: 'Marca la ubicación de tu negocio en el mapa' },
  username: {
    required: 'Escribe un usuario',
    pattern: 'Solo letras, números y punto, sin espacios',
    taken: 'Ese usuario ya está en uso, prueba con otro',
  },
  password: { required: 'Escribe una contraseña', minlength: 'Debe tener al menos 8 caracteres' },
  password_confirmation: { required: 'Confirma tu contraseña', mismatch: 'Las contraseñas no coinciden' },
  terms: { required: 'Debes aceptar los términos para crear tu cuenta' },
};

// Campos del backend que no coinciden con los del formulario, para devolver sus errores al campo correcto
const API_TO_FIELD: Record<string, FieldName> = {
  phone: 'contact_phone',
  contact_name: 'name',
};

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonContent,
    IonFooter,
    IonInput,
    IonInputPasswordToggle,
    IonTextarea,
    IonCheckbox,
    IonButton,
    IonIcon,
    IonModal,
    LocationPickerComponent,
    RegisterSuccessComponent,
  ],
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly alertCtrl = inject(AlertController);

  readonly totalSteps = TOTAL_STEPS;
  readonly steps = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);
  readonly stepTexts = STEP_TEXTS;

  readonly pasoActual = signal(1);
  readonly mapOpen = signal(false);
  readonly submitting = signal(false);
  // Datos que se muestran en la pantalla de éxito
  readonly registered = signal<{ businessName: string; username: string; loggedIn: boolean } | null>(null);

  // Un solo FormGroup para los 3 pasos; cada paso valida solo sus campos (STEP_FIELDS)
  readonly form = this.fb.nonNullable.group({
    business_name: ['', [Validators.required, Validators.maxLength(255)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    contact_phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    address: ['', Validators.required],
    address_reference: ['', Validators.required],
    latitude: this.fb.control<number | null>(null, Validators.required),
    longitude: this.fb.control<number | null>(null, Validators.required),
    username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN), Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required, matchControl('password')]],
    terms: [false, Validators.requiredTrue],
  });

  constructor() {
    addIcons({ chevronBack, chevronForward, locationOutline, checkmarkCircle });

    // La confirmación depende de la contraseña: se revalida cuando esta cambia
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.form.controls.password_confirmation.updateValueAndValidity({ emitEvent: false }));
  }

  get hasLocation(): boolean {
    return this.form.controls.latitude.value !== null && this.form.controls.longitude.value !== null;
  }

  errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) {
      return null;
    }
    const key = Object.keys(control.errors)[0];
    const messages = ERROR_MESSAGES[field] ?? {};
    // requiredTrue del checkbox reporta `required`
    return messages[key] ?? (key === 'maxlength' ? 'Es demasiado largo' : 'Revisa este campo');
  }

  goBack(): void {
    if (this.pasoActual() > 1) {
      this.pasoActual.update((step) => step - 1);
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  next(): void {
    if (!this.isStepValid(this.pasoActual())) {
      return;
    }
    if (this.pasoActual() < TOTAL_STEPS) {
      this.pasoActual.update((step) => step + 1);
    } else {
      this.submit();
    }
  }

  onLocationConfirmed({ latitude, longitude }: Coordinates): void {
    this.form.patchValue({ latitude, longitude });
    this.form.controls.latitude.markAsTouched();
    this.mapOpen.set(false);
  }

  // Con la sesión iniciada va al catálogo; si el login automático falló, al login para entrar a mano
  continueAfterRegister(): void {
    const url = this.registered()?.loggedIn ? '/tabs/catalog' : '/login';
    this.router.navigateByUrl(url, { replaceUrl: true });
  }

  private isStepValid(step: number): boolean {
    const controls = STEP_FIELDS[step].map((field) => this.form.controls[field]);
    controls.forEach((control) => control.markAsTouched());
    return controls.every((control) => control.valid);
  }

  private async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);

    const loading = await this.loadingCtrl.create({ message: 'Creando tu cuenta...' });
    await loading.present();

    const request = this.buildRequest();

    // El registro no devuelve token: se inicia sesión con las mismas credenciales para entrar directo al catálogo.
    // Si ese login falla la cuenta ya existe, así que se muestra el éxito igual y el botón lleva al login
    this.auth
      .register(request)
      .pipe(
        switchMap((res) =>
          this.auth.login({ username: request.username, password: request.password }).pipe(
            map(() => true),
            catchError(() => of(false)),
            map((loggedIn) => ({ res, loggedIn })),
          ),
        ),
      )
      .subscribe({
        next: async ({ res, loggedIn }) => {
          await loading.dismiss();
          this.submitting.set(false);
          this.registered.set({ businessName: res.client.business_name, username: res.user.username, loggedIn });
          this.form.reset();
        },
        error: async (err: HttpErrorResponse) => {
          await loading.dismiss();
          this.submitting.set(false);
          await this.showError(err);
        },
      });
  }

  private buildRequest(): RegisterRequest {
    const value = this.form.getRawValue();
    const name = value.name.trim();
    const digits = value.contact_phone.replace('-', '');

    return {
      name,
      contact_name: name,
      username: value.username.trim(),
      email: value.email.trim(),
      password: value.password,
      business_name: value.business_name.trim(),
      phone: `${digits.slice(0, 4)}-${digits.slice(4)}`,
      address: value.address.trim(),
      address_reference: value.address_reference.trim() || null,
      latitude: value.latitude!,
      longitude: value.longitude!,
    };
  }

  private async showError(err: HttpErrorResponse): Promise<void> {
    let header = 'Error';
    let message = 'Ocurrió un error inesperado. Intenta de nuevo.';

    if (err.status === 422) {
      const errors = (err.error?.errors ?? {}) as Record<string, string[]>;
      const messages: string[] = [];
      let firstStep = TOTAL_STEPS;

      for (const [apiField, apiMessages] of Object.entries(errors)) {
        const field = API_TO_FIELD[apiField] ?? (apiField as FieldName);
        const control = this.form.controls[field];
        if (!control) {
          messages.push(...apiMessages);
          continue;
        }

        // `unique` es el único error que el formulario no puede detectar antes de enviar
        const isTaken = (field === 'username' || field === 'email') && apiMessages.some((m) => m.includes('taken'));
        control.setErrors(isTaken ? { taken: true } : { server: true });
        control.markAsTouched();
        messages.push(isTaken ? ERROR_MESSAGES[field]!['taken'] : apiMessages.join(' '));

        const step = Number(Object.keys(STEP_FIELDS).find((s) => STEP_FIELDS[Number(s)].includes(field)));
        firstStep = Math.min(firstStep, step);
      }

      // Lleva al cliente al primer paso con errores para que los corrija sin perder lo demás
      this.pasoActual.set(firstStep);
      header = 'Revisa tus datos';
      message = messages.join('\n') || (err.error?.message ?? message);
    } else if (err.status === 0) {
      header = 'Sin conexión';
      message = 'No se pudo conectar con el servidor.';
    }

    const alert = await this.alertCtrl.create({ header, message, buttons: ['Aceptar'] });
    await alert.present();
  }
}
