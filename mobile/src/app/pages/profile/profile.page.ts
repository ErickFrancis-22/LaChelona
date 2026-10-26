import { Component, DestroyRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonModal,
  IonSkeletonText,
  IonTextarea,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, chevronForward, keyOutline, locationOutline, logOutOutline, storefrontOutline } from 'ionicons/icons';
import { Profile, UpdateProfileRequest } from '../../models/profile.model';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { TabBarService } from '../../services/tab-bar.service';
import { Coordinates, LocationPickerComponent } from '../../components/location-picker/location-picker.component';
import { LocationPreviewComponent } from '../../components/location-preview/location-preview.component';
import { StateViewComponent } from '../../components/state-view/state-view.component';
import { initials } from '../../utils/initials';
import { PHONE_PATTERN, differentFrom, matchControl } from '../../utils/validators';

type LoadStatus = 'loading' | 'ready' | 'error';
type ProfileField = keyof ProfilePage['form']['controls'];
type PasswordField = keyof ProfilePage['passwordForm']['controls'];

// Mensajes por campo y tipo de error; `taken` e `incorrect` los marca el backend
const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  business_name: { required: 'Escribe el nombre de tu negocio' },
  contact_name: { required: 'Escribe el nombre del encargado' },
  phone: { required: 'Escribe un teléfono de contacto', pattern: 'Usa el formato 0000-0000' },
  email: {
    required: 'Escribe un correo electrónico',
    email: 'Revisa el formato del correo',
    taken: 'Ese correo ya está registrado',
  },
  address: { required: 'Escribe la dirección de entrega' },
  address_reference: { required: 'Escribe un punto de referencia' },
  latitude: { required: 'Marca la ubicación de tu negocio en el mapa' },
  current_password: {
    required: 'Escribe tu contraseña actual',
    incorrect: 'La contraseña actual es incorrecta',
  },
  new_password: {
    required: 'Escribe la nueva contraseña',
    minlength: 'Debe tener al menos 8 caracteres',
    sameAsOther: 'Debe ser distinta de la contraseña actual',
  },
  new_password_confirmation: {
    required: 'Confirma la nueva contraseña',
    mismatch: 'Las contraseñas no coinciden',
  },
};

// El backend valida `name` (usuario), pero la app lo llena con el nombre del encargado
const API_TO_FIELD: Record<string, ProfileField> = {
  name: 'contact_name',
};

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonFooter,
    IonIcon,
    IonInput,
    IonInputPasswordToggle,
    IonTextarea,
    IonButton,
    IonModal,
    IonSkeletonText,
    LocationPickerComponent,
    LocationPreviewComponent,
    StateViewComponent,
  ],
})
export class ProfilePage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly tabBar = inject(TabBarService);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly toastCtrl = inject(ToastController);

  private readonly content = viewChild(IonContent);

  readonly status = signal<LoadStatus>('loading');
  readonly loadError = signal({ title: '', message: '' });
  readonly profile = signal<Profile | null>(null);
  readonly initials = computed(() => initials(this.profile()?.business_name));

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly mapOpen = signal(false);
  readonly passwordOpen = signal(false);
  readonly changingPassword = signal(false);

  // El usuario no se edita: el backend no lo acepta en PUT profile
  readonly form = this.fb.nonNullable.group({
    business_name: ['', [Validators.required, Validators.maxLength(255)]],
    contact_name: ['', [Validators.required, Validators.maxLength(255)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    address: ['', Validators.required],
    address_reference: ['', Validators.required],
    latitude: this.fb.control<number | null>(null, Validators.required),
    longitude: this.fb.control<number | null>(null, Validators.required),
  });

  // Mismas reglas que el backend (solo min:8); la confirmación viaja como new_password_confirmation
  readonly passwordForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8), differentFrom('current_password')]],
    new_password_confirmation: ['', [Validators.required, matchControl('new_password')]],
  });

  constructor() {
    addIcons({ checkmarkCircle, chevronForward, keyOutline, locationOutline, logOutOutline, storefrontOutline });

    // Cada validador compara contra otro campo: se revalidan cuando ese campo cambia
    const destroyRef = inject(DestroyRef);
    const { current_password, new_password, new_password_confirmation } = this.passwordForm.controls;
    current_password.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => new_password.updateValueAndValidity({ emitEvent: false }));
    new_password.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => new_password_confirmation.updateValueAndValidity({ emitEvent: false }));

    this.loadProfile();
  }

  // Si se sale de la pestaña (ej. sesión vencida) no debe quedar la barra de pestañas oculta
  ionViewWillLeave(): void {
    this.stopEditing();
  }

  ngOnDestroy(): void {
    this.tabBar.hidden.set(false);
  }

  loadProfile(): void {
    this.status.set('loading');
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.status.set('ready');
        // Sesiones iniciadas antes de guardar el nombre del negocio lo obtienen aquí
        this.auth.saveNames(profile.name, profile.business_name);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(
          err.status === 404
            ? { title: 'Perfil no encontrado', message: 'Tu usuario no tiene un negocio asociado. Contacta al administrador.' }
            : { title: 'No pudimos cargar tu perfil', message: 'Revisa tu conexión e intenta de nuevo.' },
        );
        this.status.set('error');
      },
    });
  }

  errorFor(form: FormGroup, field: ProfileField | PasswordField): string | null {
    const control = form.get(field);
    if (!control?.touched || !control.errors) {
      return null;
    }
    const key = Object.keys(control.errors)[0];
    return ERROR_MESSAGES[field]?.[key] ?? (key === 'maxlength' ? 'Es demasiado largo' : 'Revisa este campo');
  }

  // ---- Edición del perfil ----

  startEditing(): void {
    const profile = this.profile();
    if (!profile) {
      return;
    }
    this.form.reset({
      business_name: profile.business_name,
      contact_name: profile.contact_name,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      address_reference: profile.address_reference ?? '',
      latitude: profile.latitude,
      longitude: profile.longitude,
    });
    this.editing.set(true);
    this.tabBar.hidden.set(true);
    this.content()?.scrollToTop(200);
  }

  async cancelEditing(): Promise<void> {
    if (!this.form.dirty) {
      this.stopEditing();
      return;
    }
    const alert = await this.alertCtrl.create({
      header: '¿Descartar los cambios?',
      message: 'Los datos que modificaste no se guardarán.',
      buttons: [
        { text: 'Seguir editando', role: 'cancel' },
        { text: 'Descartar', role: 'destructive', handler: () => this.stopEditing() },
      ],
    });
    await alert.present();
  }

  onLocationConfirmed({ latitude, longitude }: Coordinates): void {
    this.form.patchValue({ latitude, longitude });
    this.form.markAsDirty();
    this.mapOpen.set(false);
  }

  async save(): Promise<void> {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    const loading = await this.loadingCtrl.create({ message: 'Guardando cambios...' });
    await loading.present();

    const request = this.buildRequest();

    this.profileService.updateProfile(request).subscribe({
      next: async () => {
        await loading.dismiss();
        this.saving.set(false);
        // El backend no devuelve el perfil: se arma con lo que se envió
        this.profile.update((profile) => profile && { ...profile, ...request });
        this.auth.saveNames(request.name, request.business_name);
        this.stopEditing();
        await this.showToast('Perfil actualizado correctamente');
      },
      error: async (err: HttpErrorResponse) => {
        await loading.dismiss();
        this.saving.set(false);
        await this.showFormErrors(err, this.form, (apiField) => API_TO_FIELD[apiField] ?? apiField);
      },
    });
  }

  // ---- Cambio de contraseña ----

  openPasswordSheet(): void {
    this.passwordForm.reset();
    this.passwordOpen.set(true);
  }

  async changePassword(): Promise<void> {
    if (this.changingPassword()) {
      return;
    }
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.changingPassword.set(true);

    const loading = await this.loadingCtrl.create({ message: 'Actualizando contraseña...' });
    await loading.present();

    this.profileService.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: async () => {
        await loading.dismiss();
        this.changingPassword.set(false);
        this.passwordOpen.set(false);
        await this.showToast('Contraseña actualizada correctamente');
      },
      error: async (err: HttpErrorResponse) => {
        await loading.dismiss();
        this.changingPassword.set(false);
        await this.showFormErrors(err, this.passwordForm, (apiField) => apiField);
      },
    });
  }

  // ---- Sesión ----

  async confirmLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Cerrar sesión?',
      message: 'Tendrás que ingresar tu usuario y contraseña para volver a entrar.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Cerrar sesión', role: 'destructive', handler: () => this.logout() },
      ],
    });
    await alert.present();
  }

  private logout(): void {
    this.auth.logoutFromServer().subscribe(() => this.router.navigateByUrl('/login', { replaceUrl: true }));
  }

  private stopEditing(): void {
    this.editing.set(false);
    this.mapOpen.set(false);
    this.tabBar.hidden.set(false);
  }

  private buildRequest(): UpdateProfileRequest {
    const value = this.form.getRawValue();
    const contactName = value.contact_name.trim();
    const digits = value.phone.replace('-', '');

    return {
      name: contactName,
      contact_name: contactName,
      email: value.email.trim(),
      business_name: value.business_name.trim(),
      phone: `${digits.slice(0, 4)}-${digits.slice(4)}`,
      address: value.address.trim(),
      address_reference: value.address_reference.trim() || null,
      latitude: value.latitude!,
      longitude: value.longitude!,
    };
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      icon: 'checkmark-circle',
      cssClass: 'toast-success',
    });
    await toast.present();
  }

  // Los 422 se devuelven a su campo; el resto de errores se explican en una alerta
  private async showFormErrors(err: HttpErrorResponse, form: FormGroup, toField: (apiField: string) => string): Promise<void> {
    let header = 'Error';
    let message = err.error?.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.';

    if (err.status === 422) {
      const errors = (err.error?.errors ?? {}) as Record<string, string[]>;
      const messages: string[] = [];

      for (const [apiField, apiMessages] of Object.entries(errors)) {
        const field = toField(apiField);
        const control = form.get(field);
        if (!control) {
          messages.push(...apiMessages);
          continue;
        }

        // `unique` del correo y la contraseña actual incorrecta son los errores que el formulario no puede prever
        const errorKey =
          field === 'email' && apiMessages.some((m) => m.includes('taken'))
            ? 'taken'
            : field === 'current_password'
              ? 'incorrect'
              : 'server';
        control.setErrors({ [errorKey]: true });
        control.markAsTouched();
        messages.push(ERROR_MESSAGES[field]?.[errorKey] ?? apiMessages.join(' '));
      }

      header = 'Revisa tus datos';
      message = messages.join('\n') || message;
    } else if (err.status === 0) {
      header = 'Sin conexión';
      message = 'No se pudo conectar con el servidor.';
    } else if (err.status === 404) {
      header = 'Perfil no encontrado';
      message = 'Tu usuario no tiene un negocio asociado. Contacta al administrador.';
    }

    const alert = await this.alertCtrl.create({ header, message, buttons: ['Aceptar'] });
    await alert.present();
  }
}
