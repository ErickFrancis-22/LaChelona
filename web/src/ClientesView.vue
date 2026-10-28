<script setup lang="ts">
import { computed, ref } from 'vue'

const busqueda = ref('')
const filtroActivo = ref<'todos' | 'activos' | 'inactivos'>('todos')
const periodo = ref('3')

interface Cliente {
  id: number
  nombre: string
  direccion: string
  referencia: string
  contacto: string
  telefono: string
  correo: string
  activo: boolean
}

const clientes = ref<Cliente[]>([])
const clienteSeleccionado = ref<number | null>(null)

const clientesFiltrados = computed(() => {
  const texto = busqueda.value.toLowerCase().trim()

  return clientes.value.filter((cliente) => {
    const coincideTexto =
      cliente.nombre.toLowerCase().includes(texto) ||
      cliente.contacto.toLowerCase().includes(texto)

    const coincideEstado =
      filtroActivo.value === 'todos' ||
      (filtroActivo.value === 'activos' && cliente.activo) ||
      (filtroActivo.value === 'inactivos' && !cliente.activo)

    return coincideTexto && coincideEstado
  })
})

const totalActivos = computed(
  () => clientes.value.filter((cliente) => cliente.activo).length,
)

const totalInactivos = computed(
  () => clientes.value.filter((cliente) => !cliente.activo).length,
)

const clienteActual = computed(
  () =>
    clientes.value.find(
      (cliente) => cliente.id === clienteSeleccionado.value,
    ) ?? null,
)

function limpiarFiltros() {
  busqueda.value = ''
  filtroActivo.value = 'todos'
  clienteSeleccionado.value = null
}
</script>

<template>
  <main class="clients-page">
    <header class="page-header">
      <div class="eyebrow">NEGOCIOS REGISTRADOS</div>
      <h1>Clientes</h1>
    </header>

    <div class="clients-layout">
      <!-- LISTA DE CLIENTES -->
      <section class="clients-list card">
        <div class="search-box">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input
            v-model="busqueda"
            type="search"
            placeholder="Negocio o contacto"
            aria-label="Buscar negocio o contacto"
          />
        </div>

        <div class="filter-tabs">
          <button
            type="button"
            :class="{ selected: filtroActivo === 'todos' }"
            @click="filtroActivo = 'todos'; clienteSeleccionado = null"
          >
            Todos · {{ clientes.length }}
          </button>

          <button
            type="button"
            :class="{ selected: filtroActivo === 'activos' }"
            @click="filtroActivo = 'activos'; clienteSeleccionado = null"
          >
            Activos · {{ totalActivos }}
          </button>

          <button
            type="button"
            :class="{ selected: filtroActivo === 'inactivos' }"
            @click="filtroActivo = 'inactivos'; clienteSeleccionado = null"
          >
            Inactivos · {{ totalInactivos }}
          </button>
        </div>

        <div
          v-if="clientesFiltrados.length === 0"
          class="empty-clients"
        >
          <div class="empty-search-icon">⌕</div>
          <h2>No se encontraron clientes</h2>
          <p>
            Los clientes aparecerán aquí cuando
            <br class="desktop-break" />
            se carguen desde la base de datos.
          </p>

          <button
            v-if="busqueda || filtroActivo !== 'todos'"
            type="button"
            class="secondary-button"
            @click="limpiarFiltros"
          >
            Limpiar filtros
          </button>
        </div>

        <button
          v-for="cliente in clientesFiltrados"
          :key="cliente.id"
          type="button"
          class="client-row"
          :class="{
            'client-row-selected': clienteSeleccionado === cliente.id,
          }"
          @click="clienteSeleccionado = cliente.id"
        >
          <span class="client-avatar">
            {{ cliente.nombre.slice(0, 2).toUpperCase() }}
          </span>

          <span class="client-row-info">
            <strong>{{ cliente.nombre }}</strong>
            <small>{{ cliente.direccion || 'Dirección no registrada' }}</small>
          </span>

          <span
            class="client-status"
            :class="cliente.activo ? 'status-active' : 'status-inactive'"
          >
            {{ cliente.activo ? 'Activo' : 'Inactivo' }}
          </span>
        </button>
      </section>

      <!-- DETALLES DEL CLIENTE -->
      <div class="client-details-column">
        <section class="client-details card">
          <div class="details-heading">
            <div class="details-title">
              <template v-if="clienteActual">
                <h2>{{ clienteActual.nombre }}</h2>
                <p>{{ clienteActual.direccion }}</p>
              </template>

              <template v-else>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-subtitle"></div>
              </template>
            </div>

            <span class="account-status">
              <span
                class="status-dot"
                :class="{
                  'status-active-dot': clienteActual?.activo,
                  'status-inactive-dot':
                    clienteActual && !clienteActual.activo,
                }"
              ></span>
              {{ clienteActual
                ? clienteActual.activo ? 'Activo' : 'Inactivo'
                : 'Cuenta' }}
            </span>
          </div>

          <div class="delivery-panel">
            <h3>
              <span class="location-icon">♧</span>
              DIRECCIÓN DE ENTREGA
            </h3>

            <template v-if="clienteActual">
              <p class="detail-value">
                {{ clienteActual.direccion || 'Sin dirección registrada' }}
              </p>

              <div class="reference-line">
                <span>Referencia:</span>
                <span>
                  {{ clienteActual.referencia || 'Sin referencia' }}
                </span>
              </div>
            </template>

            <template v-else>
              <div class="skeleton address-skeleton"></div>

              <div class="reference-line">
                <span>Referencia:</span>
                <div class="skeleton reference-skeleton"></div>
              </div>
            </template>

            <div class="map-placeholder">
              <span class="map-pin">●</span>
              <span>MAPA DE UBICACIÓN</span>
            </div>
          </div>

          <div class="contact-grid">
            <div class="contact-field">
              <span>Contacto</span>
              <strong v-if="clienteActual">
                {{ clienteActual.contacto || 'No registrado' }}
              </strong>
              <div v-else class="skeleton contact-skeleton"></div>
            </div>

            <div class="contact-field">
              <span>Teléfono</span>
              <strong v-if="clienteActual">
                {{ clienteActual.telefono || 'No registrado' }}
              </strong>
              <div v-else class="skeleton phone-skeleton"></div>
            </div>

            <div class="contact-field email-field">
              <span>Correo</span>
              <strong v-if="clienteActual">
                {{ clienteActual.correo || 'No registrado' }}
              </strong>
              <div v-else class="skeleton email-skeleton"></div>
            </div>
          </div>
        </section>

        <!-- HISTORIAL DE PEDIDOS -->
        <section class="order-history card">
          <div class="history-header">
            <h2>Historial de pedidos</h2>

            <select v-model="periodo" aria-label="Período del historial">
              <option value="1">Último mes</option>
              <option value="3">Últimos 3 meses</option>
              <option value="6">Últimos 6 meses</option>
              <option value="12">Último año</option>
            </select>
          </div>

          <div class="empty-history">
            <div class="history-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <rect x="5" y="3" width="14" height="18" rx="1" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>

            <h3>Sin pedidos registrados</h3>
            <p>El historial aparecerá cuando existan pedidos.</p>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.clients-page {
  min-height: 100vh;
  padding: 25px 26px 32px;
  background: #f1f4fa;
  color: #10284b;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
}

.eyebrow {
  margin-bottom: 6px;
  color: #526b8f;
  font-size: 10px;
  letter-spacing: 0.5px;
}

.page-header h1 {
  margin: 0;
  color: #10284b;
  font-size: 29px;
  font-weight: 750;
  letter-spacing: -0.7px;
}

.clients-layout {
  display: grid;
  grid-template-columns: minmax(275px, 0.74fr) minmax(0, 1.65fr);
  align-items: start;
  gap: 13px;
  width: 100%;
}

.card {
  min-width: 0;
  border: 1px solid #dce5f1;
  border-radius: 12px;
  background: #fff;
}

.clients-list {
  min-height: 515px;
  padding: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 39px;
  padding: 0 12px;
  border: 1px solid #d6e1ef;
  border-radius: 8px;
  background: #fff;
}

.search-icon {
  color: #647e9f;
  font-size: 21px;
  line-height: 1;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: #142f53;
  background: transparent;
  font-size: 12px;
}

.search-box input::placeholder {
  color: #7487a2;
}

.filter-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
  margin-top: 10px;
  padding: 3px;
  border-radius: 8px;
  background: #edf1f6;
}

.filter-tabs button {
  min-width: 0;
  min-height: 32px;
  padding: 5px 2px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #506783;
  background: transparent;
  font-size: 10px;
  white-space: nowrap;
  cursor: pointer;
}

.filter-tabs button.selected {
  border-color: #dce5f1;
  color: #10284b;
  background: #fff;
  font-weight: 700;
}

.empty-clients {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 380px;
  padding: 25px 5px;
  text-align: center;
}

.empty-search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55px;
  height: 55px;
  margin-bottom: 14px;
  border-radius: 50%;
  color: #718bac;
  background: #f0f5fc;
  font-size: 36px;
}

.empty-clients h2 {
  margin: 0 0 7px;
  color: #10284b;
  font-size: 15px;
}

.empty-clients p {
  margin: 0;
  color: #607795;
  font-size: 12px;
  line-height: 1.65;
}

.secondary-button {
  margin-top: 16px;
  padding: 9px 14px;
  border: 1px solid #d2dfef;
  border-radius: 7px;
  color: #1c3b63;
  background: #fff;
  font-size: 11px;
  cursor: pointer;
}

.client-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 6px;
  padding: 9px 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.client-row-selected {
  border-color: #9aacc6;
  background: #f0f4fa;
}

.client-avatar {
  display: flex;
  flex: 0 0 29px;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  border-radius: 7px;
  color: #385372;
  background: #e6ecf5;
  font-size: 10px;
  font-weight: 700;
}

.client-row-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.client-row-info strong,
.client-row-info small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-row-info strong {
  color: #142d4d;
  font-size: 11px;
}

.client-row-info small {
  color: #73839a;
  font-size: 9px;
}

.client-status {
  font-size: 9px;
  font-weight: 700;
}

.status-active {
  color: #207653;
}

.status-inactive {
  color: #b45a38;
}

.client-details-column {
  display: flex;
  flex-direction: column;
  gap: 13px;
  min-width: 0;
}

.client-details {
  padding: 16px;
}

.details-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 17px;
}

.details-title {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding-top: 2px;
}

.details-title h2 {
  margin: 0;
  color: #142d4d;
  font-size: 16px;
}

.details-title p {
  margin: 0;
  color: #74849a;
  font-size: 11px;
}

.skeleton {
  border-radius: 5px;
  background: #e1e7f0;
}

.skeleton-title {
  width: 190px;
  max-width: 65%;
  height: 16px;
}

.skeleton-subtitle {
  width: 220px;
  max-width: 80%;
  height: 9px;
}

.account-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 9px 11px;
  border-radius: 7px;
  color: #526b85;
  background: #edf1f5;
  font-size: 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a9b7c8;
}

.status-active-dot {
  background: #27845a;
}

.status-inactive-dot {
  background: #c64a43;
}

.delivery-panel {
  padding: 14px 12px 12px;
  border: 1px solid #ffdc81;
  border-radius: 10px;
  background: #fff9e7;
}

.delivery-panel h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: #a36d00;
  font-size: 10px;
  font-weight: 750;
}

.location-icon {
  font-size: 15px;
}

.detail-value {
  margin: 0 0 12px;
  color: #526783;
  font-size: 11px;
}

.address-skeleton {
  width: 78%;
  height: 11px;
  margin-bottom: 10px;
}

.reference-line {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: #75849a;
  font-size: 9px;
}

.reference-skeleton {
  width: 145px;
  max-width: 60%;
  height: 10px;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 130px;
  border: 1px dashed #efbd45;
  border-radius: 8px;
  color: #6f7f98;
  background: #fff2c9;
  font-size: 10px;
}

.map-pin {
  font-size: 25px;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px 20px;
  margin-top: 19px;
}

.contact-field {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: #75849b;
  font-size: 9px;
}

.contact-field strong {
  overflow-wrap: anywhere;
  color: #526783;
  font-size: 11px;
  font-weight: 500;
}

.contact-skeleton {
  width: 105px;
  max-width: 100%;
  height: 12px;
}

.phone-skeleton {
  width: 95px;
  max-width: 100%;
  height: 12px;
}

.email-field {
  grid-column: 1 / -1;
}

.email-skeleton {
  width: 200px;
  max-width: 100%;
  height: 12px;
}

.order-history {
  min-height: 225px;
  padding: 15px 16px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-header h2 {
  margin: 0;
  color: #10284b;
  font-size: 15px;
}

.history-header select {
  max-width: 160px;
  min-height: 35px;
  padding: 0 10px;
  border: 1px solid #d5e0ee;
  border-radius: 7px;
  color: #183556;
  background: #fff;
  font-size: 11px;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 145px;
  padding: 15px 0 8px;
  text-align: center;
}

.history-icon {
  width: 35px;
  height: 35px;
  margin-bottom: 9px;
  color: #7790b2;
}

.history-icon svg {
  width: 100%;
  height: 100%;
}

.empty-history h3 {
  margin: 0 0 7px;
  color: #536e91;
  font-size: 12px;
  font-weight: 500;
}

.empty-history p {
  margin: 0;
  color: #8493a8;
  font-size: 10px;
}

@media (min-width: 1500px) {
  .clients-page {
    padding: 30px 28px;
  }

  .clients-layout {
    grid-template-columns: minmax(320px, 0.74fr) minmax(0, 1.65fr);
    gap: 16px;
  }

  .clients-list {
    padding: 14px;
  }

  .client-details {
    padding: 20px;
  }

  .delivery-panel {
    padding: 16px;
  }

  .map-placeholder {
    min-height: 150px;
  }

  .order-history {
    min-height: 240px;
    padding: 19px 20px;
  }
}

@media (max-width: 900px) {
  .clients-page {
    padding: 20px 16px;
  }

  .clients-layout {
    grid-template-columns: minmax(225px, 0.8fr) minmax(0, 1.4fr);
    gap: 10px;
  }

  .client-details {
    padding: 12px;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }

  .email-field {
    grid-column: auto;
  }

  .map-placeholder {
    min-height: 110px;
  }
}

@media (max-width: 620px) {
  .clients-page {
    padding: 22px 14px 28px;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .page-header h1 {
    font-size: 27px;
  }

  .clients-layout {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .clients-list,
  .client-details-column {
    width: 100%;
  }

  .clients-list {
    min-height: 270px;
    padding: 12px;
  }

  .empty-clients {
    min-height: 195px;
  }

  .client-details {
    padding: 13px;
  }

  .details-heading {
    gap: 8px;
  }

  .skeleton-title {
    width: 150px;
  }

  .skeleton-subtitle {
    width: 175px;
  }

  .delivery-panel {
    padding: 13px 10px 10px;
  }

  .address-skeleton {
    width: 95%;
  }

  .map-placeholder {
    min-height: 110px;
  }

  .contact-grid {
    grid-template-columns: 1fr 1fr;
    gap: 14px 8px;
  }

  .contact-field {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .email-field {
    grid-column: 1 / -1;
  }

  .order-history {
    min-height: 205px;
    padding: 14px 12px;
  }

  .history-header h2 {
    font-size: 14px;
  }

  .history-header select {
    max-width: 135px;
    min-height: 33px;
    font-size: 10px;
  }

  .empty-history {
    min-height: 135px;
  }
}

@media (max-width: 380px) {
  .clients-page {
    padding-right: 10px;
    padding-left: 10px;
  }

  .filter-tabs button {
    font-size: 9px;
  }

  .account-status {
    padding: 7px;
    font-size: 9px;
  }
}
</style>