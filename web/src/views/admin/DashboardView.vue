
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

              <!-- El comprobante se integra al final del detalle del pedido. -->
              <div v-if="canShowInvoice(order.status)" class="invoice-action">
                <p
                  v-if="invoiceErrors[order.id]"
                  class="invoice-inline-error"
                  role="alert"
                >
                  {{ invoiceErrors[order.id] }}
                </p>

                <button
                  type="button"
                  class="order-button invoice-button"
                  :disabled="
                    invoiceLoadingOrderId === order.id ||
                    invoiceStates[order.id] === 'checking'
                  "
                  @click="handleInvoice(order.id)"
                >
                  {{ invoiceButtonLabel(order.id) }}
                </button>
              </div>

              <p
                v-else-if="order.status === 'Pendientes' || order.status === 'Cancelados'"
                class="invoice-unavailable"
              >
                El comprobante estará disponible cuando el pedido sea confirmado.
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

    <!-- Ventana para consultar el comprobante oficial de Laravel. -->
    <div
      v-if="invoiceModalOpen && currentInvoice"
      class="invoice-overlay"
      @click.self="closeInvoiceModal"
    >
      <section
        class="invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
      >
        <header class="invoice-modal-header">
          <div>
            <p class="invoice-eyebrow">LA CHELONA APP</p>
            <h3 id="invoice-modal-title">Comprobante interno</h3>
          </div>
          <button
            type="button"
            class="invoice-close-button"
            aria-label="Cerrar comprobante"
            @click="closeInvoiceModal"
          >
            ×
          </button>
        </header>

        <div class="invoice-modal-body">
          <div class="invoice-meta-grid">
            <div class="invoice-meta-item">
              <span>Número de comprobante</span>
              <strong>{{ currentInvoice.invoice_number }}</strong>
            </div>
            <div class="invoice-meta-item">
              <span>Fecha de emisión</span>
              <strong>{{ formatInvoiceDate(currentInvoice.issue_date) }}</strong>
            </div>
            <div class="invoice-meta-item">
              <span>Pedido</span>
              <strong>#{{ currentInvoice.order_id }}</strong>
            </div>
          </div>

          <div class="invoice-client-block">
            <h4>Cliente</h4>
            <strong>
              {{
                currentInvoice.order?.client?.business_name ||
                currentInvoice.order?.client?.contact_name ||
                orderDetail?.client?.business_name ||
                orderDetail?.client?.contact_name ||
                'Cliente no especificado'
              }}
            </strong>
            <p v-if="currentInvoice.order?.client?.contact_name || orderDetail?.client?.contact_name">
              Contacto: {{ currentInvoice.order?.client?.contact_name || orderDetail?.client?.contact_name }}
            </p>
            <p v-if="currentInvoice.order?.client?.phone || orderDetail?.client?.phone">
              Teléfono: {{ currentInvoice.order?.client?.phone || orderDetail?.client?.phone }}
            </p>
            <p v-if="currentInvoice.order?.client?.email || orderDetail?.client?.email">
              Correo: {{ currentInvoice.order?.client?.email || orderDetail?.client?.email }}
            </p>
          </div>

          <div class="invoice-products-section">
            <h4>Productos del comprobante</h4>
            <div class="invoice-table-wrapper">
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in (currentInvoice.order?.details?.length ? currentInvoice.order.details : (orderDetail?.details || []))"
                    :key="item.id"
                  >
                    <td>{{ item.product?.name || `Producto #${item.product_id}` }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatInvoiceCurrency(item.unit_price) }}</td>
                    <td>{{ formatInvoiceCurrency(item.subtotal) }}</td>
                  </tr>
                  <tr
                    v-if="!(currentInvoice.order?.details?.length || orderDetail?.details?.length)"
                  >
                    <td colspan="4" class="invoice-empty-details">
                      Laravel no devolvió los productos del comprobante.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="invoice-total-row">
            <span>Total oficial</span>
            <strong>{{ formatInvoiceCurrency(currentInvoice.total) }}</strong>
          </div>

          <p class="invoice-note">
            Número, fecha y total proporcionados por Laravel.
          </p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'

import {
  generarComprobante,
  obtenerComprobante,
  type Comprobante,
} from '../../services/invoices'

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

type InvoiceState = 'checking' | 'missing' | 'exists' | 'error'
type InvoiceAction = 'generate' | 'view' | null

const invoiceStates = ref<Record<number, InvoiceState>>({})
const invoiceErrors = ref<Record<number, string>>({})
const invoiceLoadingOrderId = ref<number | null>(null)
const invoiceAction = ref<InvoiceAction>(null)
const invoiceModalOpen = ref(false)
const currentInvoice = ref<Comprobante | null>(null)

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

function canShowInvoice(status: OrderStatus): boolean {
  // Laravel no permite generar comprobantes para pedidos pendientes o cancelados.
  return status === 'Confirmados' || status === 'En camino' || status === 'Entregados'
}

function invoiceErrorText(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      message?: string
      errors?: Record<string, string[] | string>
    } | undefined

    if (data?.errors) {
      for (const value of Object.values(data.errors)) {
        const first = Array.isArray(value) ? value[0] : value
        if (typeof first === 'string' && first.trim()) return first
      }
    }

    if (data?.message) return data.message
  }

  return getErrorMessage(error)
}

function isInvoiceMissingError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  const data = error.response?.data as {
    message?: string
    errors?: Record<string, unknown>
  } | undefined
  const fieldErrors = data?.errors ?? {}
  const messages = [data?.message, ...Object.values(fieldErrors).flatMap((value) =>
    Array.isArray(value) ? value : [value],
  )]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  if (status === 404) {
    return messages.includes('comprobante') || messages.includes('invoice')
  }

  if (status === 422) {
    return (
      Object.prototype.hasOwnProperty.call(fieldErrors, 'invoice') ||
      messages.includes('no posee un comprobante') ||
      messages.includes('no tiene un comprobante') ||
      messages.includes('no existe el comprobante') ||
      messages.includes('comprobante no encontrado') ||
      messages.includes('invoice not found') ||
      messages.includes('does not have an invoice')
    )
  }

  return false
}

function isInvoiceAlreadyExistsError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false

  const status = error.response?.status
  if (status !== 409 && status !== 422) return false

  const data = error.response?.data as {
    message?: string
    errors?: Record<string, unknown>
  } | undefined
  const messages = [data?.message, ...Object.values(data?.errors ?? {}).flatMap((value) =>
    Array.isArray(value) ? value : [value],
  )]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  return (
    messages.includes('ya posee un comprobante') ||
    messages.includes('ya tiene un comprobante') ||
    messages.includes('comprobante ya existe') ||
    messages.includes('invoice already exists')
  )
}

function invoiceButtonLabel(orderId: number): string {
  if (invoiceLoadingOrderId.value === orderId) {
    return invoiceAction.value === 'generate'
      ? 'Generando comprobante...'
      : 'Consultando comprobante...'
  }
  if (invoiceStates.value[orderId] === 'checking') return 'Verificando comprobante...'
  if (invoiceStates.value[orderId] === 'exists') return 'Ver comprobante'
  if (invoiceStates.value[orderId] === 'error') return 'Reintentar verificación'
  return 'Generar comprobante'
}

async function checkInvoice(orderId: number): Promise<void> {
  invoiceStates.value[orderId] = 'checking'
  delete invoiceErrors.value[orderId]

  try {
    await obtenerComprobante(orderId)
    invoiceStates.value[orderId] = 'exists'
  } catch (error) {
    if (isInvoiceMissingError(error)) {
      invoiceStates.value[orderId] = 'missing'
    } else {
      invoiceStates.value[orderId] = 'error'
      invoiceErrors.value[orderId] = invoiceErrorText(error)
    }
  }
}

async function handleInvoice(orderId: number): Promise<void> {
  if (invoiceLoadingOrderId.value !== null) return

  const order = orders.value.find((item) => item.id === orderId)
  if (!order || !canShowInvoice(order.status)) return

  const state = invoiceStates.value[orderId]

  // Si no se pudo verificar, volver a consultar GET. No generar a ciegas.
  if (!state || state === 'checking' || state === 'error') {
    await checkInvoice(orderId)
    return
  }

  invoiceLoadingOrderId.value = orderId
  invoiceAction.value = state === 'exists' ? 'view' : 'generate'
  delete invoiceErrors.value[orderId]

  try {
    if (state === 'exists') {
      // Consultar el comprobante ya guardado; GET no genera ni modifica datos.
      currentInvoice.value = await obtenerComprobante(orderId)
      invoiceModalOpen.value = true
      return
    }

    // Si no existe, se ejecuta directamente el POST de generación.
    currentInvoice.value = await generarComprobante(orderId)
    invoiceStates.value[orderId] = 'exists'
    invoiceModalOpen.value = true
  } catch (error) {
    if (isInvoiceAlreadyExistsError(error)) {
      // Evita duplicados: recupera el registro oficial que ya existe.
      try {
        currentInvoice.value = await obtenerComprobante(orderId)
        invoiceStates.value[orderId] = 'exists'
        invoiceModalOpen.value = true
      } catch (queryError) {
        invoiceStates.value[orderId] = 'error'
        invoiceErrors.value[orderId] = invoiceErrorText(queryError)
      }
    } else if (isInvoiceMissingError(error)) {
      invoiceStates.value[orderId] = 'missing'
      invoiceErrors.value[orderId] = 'Todavía no existe un comprobante para este pedido.'
    } else {
      invoiceStates.value[orderId] = 'error'
      invoiceErrors.value[orderId] = invoiceErrorText(error)
    }
  } finally {
    invoiceLoadingOrderId.value = null
    invoiceAction.value = null
  }
}

function closeInvoiceModal(): void {
  invoiceModalOpen.value = false
  currentInvoice.value = null
}

function formatInvoiceCurrency(value: number | string | null | undefined): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'

  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatInvoiceDate(value: string | null | undefined): string {
  if (!value) return '—'

  // Evita que una fecha ISO sin hora cambie al día anterior por la zona horaria.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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

    if (canShowInvoice(orders.value.find((item) => item.id === id)?.status ?? 'Pendientes')) {
      void checkInvoice(id)
    }
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

.invoice-action {
  margin-top: 12px;
  padding-top: 9px;
  border-top: 1px solid #e2e8f0;
}

.order-button.invoice-button {
  margin-top: 4px;
  background: #315d9e;
  color: #fff;
}

.invoice-inline-error {
  margin: 3px 0 7px !important;
  color: #a12b2b !important;
  font-size: 10px !important;
}

.invoice-unavailable {
  margin-top: 11px !important;
  padding-top: 9px;
  border-top: 1px solid #e2e8f0;
  color: #748196 !important;
  font-size: 10px !important;
}

.invoice-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.58);
}

.invoice-modal {
  width: min(760px, 100%);
  max-height: 90vh;
  overflow: auto;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 22px 65px rgba(15, 23, 42, 0.25);
}

.invoice-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-bottom: 1px solid #e7eaf0;
}

.invoice-eyebrow {
  margin: 0 0 5px;
  color: #8995a8;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.invoice-modal-header h3 {
  margin: 0;
  color: #1d2d49;
  font-size: 19px;
}

.invoice-close-button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 7px;
  background: #eef2f7;
  color: #344156;
  font-size: 23px;
  line-height: 1;
  cursor: pointer;
}

.invoice-modal-body {
  padding: 20px 22px;
}

.invoice-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.invoice-meta-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
}

.invoice-meta-item span {
  color: #8490a2;
  font-size: 10px;
}

.invoice-meta-item strong {
  color: #1d2d49;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.invoice-client-block {
  margin-bottom: 18px;
  padding: 13px;
  border-radius: 8px;
  background: #f8fafc;
}

.invoice-client-block h4,
.invoice-products-section h4 {
  margin: 0 0 9px;
  color: #344156;
  font-size: 12px;
}

.invoice-client-block strong {
  color: #1d2d49;
  font-size: 12px;
}

.invoice-client-block p {
  margin: 5px 0 0;
  color: #68758a;
  font-size: 11px;
}

.invoice-table-wrapper {
  overflow-x: auto;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.invoice-table th,
.invoice-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e7eaf0;
  text-align: left;
}

.invoice-table th {
  color: #68758a;
  font-weight: 700;
  white-space: nowrap;
}

.invoice-table td {
  color: #344156;
}

.invoice-empty-details {
  color: #8490a2 !important;
  text-align: center !important;
}

.invoice-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 14px;
  border-radius: 8px;
  background: #f2f5fa;
  color: #344156;
  font-size: 12px;
}

.invoice-total-row strong {
  color: #1d2d49;
  font-size: 18px;
}

.invoice-note {
  margin: 12px 0 0;
  color: #8490a2;
  font-size: 10px;
  text-align: right;
}

@media (max-width: 540px) {
  .invoice-overlay {
    padding: 10px;
  }

  .invoice-modal-header,
  .invoice-modal-body {
    padding: 15px;
  }

  .invoice-meta-grid {
    grid-template-columns: 1fr;
  }
}

</style>