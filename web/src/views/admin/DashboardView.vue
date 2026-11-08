
<template>
  <section class="dashboard">
    <header class="page-heading">
      <div>
        <p class="fecha-actual">{{ fechaActual }}</p>
        <h2>Pedidos del día</h2>
      </div>

      <div class="heading-actions">
        <input
          v-model="search"
          type="search"
          placeholder="Buscar pedido o negocio..."
          aria-label="Buscar pedido o negocio"
        />

        <button class="today-button" type="button" @click="openDatePicker">
          {{ !selectedDate ? 'Todas las fechas' : (selectedDate === todayDate ? 'Hoy' : selectedDate) }}
          <span>▾</span>
        </button>

        <input
          ref="dateInput"
          class="date-picker-hidden"
          type="date"
          :value="selectedDate"
          aria-label="Filtrar pedidos por fecha"
          @change="handleDateChange"
        />

        <select
          v-model="selectedStatus"
          class="status-filter"
          aria-label="Filtrar pedidos por estado"
          @change="loadOrders"
        >
          <option value="">Todos</option>
          <option value="PENDING">Pendientes</option>
          <option value="CONFIRMED">Confirmados</option>
          <option value="IN_TRANSIT">En camino</option>
          <option value="DELIVERED">Entregados</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>
    </header>

    <div class="summary-grid">
      <article
        v-for="item in summaries"
        :key="item.label"
        class="summary-card"
      >
        <div class="summary-label">
          <span class="status-dot" :class="item.color"></span>
          {{ item.label }}
        </div>

        <div class="summary-value">{{ item.count }}</div>
        <span class="summary-caption">{{ item.caption }}</span>
      </article>
    </div>

    <div class="orders-heading">
      <div>
        <h3>Seguimiento de pedidos</h3>
      </div>

      {{ loading ? 'CARGANDO PEDIDOS...' : '' }}
    </div>

    <p v-if="errorMessage" class="api-error" role="alert">
      {{ errorMessage }}
    </p>

    <div class="orders-grid">
      <section
        v-for="column in columns"
        :key="column.status"
        class="order-column"
      >
        <header class="column-heading">
          <div>
            <span class="status-dot" :class="column.color"></span>
            <h4>{{ column.status }}</h4>
          </div>

          <span class="column-count">
            {{ filteredOrders(column.status).length }}
          </span>
        </header>

        <article
          v-for="order in filteredOrders(column.status)"
          :key="order.id"
          class="order-card"
        >
          <div class="order-top">
            <strong>#{{ order.id }}</strong>
            <span>{{ order.time }}</span>
          </div>

          <h5>{{ order.business }}</h5>

          <p v-if="order.products !== null">
            {{ order.products }} productos
          </p>

          <p v-else>Pedido registrado</p>

          <div class="order-bottom">
            <strong>${{ order.total.toFixed(2) }}</strong>
          </div>

          <button
            class="order-button detail"
            type="button"
            :disabled="detailLoading && selectedOrderId === order.id"
            @click="toggleOrderDetail(order.id)"
          >
            {{ selectedOrderId === order.id ? 'Ocultar detalle' : 'Ver detalle' }}
          </button>

          <button
            v-if="order.status === 'Pendientes'"
            class="order-button primary"
            type="button"
            :disabled="processingOrderId === order.id"
            @click="changeStatus(order.id)"
          >
            {{ processingOrderId === order.id ? 'Procesando...' : 'Confirmar' }}
          </button>

          <button
            v-else-if="order.status === 'Confirmados'"
            class="order-button blue"
            type="button"
            :disabled="processingOrderId === order.id"
            @click="changeStatus(order.id)"
          >
            {{ processingOrderId === order.id ? 'Procesando...' : 'Marcar en camino' }}
          </button>

          <button
            v-else-if="order.status === 'En camino'"
            class="order-button green"
            type="button"
            :disabled="processingOrderId === order.id"
            @click="changeStatus(order.id)"
          >
            {{ processingOrderId === order.id ? 'Procesando...' : 'Marcar entregado' }}
          </button>

          <span v-else class="completed-label">
            {{ order.status === 'Entregados' ? 'Pedido entregado' : 'Pedido cancelado' }}
          </span>

          <div
            v-if="selectedOrderId === order.id"
            class="order-detail"
          >
            <p v-if="detailLoading">
              Cargando detalle...
            </p>

            <p v-else-if="detailError" role="alert">
              {{ detailError }}
            </p>

            <template v-else-if="orderDetail">
              <p><strong>Productos del pedido</strong></p>

              <p v-if="!orderDetail.details || orderDetail.details.length === 0">
                Este pedido no tiene productos registrados.
              </p>

              <div
                v-for="item in orderDetail.details || []"
                :key="item.id"
                class="order-detail-item"
              >
                <span>
                  {{ item.product?.name || `Producto #${item.product_id}` }}
                  <br />
                  Cantidad: {{ item.quantity }}
                  × ${{ Number(item.unit_price).toFixed(2) }}
                </span>

                <span>
                  ${{ Number(item.subtotal).toFixed(2) }}
                </span>
              </div>

              <p>
                <strong>Comentario del cliente:</strong>
                {{ orderDetail.customer_comment || 'Sin comentario' }}
              </p>

              <p v-if="orderDetail.delivery_address">
                <strong>Dirección de entrega:</strong>
                {{ orderDetail.delivery_address }}
              </p>

              <p v-if="orderDetail.delivery_reference">
                <strong>Referencia:</strong>
                {{ orderDetail.delivery_reference }}
              </p>
            </template>
          </div>
        </article>

        <p
          v-if="filteredOrders(column.status).length === 0"
          class="empty-column"
        >
          {{ loading ? 'Cargando pedidos...' : 'No hay pedidos en este estado.' }}
        </p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'

import {
  listarPedidos,
  obtenerPedido,
  confirmarPedido,
  marcarPedidoEnTransito,
  marcarPedidoEntregado,
  crearResumenInicial,
  type EstadoPedido,
  type PedidoListado,
  type PedidoDetalle,
  type ResumenPedidos,
} from '../../services/orders'



type OrderStatus =
  | 'Pendientes'
  | 'Confirmados'
  | 'En camino'
  | 'Entregados'
  | 'Cancelados'

interface Order {
  id: number
  business: string
  products: number | null
  total: number
  time: string
  status: OrderStatus
}



function getLocalDate(): string {
  const date = new Date()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const todayDate = getLocalDate()



const selectedDate = ref('')

const selectedStatus = ref<EstadoPedido | ''>('')

const dateInput = ref<HTMLInputElement | null>(null)

const fechaActual = computed(() =>
  new Intl.DateTimeFormat('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date()),
)



const search = ref('')

const orders = ref<Order[]>([])

const summary = ref<ResumenPedidos>(crearResumenInicial())

const loading = ref(true)

const errorMessage = ref('')

const processingOrderId = ref<number | null>(null)



const selectedOrderId = ref<number | null>(null)

const orderDetail = ref<PedidoDetalle | null>(null)

const detailLoading = ref(false)

const detailError = ref('')

let detailRequestId = 0

let listRequestId = 0

let searchTimer: ReturnType<typeof setTimeout> | undefined


const columns: { status: OrderStatus; color: string }[] = [
  { status: 'Pendientes', color: 'yellow' },
  { status: 'Confirmados', color: 'blue-dot' },
  { status: 'En camino', color: 'green-dot' },
  { status: 'Entregados', color: 'gray-dot' },
  { status: 'Cancelados', color: 'red-dot' },
]



const apiStatusByLabel: Record<OrderStatus, EstadoPedido> = {
  Pendientes: 'PENDING',
  Confirmados: 'CONFIRMED',
  'En camino': 'IN_TRANSIT',
  Entregados: 'DELIVERED',
  Cancelados: 'CANCELLED',
}

function normalizeStatus(status: string): OrderStatus {
  const value = status.toLowerCase().trim().replace(/[\s-]+/g, '_')

  const statuses: Record<string, OrderStatus> = {
    pending: 'Pendientes',
    pendiente: 'Pendientes',
    pendientes: 'Pendientes',

    confirmed: 'Confirmados',
    confirmada: 'Confirmados',
    confirmado: 'Confirmados',
    confirmados: 'Confirmados',

    in_transit: 'En camino',
    intransit: 'En camino',
    shipped: 'En camino',
    en_camino: 'En camino',
    en_transito: 'En camino',

    delivered: 'Entregados',
    entregado: 'Entregados',
    entregados: 'Entregados',

    cancelled: 'Cancelados',
    canceled: 'Cancelados',
    cancelado: 'Cancelados',
    cancelados: 'Cancelados',
  }

  return statuses[value] ?? 'Pendientes'
}



function formatTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}



function mapOrder(item: PedidoListado): Order {
  return {
    id: item.id,

    business:
      item.client?.business_name ||
      item.client?.contact_name ||
      (item.client?.id
        ? `Cliente #${item.client.id}`
        : `Pedido #${item.id}`),

    products: Number.isFinite(Number(item.products_count))
      ? Number(item.products_count)
      : null,

    total: Number(item.total) || 0,

    time: formatTime(item.created_at),

    status: normalizeStatus(item.status),
  }
}



function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          message?: string
          errors?: Record<string, string[]>
        }
      | undefined

    if (responseData?.message) {
      return responseData.message
    }

    if (responseData?.errors) {
      const firstError = Object.values(responseData.errors).flat()[0]

      if (firstError) {
        return firstError
      }
    }

    if (error.response?.status === 401) {
      return 'Tu sesión no está autorizada. Inicia sesión nuevamente.'
    }

    if (error.response?.status === 403) {
      return 'Tu usuario no tiene permiso para realizar esta operación.'
    }

    if (error.response?.status === 422) {
      return 'Laravel rechazó la operación. Revisa las condiciones del pedido.'
    }

    if (!error.response) {
      return 'No se pudo conectar con Laravel. Verifica que el servidor esté iniciado.'
    }

    return `No se pudo completar la solicitud (HTTP ${error.response.status}).`
  }

  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.'
}



async function loadOrders(): Promise<void> {
  const requestId = ++listRequestId

  loading.value = true

  errorMessage.value = ''

  try {
    const response = await listarPedidos({
      date: selectedDate.value || undefined,

      status: selectedStatus.value || undefined,

      search: search.value.trim() || undefined,
    })

    if (requestId !== listRequestId) {
      return
    }

    if (!Array.isArray(response.data)) {
      throw new Error(
        'La respuesta de Laravel no contiene una lista de pedidos válida.',
      )
    }

    // Listado real de Laravel.
    orders.value = response.data.map(mapOrder)

    // Resumen enviado por Laravel.
    summary.value = {
      ...crearResumenInicial(),
      ...(response.summary || {}),
    }
  } catch (error) {
    if (requestId !== listRequestId) {
      return
    }

    orders.value = []

    summary.value = crearResumenInicial()

    errorMessage.value = getErrorMessage(error)
  } finally {
    if (requestId === listRequestId) {
      loading.value = false
    }
  }
}



const summaries = computed(() =>
  columns.map((column) => {
    const status = apiStatusByLabel[column.status]

    const amount = orders.value
      .filter((order) => order.status === column.status)
      .reduce((sum, order) => sum + order.total, 0)

    return {
      label: column.status,

      color: column.color,

      count: Number(summary.value[status] || 0),

      caption: `$${amount.toFixed(2)}`,
    }
  }),
)



function filteredOrders(status: OrderStatus): Order[] {
  return orders.value.filter(
    (order) => order.status === status,
  )
}



function openDatePicker(): void {
  const input = dateInput.value

  if (!input) return

  if (typeof input.showPicker === 'function') {
    input.showPicker()
  } else {
    input.click()
  }
}

function handleDateChange(event: Event): void {
  const target = event.target as HTMLInputElement

  selectedDate.value = target.value

  void loadOrders()
}



watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    void loadOrders()
  }, 350)
})



async function toggleOrderDetail(id: number): Promise<void> {
  if (selectedOrderId.value === id) {
    selectedOrderId.value = null

    orderDetail.value = null

    detailError.value = ''

    detailRequestId++

    detailLoading.value = false

    return
  }

  selectedOrderId.value = id

  orderDetail.value = null

  detailError.value = ''

  detailLoading.value = true

  const requestId = ++detailRequestId

  try {
    const detail = await obtenerPedido(id)

    if (
      requestId !== detailRequestId ||
      selectedOrderId.value !== id
    ) {
      return
    }

    if (!detail || typeof detail.id !== 'number') {
      throw new Error(
        'Laravel no devolvió el detalle del pedido.',
      )
    }

    orderDetail.value = detail
  } catch (error) {
    if (
      requestId !== detailRequestId ||
      selectedOrderId.value !== id
    ) {
      return
    }

    detailError.value = getErrorMessage(error)
  } finally {
    if (requestId === detailRequestId) {
      detailLoading.value = false
    }
  }
}



async function changeStatus(orderId: number): Promise<void> {
  if (processingOrderId.value !== null) {
    return
  }

  const order = orders.value.find(
    (item) => item.id === orderId,
  )

  if (!order) return

  // Solo pedir confirmación antes de descontar inventario.
  if (order.status === 'Pendientes') {
    const accepted = window.confirm(
      '¿Confirmas este pedido? Laravel validará el stock y realizará el descuento de inventario.',
    )

    if (!accepted) return
  }

  processingOrderId.value = orderId

  errorMessage.value = ''

  try {
    // PENDING -> CONFIRMED
    if (order.status === 'Pendientes') {
      await confirmarPedido(orderId)
    }

    // CONFIRMED -> IN_TRANSIT
    else if (order.status === 'Confirmados') {
      await marcarPedidoEnTransito(orderId)
    }

    // IN_TRANSIT -> DELIVERED
    else if (order.status === 'En camino') {
      await marcarPedidoEntregado(orderId)
    }

    // No permitir otras transiciones desde Vue.
    else {
      return
    }

    // Laravel confirma la operación.
    // Se vuelve a consultar el listado real.
    await loadOrders()

    // Si el detalle estaba abierto, actualizarlo también.
    if (selectedOrderId.value === orderId) {
      await toggleOrderDetail(orderId)
    }
  } catch (error) {
    // No se modifica el estado local.
    // Se conserva la información anterior si Laravel rechaza.
    errorMessage.value = getErrorMessage(error)
  } finally {
    processingOrderId.value = null
  }
}



onMounted(() => {
  void loadOrders()
})

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
})
</script>

<style scoped>
.dashboard {
  color: #202b3c;
  min-width: 0;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.eyebrow {
  color: #8995a8;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.page-heading h2 {
  margin: 6px 0;
  font-size: 26px;
  font-weight: 750;
}

.page-heading p,
.orders-heading p {
  color: #8490a2;
  font-size: 12px;
  margin: 0;
}

.heading-actions {
  display: flex;
  gap: 10px;
}

.heading-actions input {
  width: 230px;
  max-width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e7ef;
  border-radius: 8px;
  outline: none;
  background: white;
  font: inherit;
  font-size: 12px;
}

.heading-actions input:focus {
  border-color: #f3b800;
}

.today-button {
  padding: 9px 13px;
  border: 1px solid #e2e7ef;
  border-radius: 8px;
  background: white;
  color: #344156;
  font-size: 12px;
}

.today-button span {
  margin-left: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 30px;
}

.summary-card {
  padding: 17px;
  background: white;
  border: 1px solid #e7eaf0;
  border-radius: 11px;
  min-width: 0;
}

.summary-label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #68758a;
  font-size: 11px;
  font-weight: 600;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.yellow {
  background: #efb600;
}

.blue-dot {
  background: #3768b4;
}

.green-dot {
  background: #24976b;
}

.gray-dot {
  background: #8a95a6;
}

.red-dot {
  background: #d64b4b;
}

.summary-value {
  margin: 13px 0 3px;
  font-size: 28px;
  font-weight: 750;
  color: #1d2d49;
}

.summary-caption {
  color: #8490a2;
  font-size: 11px;
}

.orders-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.orders-heading h3 {
  font-size: 17px;
  margin: 0 0 6px;
}

.demo-label {
  color: #936800;
  background: #fff4d1;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.4px;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.order-column {
  min-width: 0;
  padding: 10px;
  background: #e9edf5;
  border-radius: 10px;
}

.column-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  margin-bottom: 12px;
}

.column-heading > div {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.column-heading h4 {
  margin: 0;
  font-size: 10px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.column-count {
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: white;
  border-radius: 6px;
  color: #5d6a7e;
  font-size: 10px;
}

.order-card {
  padding: 12px 10px;
  margin-bottom: 10px;
  background: white;
  border: 1px solid #e4e8ef;
  border-radius: 9px;
  box-shadow: 0 2px 5px #1b2d4810;
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
}

.order-top strong {
  font-size: 10px;
  color: #1d2d49;
}

.order-top span {
  color: #8792a3;
  font-size: 9px;
}

.order-card h5 {
  margin: 12px 0 5px;
  font-size: 11px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.order-card p {
  margin: 0;
  color: #8792a3;
  font-size: 10px;
}

.order-bottom {
  margin-top: 12px;
  font-size: 12px;
}

.order-button {
  width: 100%;
  margin-top: 11px;
  padding: 9px 5px;
  border: none;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.order-button.primary {
  background: #ffc400;
  color: #263248;
}

.order-button.blue {
  background: #315d9e;
  color: white;
}

.order-button.green {
  background: #21684d;
  color: white;
}

.order-button:hover {
  filter: brightness(0.95);
}

.completed-label {
  display: block;
  margin-top: 12px;
  color: #66758a;
  font-size: 10px;
}

.empty-column {
  color: #8792a3;
  font-size: 10px;
  line-height: 1.5;
  text-align: center;
  padding: 8px 0;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .orders-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .heading-actions input {
    flex: 1;
    min-width: 0;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .orders-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .orders-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 440px) {
  .orders-grid {
    grid-template-columns: 1fr;
  }

  .page-heading h2 {
    font-size: 22px;
  }
}

/* Elementos funcionales para la conexión con Laravel */

.status-filter {
  padding: 9px 13px;
  border: 1px solid #e2e7ef;
  border-radius: 8px;
  background: white;
  color: #344156;
  font-size: 12px;
}

.heading-actions .date-picker-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
}

.api-error {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 7px;
  background: #fff0f0;
  color: #a12b2b;
  font-size: 12px;
}

.order-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.order-button.detail {
  background: #eef2f7;
  color: #344156;
}

.order-detail {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #e4e8ef;
  border-radius: 7px;
  background: #f8fafc;
}

.order-detail p {
  margin: 5px 0;
  color: #526176;
  font-size: 10px;
  line-height: 1.5;
}

.order-detail-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid #e4e8ef;
  color: #344156;
  font-size: 10px;
}

.order-detail-item:last-child {
  border-bottom: 0;
}

.order-detail-item span:last-child {
  white-space: nowrap;
  text-align: right;
}

@media (max-width: 760px) {
  .status-filter {
    flex: 1;
    min-width: 0;
  }
}
</style>
