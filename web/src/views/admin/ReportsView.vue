
<template>
  <div class="reports-page" :aria-busy="loading">
    <!-- Encabezado -->
    <header class="report-header">
      <div class="header-title">
        <span class="eyebrow">REPORTE MENSUAL DE VENTAS</span>
        <h1>{{ nombreMes }} {{ anio }}</h1>
      </div>

      <div class="header-actions">
        <select
          v-model="periodo"
          class="period-select"
          aria-label="Seleccionar mes y año del reporte"
          :disabled="loading"
        >
          <option
            v-for="opcion in periodos"
            :key="opcion.value"
            :value="opcion.value"
          >
            {{ opcion.label }}
          </option>
        </select>

        <button
          class="generate-button"
          type="button"
          :disabled="loading"
          @click="generarReporte"
        >
          <span class="button-icon" aria-hidden="true">↻</span>
          {{ loading ? 'Consultando...' : 'Generar' }}
        </button>
      </div>
    </header>

    <!-- Error devuelto por Laravel o error de conexión -->
    <p v-if="errorMensaje" class="error-message" role="alert">
      {{ errorMensaje }}
    </p>

    <!-- Indicadores principales -->
    <section class="summary-grid">
      <article class="summary-card">
        <span class="card-label">Ventas del mes</span>
        <strong class="summary-value">
          {{ reporte ? formatCurrency(reporte.summary.total_sales) : '—' }}
        </strong>
      </article>

      <article class="summary-card">
        <span class="card-label">Pedidos entregados</span>
        <strong class="summary-value">
          {{ reporte ? reporte.summary.delivered_orders : '—' }}
        </strong>
      </article>
    </section>

    <!-- Productos y clientes -->
    <section class="details-grid">
      <article class="detail-card">
        <h2>Productos más vendidos</h2>

        <div v-if="loading" class="empty-content" role="status">
          Consultando productos...
        </div>

        <div v-else-if="!reporte" class="empty-content">
          Genera el reporte para consultar los productos vendidos.
        </div>

        <div v-else-if="reporte.top_products.length === 0" class="empty-content">
          No hay productos vendidos para este periodo.
        </div>

        <div v-else class="report-list">
          <div
            v-for="(producto, index) in reporte.top_products"
            :key="producto.product_id"
            class="report-row"
          >
            <span class="ranking product-ranking">{{ index + 1 }}</span>
            <strong class="row-name">{{ producto.name }}</strong>
            <span class="row-quantity">
              {{ producto.quantity_sold }} unidades
            </span>
            <strong class="row-amount">
              {{ formatCurrency(producto.revenue) }}
            </strong>
          </div>
        </div>
      </article>

      <article class="detail-card">
        <h2>Clientes que más gastaron</h2>

        <div v-if="loading" class="empty-content" role="status">
          Consultando clientes...
        </div>

        <div v-else-if="!reporte" class="empty-content">
          Genera el reporte para consultar las compras de clientes.
        </div>

        <div v-else-if="reporte.top_clients.length === 0" class="empty-content">
          No hay clientes registrados para este periodo.
        </div>

        <div v-else class="report-list">
          <div
            v-for="(cliente, index) in topClientsBySpending"
            :key="cliente.client_id"
            class="report-row"
          >
            <span class="ranking client-ranking">{{ index + 1 }}</span>

            <strong class="row-name">
              {{
                cliente.business_name ||
                cliente.contact_name ||
                `Cliente #${cliente.client_id}`
              }}
            </strong>

            <span class="row-quantity">
              {{ cliente.orders_count }}
              {{ cliente.orders_count === 1 ? 'pedido' : 'pedidos' }}
            </span>

            <strong class="row-amount">
              {{ formatCurrency(cliente.total_purchased) }}
            </strong>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import axios from 'axios'

import {
  obtenerReporteMensual,
  type ReporteMensual,
} from '../../services/reports'

const meses = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

// El reporte inicia automáticamente en el mes y año actuales.
const fechaActual = new Date()

const periodo = ref(
  `${fechaActual.getFullYear()}-${String(
    fechaActual.getMonth() + 1
  ).padStart(2, '0')}`,
)

// Periodos disponibles desde enero de 2026 hasta diciembre de 2100.
const anioInicial = 2026
const anioFinal = 2100

const periodos = Array.from(
  { length: (anioFinal - anioInicial + 1) * 12 },
  (_, index) => {
    const year = anioInicial + Math.floor(index / 12)
    const month = (index % 12) + 1
    const mes = String(month).padStart(2, '0')

    return {
      value: `${year}-${mes}`,
      label: `${meses[month - 1]} ${year}`,
    }
  },
)

const anio = computed(() => Number(periodo.value.slice(0, 4)))
const mes = computed(() => Number(periodo.value.slice(5, 7)))
const nombreMes = computed(() => meses[mes.value - 1] ?? '')

const reporte = ref<ReporteMensual | null>(null)

// CAMBIO: ordenar clientes por dinero gastado,
// de mayor a menor, sin modificar los datos originales de la API.
const topClientsBySpending = computed(() => {
  return [...(reporte.value?.top_clients ?? [])].sort(
    (a, b) =>
      Number(b.total_purchased) - Number(a.total_purchased)
  )
})

const loading = ref(false)
const errorMensaje = ref('')
let requestId = 0

// Limpiar reporte cuando cambia el periodo.
watch(periodo, () => {
  reporte.value = null
  errorMensaje.value = ''
})

function formatCurrency(value: number | string): string {
  const amount = Number(value)

  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined

    if (data?.message) return data.message

    if (data?.errors) {
      const firstError = Object.values(data.errors).flat()[0]
      if (firstError) return firstError
    }

    if (error.response?.status === 401) {
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.'
    }

    if (error.response?.status === 403) {
      return 'No tienes permiso para consultar los informes.'
    }

    if (error.response?.status === 422) {
      return 'Los parámetros del informe no son válidos.'
    }

    if (!error.response) {
      return 'No se pudo conectar con Laravel. Verifica que el servidor esté iniciado.'
    }

    return `Error al consultar el informe (HTTP ${error.response.status}).`
  }

  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.'
}

async function generarReporte(): Promise<void> {
  const currentRequest = ++requestId

  loading.value = true
  errorMensaje.value = ''
  reporte.value = null

  try {
    // Laravel sigue entregando las cifras agregadas.
    // Se conserva la conexión original con la API.
    const respuesta = await obtenerReporteMensual(
      anio.value,
      mes.value
    )

    if (currentRequest !== requestId) return

    reporte.value = respuesta
  } catch (error) {
    if (currentRequest !== requestId) return

    reporte.value = null
    errorMensaje.value = getErrorMessage(error)
  } finally {
    if (currentRequest === requestId) {
      loading.value = false
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.reports-page {
  width: 100%;
  min-height: calc(100vh - 48px);
  padding: 0;
  background: #f3f5fa;
  color: #162b4d;
  font-family: Arial, Helvetica, sans-serif;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 17px;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.eyebrow {
  color: #435778;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.7px;
}

.header-title h1 {
  margin: 0;
  color: #172b4d;
  font-size: 25px;
  line-height: 1.2;
  font-weight: 800;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.period-select {
  height: 31px;
  min-width: 113px;
  padding: 0 10px;
  border: 1px solid #dce3ed;
  border-radius: 7px;
  background: #ffffff;
  color: #172b4d;
  font-size: 10px;
  font-weight: 700;
  outline: none;
  cursor: pointer;
}

.generate-button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 7px;
  background: #1d355b;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.generate-button:hover:not(:disabled) {
  background: #294b79;
}

.generate-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.button-icon {
  font-size: 15px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin-bottom: 16px;
}

.summary-card {
  min-height: 65px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  border: 1px solid #e1e7ef;
  border-radius: 11px;
  background: #ffffff;
}

.card-label {
  color: #344a6a;
  font-size: 9px;
  font-weight: 600;
}

.summary-value {
  color: #122541;
  font-size: 22px;
  line-height: 1.1;
  font-weight: 800;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.detail-card {
  min-height: 214px;
  padding: 15px 14px;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
  background: #ffffff;
}

.detail-card h2 {
  margin: 0;
  color: #172b4d;
  font-size: 13px;
  line-height: 1.3;
  font-weight: 800;
}

.empty-content {
  min-height: 145px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  color: #8491a5;
  font-size: 10px;
  text-align: center;
}

.report-list {
  display: flex;
  flex-direction: column;
  margin-top: 9px;
}

.report-row {
  display: grid;
  grid-template-columns: 19px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 9px;
  min-height: 32px;
  padding: 3px 0;
}

.ranking {
  width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 750;
}

.product-ranking {
  background: #fff2c4;
  color: #9a7300;
}

.client-ranking {
  background: #e4eaf4;
  color: #31517f;
}

.row-name {
  min-width: 0;
  color: #26364f;
  font-size: 10px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.row-quantity {
  color: #68758a;
  font-size: 9px;
  white-space: nowrap;
}

.row-amount {
  color: #172b4d;
  font-size: 10px;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}

.error-message {
  margin: 0 0 12px;
  padding: 9px 11px;
  border: 1px solid #f0cccc;
  border-radius: 7px;
  background: #fff0f0;
  color: #a12b2b;
  font-size: 11px;
}

@media (max-width: 650px) {
  .report-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .period-select {
    flex: 1;
  }

  .summary-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }

  .report-row {
    grid-template-columns: 19px minmax(0, 1fr) auto;
  }

  .row-amount {
    grid-column: 3;
  }
}
</style>
