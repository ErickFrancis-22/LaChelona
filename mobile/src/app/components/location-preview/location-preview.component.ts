import { Component, ElementRef, OnDestroy, afterNextRender, effect, input, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { PIN_ICON } from '../../utils/map-pin';

const PREVIEW_ZOOM = 16;

// Mapa fijo de solo lectura: muestra el pin sin capturar toques, así no interfiere con el scroll de la página.
// Para mover el pin se abre el location-picker
@Component({
  selector: 'app-location-preview',
  template: '<div #map class="preview-map"></div>',
  styleUrls: ['./location-preview.component.scss'],
})
export class LocationPreviewComponent implements OnDestroy {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();

  private readonly mapElement = viewChild.required<ElementRef<HTMLDivElement>>('map');

  private map?: L.Map;
  private marker?: L.Marker;
  private resizeObserver?: ResizeObserver;

  constructor() {
    afterNextRender(() => this.initMap());

    // Al confirmar otra ubicación en el picker el mapa se centra en el nuevo pin
    effect(() => {
      const position: L.LatLngTuple = [this.latitude(), this.longitude()];
      this.marker?.setLatLng(position);
      this.map?.setView(position, PREVIEW_ZOOM);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private initMap(): void {
    const position: L.LatLngTuple = [this.latitude(), this.longitude()];

    this.map = L.map(this.mapElement().nativeElement, {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView(position, PREVIEW_ZOOM);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.marker = L.marker(position, { icon: PIN_ICON, interactive: false, keyboard: false }).addTo(this.map);

    // La pestaña puede crearse oculta o cambiar de ancho: Leaflet necesita recalcular su tamaño
    this.resizeObserver = new ResizeObserver(() => {
      this.map?.invalidateSize();
      this.map?.setView([this.latitude(), this.longitude()], PREVIEW_ZOOM);
    });
    this.resizeObserver.observe(this.mapElement().nativeElement);
  }
}
