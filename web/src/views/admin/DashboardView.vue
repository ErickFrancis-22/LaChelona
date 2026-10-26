
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

        <button class="today-button" type="button">
          Hoy <span>▾</span>
        </button>
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
          <p v-if="order.products !== null">{{ order.products }} productos</p>
<p v-else>Pedido registrado</p>
          <div class="order-bottom">
            <strong>${{ order.total.toFixed(2) }}</strong>
          </div>

          <button
            v-if="order.status === 'Pendientes'"
            class="order-button primary"
            type="button"
            @click="changeStatus(order.id, 'Confirmados')"
          >
            Confirmar
          </button>

          <button
            v-else-if="order.status === 'Confirmados'"
            class="order-button blue"
            type="button"
            @click="changeStatus(order.id, 'En camino')"
          >
            Marcar en camino
          </button>

          <button
            v-else-if="order.status === 'En camino'"
            class="order-button green"
            type="button"
            @click="changeStatus(order.id, 'Entregados')"
          >
            Marcar entregado
          </button>

          <span v-else class="completed-label">
            {{ order.status === 'Entregados' ? 'Pedido entregado' : 'Pedido cancelado' }}
          </span>
        </article>

        <p
          v-if="filteredOrders(column.status).length === 0"
          class="empty-column"
        >
          No hay pedidos en este estado.
        </p>
      </section>
    </div>
  </section>
</template>


<script setup lang="ts">
import { computed } from 'vue'

const fechaActual = computed(() =>
  new Intl.DateTimeFormat('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())
)
import { computed, onMounted, ref } from 'vue'

type OrderStatus =
  | 'Pendientes'
  | 'Confirmados'
  | 'En camino'
  | 'Entregados'
  | 'Cancelados'

interface ApiOrder {
  id: number
  client_id?: number
  status: string
  total: number | string
  customer_comment?: string | null
  created_at: string
  client?: {
    business_name?: string
  }
}

interface Order {
  id: number
  business: string
  products: number | null
  total: number
  time: string
  status: OrderStatus
}

const search = ref('')
const orders = ref<Order[]>([])
const loading = ref(true)
const errorMessage = ref('')

const columns: { status: OrderStatus; color: string }[] = [
  { status: 'Pendientes', color: 'yellow' },
  { status: 'Confirmados', color: 'blue-dot' },
  { status: 'En camino', color: 'green-dot' },
  { status: 'Entregados', color: 'gray-dot' },
  { status: 'Cancelados', color: 'red-dot' },
]

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

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function mapOrder(item: ApiOrder): Order {
  return {
    id: item.id,
    business: item.client?.business_name
      ?? (item.client_id ? `Cliente #${item.client_id}` : `Pedido #${item.id}`),
    products: null,
    total: Number(item.total) || 0,
    time: formatTime(item.created_at),
    status: normalizeStatus(item.status),
  }
}

async function loadOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token')

    const response = await fetch('/api/orders', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Tu sesión no está autorizada. Inicia sesión nuevamente.')
      }

      if (response.status === 403) {
        throw new Error('Tu usuario no tiene permiso para consultar estos pedidos.')
      }

      throw new Error(`No se pudieron cargar los pedidos (HTTP ${response.status}).`)
    }

    const result = await response.json()
    const records = Array.isArray(result) ? result : result.data

    if (!Array.isArray(records)) {
      throw new Error('La respuesta de la API no contiene una lista de pedidos válida.')
    }

    orders.value = records.map((item: ApiOrder) => mapOrder(item))
  } catch (error) {
    orders.value = []
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Ocurrió un error al consultar los pedidos.'
  } finally {
    loading.value = false
  }
}

const summaries = computed(() =>
  columns.map((column) => {
    const matching = orders.value.filter(
      (order) => order.status === column.status,
    )

    const amount = matching.reduce((sum, order) => sum + order.total, 0)

    return {
      label: column.status,
      color: column.color,
      count: matching.length,
      caption: `$${amount.toFixed(2)}`,
    }
  }),
)

function filteredOrders(status: OrderStatus) {
  const term = search.value.trim().toLowerCase()

  return orders.value.filter((order) => {
    const matchesStatus = order.status === status
    const matchesSearch =
      !term ||
      order.business.toLowerCase().includes(term) ||
      String(order.id).includes(term)

    return matchesStatus && matchesSearch
  })
}

onMounted(loadOrders)
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
</style>
