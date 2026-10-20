import { Component, input } from '@angular/core';
import { IonSkeletonText } from '@ionic/angular';

@Component({
  selector: 'app-skeleton-card',
  templateUrl: './skeleton-card.component.html',
  styleUrls: ['./skeleton-card.component.scss'],
  imports: [IonSkeletonText],
})
export class SkeletonCardComponent {
  readonly variant = input<'category' | 'product'>('category');
}
