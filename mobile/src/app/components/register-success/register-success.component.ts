import { Component, input, output } from '@angular/core';
import { IonButton, IonContent, IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark } from 'ionicons/icons';

// Pantalla final del registro (TT47)
@Component({
  selector: 'app-register-success',
  templateUrl: './register-success.component.html',
  styleUrls: ['./register-success.component.scss'],
  imports: [IonContent, IonFooter, IonButton, IonIcon],
})
export class RegisterSuccessComponent {
  readonly businessName = input.required<string>();
  readonly username = input.required<string>();

  readonly continue = output<void>();

  constructor() {
    addIcons({ checkmark });
  }
}
