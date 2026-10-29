import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertController,
  IonButton,
  IonContent,
  IonFooter,
  IonInput,
  IonInputPasswordToggle,
  IonText,
  LoadingController,
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [ReactiveFormsModule, RouterLink, IonContent, IonFooter, IonInput, IonInputPasswordToggle, IonButton, IonText],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly alertCtrl = inject(AlertController);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Ingresando...' });
    await loading.present();

    this.auth.login(this.form.getRawValue()).subscribe({
      next: async () => {
        await loading.dismiss();
        this.form.reset();
        this.router.navigateByUrl('/tabs/catalog', { replaceUrl: true });
      },
      error: async (err: HttpErrorResponse) => {
        await loading.dismiss();
        await this.showError(err);
      },
    });
  }

  private async showError(err: HttpErrorResponse): Promise<void> {
    let header = 'Error';
    let message = 'Ocurrió un error inesperado. Intenta de nuevo.';

    if (err.status === 401) {
      header = 'Credenciales inválidas';
      message = 'Usuario o contraseña incorrectos.';
    } else if (err.status === 403) {
      header = 'Cuenta desactivada';
      message = err.error?.message ?? 'Tu cuenta está desactivada. Contacta al administrador.';
    } else if (err.status === 422) {
      header = 'Datos inválidos';
      const errors = err.error?.errors as Record<string, string[]> | undefined;
      message = errors ? Object.values(errors).flat().join('\n') : (err.error?.message ?? message);
    } else if (err.status === 0) {
      header = 'Sin conexión';
      message = 'No se pudo conectar con el servidor.';
    }

    const alert = await this.alertCtrl.create({ header, message, buttons: ['Aceptar'] });
    await alert.present();
  }
}
