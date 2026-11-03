import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, informationCircle } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { OrderService } from './order.service';
import { isOrderLockedError } from '../utils/order-errors';
import { formatOrderNumber } from '../utils/order-status';

// cancelled: se canceló · locked: ya no estaba PENDING · failed: otro error (ya avisado) · dismissed: el cliente no confirmó
export type CancelResult = 'cancelled' | 'locked' | 'failed' | 'dismissed';

// Cancelación de pedidos con su confirmación y avisos, compartida por "Mis pedidos", el detalle y la edición
@Injectable({ providedIn: 'root' })
export class OrderActionsService {
  private readonly orderService = inject(OrderService);
  private readonly alertCtrl = inject(AlertController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ checkmarkCircle, informationCircle });
  }

  // No se da por hecho que el pedido sigue PENDING: lo decide el backend. Con 'cancelled' o 'locked'
  // quien llama debe volver a consultar el pedido para mostrar su estado real
  async confirmAndCancel(orderId: number, message = 'Esta acción no se puede deshacer.'): Promise<CancelResult> {
    const alert = await this.alertCtrl.create({
      header: `¿Cancelar el pedido ${formatOrderNumber(orderId)}?`,
      message,
      buttons: [
        { text: 'Volver', role: 'cancel' },
        { text: 'Sí, cancelar', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') {
      return 'dismissed';
    }

    const loading = await this.loadingCtrl.create({ message: 'Cancelando pedido...' });
    await loading.present();

    try {
      await firstValueFrom(this.orderService.cancelOrder(orderId));
      await loading.dismiss();
      await this.showToast(`Pedido ${formatOrderNumber(orderId)} cancelado.`, 'checkmark-circle', 'toast-success');
      return 'cancelled';
    } catch (err) {
      await loading.dismiss();
      const error = err as HttpErrorResponse;
      if (isOrderLockedError(error)) {
        await this.notifyLocked('cancelar');
        return 'locked';
      }
      await this.showError(error);
      return 'failed';
    }
  }

  // Aviso informativo cuando el backend rechaza la acción porque el pedido ya no está PENDING
  async notifyLocked(action: 'modificar' | 'cancelar'): Promise<void> {
    await this.showToast(
      `Este pedido ya no se puede ${action} porque cambió de estado. Actualizamos su información.`,
      'information-circle',
      'toast-warning',
      4000,
    );
  }

  private async showError(err: HttpErrorResponse): Promise<void> {
    let header = 'No pudimos cancelar el pedido';
    let message = 'Ocurrió un error inesperado. Intenta de nuevo.';
    if (err.status === 404) {
      header = 'Pedido no encontrado';
      message = 'Este pedido no existe o no pertenece a tu cuenta.';
    } else if (err.status === 0) {
      header = 'Sin conexión';
      message = 'No se pudo conectar con el servidor. Tu pedido no se canceló.';
    }
    const alert = await this.alertCtrl.create({ header, message, buttons: ['Aceptar'] });
    await alert.present();
  }

  private async showToast(message: string, icon: string, cssClass: string, duration = 3000): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration, position: 'top', icon, cssClass });
    await toast.present();
  }
}
