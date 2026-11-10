
<template>
  <section class="reports-page">

    <!-- ENCABEZADO -->
    <header class="report-header">
      <div>
        <p class="eyebrow">REPORTE MENSUAL DE VENTAS</p>
        <h1>{{ monthName }} {{ selectedYear }}</h1>
      </div>

      <div class="report-filters">
        <select
          v-model.number="selectedMonth"
          aria-label="Seleccionar mes"
          @change="loadReport"
        >
          <option
            v-for="month in months"
            :key="month.value"
            :value="month.value"
          >
            {{ month.label }} {{ selectedYear }}
          </option>
        </select>

        <select
          v-model.number="selectedYear"
          aria-label="Seleccionar año"
          @change="loadReport"
        >
          <option
            v-for="year in years"
            :key="year"
            :value="year"
          >
            {{ year }}
          </option>
        </select>
      </div>
    </header>

    <!-- CARGANDO -->
    <div
      v-if="loading"
      class="report-message loading-message"
    >
      <span class="loader"></span>
      <p>Consultando informe mensual...</p>
    </div>

    <!-- ERROR -->
    <div
      v-else-if="errorMessage"
      class="report-message error-message"
      role="alert"
    >
      <strong>No se pudo cargar el informe</strong>
      <p>{{ errorMessage }}</p>

      <button
        type="button"
        class="retry-button"
        @click="loadReport"
      >
        Intentar nuevamente
      </button>
    </div>

    <!-- INFORMACIÓN DEL REPORTE -->
    <template v-else-if="report">

      <!-- RESUMEN -->
      <div class="summary-grid">

        <article class="summary-card">
          <span class="summary-label">Ventas del mes</span>

          <strong class="summary-value">
            {{ formatCurrency(report.summary.total_sales) }}
          </strong>
        </article>

        <article class="summary-card">
          <span class="summary-label">Pedidos entregados</span>

          <strong class="summary-value">
            {{ report.summary.delivered_orders }}
          </strong>
        </article>

      </div>

      <!-- ESTADO VACÍO GENERAL -->
      <div
        v-if="noReportData"
        class="empty-report"
      >
        <h3>Sin información para este periodo</h3>
        <p>
          No existen pedidos entregados registrados para
          {{ monthName }} {{ selectedYear }}.
        </p>
      </div>

      <!-- TABLAS -->
      <div class="report-grid">

        <!-- PRODUCTOS MÁS VENDIDOS -->
        <section class="report-card">
          <header class="card-heading">
            <h2>Productos más vendidos</h2>
          </header>

          <div
            v-if="report.top_products.length === 0"
            class="empty-table"
          >
            No hay productos vendidos en este periodo.
          </div>

          <div v-else class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Ingresos</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(product, index) in report.top_products"
                  :key="product.product_id"
                >
                  <td>
                    <div class="product-cell">
                      <span class="ranking product-ranking">
                        {{ index + 1 }}
                      </span>

                      <div class="item-information">
                        <strong>{{ product.name }}</strong>

                        <small v-if="product.code">
                          Código: {{ product.code }}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td class="quantity-cell">
                    {{ product.quantity_sold }}
                  </td>

                  <td class="amount-cell">
                    {{ formatCurrency(product.revenue) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- CLIENTES CON MÁS COMPRAS -->
        <section class="report-card">
          <header class="card-heading">
            <h2>Clientes con más compras</h2>
          </header>

          <div
            v-if="report.top_clients.length === 0"
            class="empty-table"
          >
            No hay clientes registrados para este periodo.
          </div>

          <div v-else class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Pedidos</th>
                  <th>Importe comprado</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(client, index) in report.top_clients"
                  :key="client.client_id"
                >
                  <td>
                    <div class="product-cell">
                      <span class="ranking client-ranking">
                        {{ index + 1 }}
                      </span>

                      <div class="item-information">
                        <strong>
                          {{
                            client.business_name ||
                            client.contact_name ||
                            `Cliente #${client.client_id}`
                          }}
                        </strong>

                        <small v-if="client.business_name && client.contact_name">
                          {{ client.contact_name }}
                        </small>
                      </div>
                    </div>
                  </td>

                  <td class="quantity-cell">
                    {{ client.orders_count }}
                  </td>

                  <td class="amount-cell">
                    {{ formatCurrency(client.total_purchased) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </template>

  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'

import {
  obtenerReporteMensual,
  type ReporteMensual,
} from '../../services/reports'


const months = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]



const currentDate = new Date()

const selectedMonth = ref(currentDate.getMonth() + 1)

const selectedYear = ref(currentDate.getFullYear())

// Laravel acepta años entre 2000 y 2100.
const years = Array.from(
  { length: 101 },
  (_, index) => 2000 + index,
)

const monthName = computed(() => {
  return months.find(
    (month) => month.value === selectedMonth.value,
  )?.label ?? ''
})

// ======================================================
// DATOS DEL REPORTE
// ======================================================

const report = ref<ReporteMensual | null>(null)

const loading = ref(false)

const errorMessage = ref('')

let requestId = 0



const noReportData = computed(() => {
  if (!report.value) return false

  return (
    Number(report.value.summary.total_sales) === 0 &&
    Number(report.value.summary.delivered_orders) === 0 &&
    report.value.top_products.length === 0 &&
    report.value.top_clients.length === 0
  )
})



function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(amount) ? amount : 0)
}


function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string
          errors?: Record<string, string[]>
        }
      | undefined

    if (data?.message) {
      return data.message
    }

    if (data?.errors) {
      const firstError = Object.values(data.errors).flat()[0]

      if (firstError) {
        return firstError
      }
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
      return 'No se pudo conectar con el servidor Laravel.'
    }

    return `Error al consultar el informe (HTTP ${error.response.status}).`
  }

  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.'
}


async function loadReport(): Promise<void> {
  const currentRequest = ++requestId

  loading.value = true

  errorMessage.value = ''

  report.value = null

  try {
    const response = await obtenerReporteMensual(
      selectedYear.value,
      selectedMonth.value,
    )

    if (currentRequest !== requestId) {
      return
    }

    if (!response || !response.summary) {
      throw new Error(
        'Laravel no devolvió una estructura válida para el informe.',
      )
    }

    // Mostrar directamente los agregados de Laravel.
    report.value = response
  } catch (error) {
    if (currentRequest !== requestId) {
      return
    }

    report.value = null

    errorMessage.value = getErrorMessage(error)
  } finally {
    if (currentRequest === requestId) {
      loading.value = false
    }
  }
}



onMounted(() => {
  void loadReport()
})
</script>

<style scoped>
.reports-page {
  width: 100%;
  min-width: 0;
  color: #202b3c;
}

/* ENCABEZADO */

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 25px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #8995a8;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.report-header h1 {
  margin: 0;
  color: #1d2d49;
  font-size: 27px;
  font-weight: 750;
}

.report-filters {
  display: flex;
  align-items: center;
  gap: 9px;
}

.report-filters select {
  min-width: 112px;
  padding: 9px 12px;
  background: #ffffff;
  border: 1px solid #e2e7ef;
  border-radius: 8px;
  color: #344156;
  font-size: 11px;
  outline: none;
  cursor: pointer;
}

.report-filters select:focus {
  border-color: #315d9e;
}

/* RESUMEN */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.summary-card {
  min-width: 0;
  padding: 17px;
  background: #ffffff;
  border: 1px solid #e7eaf0;
  border-radius: 11px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  color: #68758a;
  font-size: 11px;
  font-weight: 600;
}

.summary-value {
  color: #1d2d49;
  font-size: 24px;
  font-weight: 750;
}

/* CONTENIDO PRINCIPAL */

.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}

.report-card {
  min-width: 0;
  padding: 15px;
  background: #ffffff;
  border: 1px solid #e7eaf0;
  border-radius: 11px;
}

.card-heading {
  padding-bottom: 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid #edf0f5;
}

.card-heading h2 {
  margin: 0;
  color: #202b3c;
  font-size: 14px;
  font-weight: 750;
}

/* TABLAS */

.table-container {
  width: 100%;
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th {
  padding: 8px 5px;
  color: #8995a8;
  font-size: 10px;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}

.report-table td {
  padding: 10px 5px;
  border-bottom: 1px solid #f0f2f6;
  color: #344156;
  font-size: 10px;
}

.report-table tbody tr:last-child td {
  border-bottom: 0;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.ranking {
  width: 19px;
  height: 19px;
  min-width: 19px;
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

.item-information {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.item-information strong {
  color: #26364f;
  font-size: 10px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.item-information small {
  color: #8995a8;
  font-size: 9px;
}

.quantity-cell {
  text-align: center;
  white-space: nowrap;
}

.amount-cell {
  color: #1d2d49 !important;
  font-weight: 750;
  text-align: right;
  white-space: nowrap;
}

/* ESTADOS */

.report-message {
  padding: 45px 20px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e7eaf0;
  text-align: center;
}

.report-message p {
  color: #8490a2;
  font-size: 12px;
}

.error-message {
  color: #a12b2b;
}

.error-message strong {
  font-size: 14px;
}

.retry-button {
  margin-top: 10px;
  padding: 9px 15px;
  border: none;
  border-radius: 7px;
  background: #1d355b;
  color: white;
  font-size: 11px;
  cursor: pointer;
}

.loader {
  display: block;
  width: 25px;
  height: 25px;
  margin: 0 auto 12px;
  border: 3px solid #e2e7ef;
  border-top-color: #315d9e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-report {
  padding: 15px;
  margin-bottom: 16px;
  border: 1px solid #e7eaf0;
  border-radius: 9px;
  background: #ffffff;
}

.empty-report h3 {
  margin: 0 0 5px;
  color: #344156;
  font-size: 13px;
}

.empty-report p,
.empty-table {
  color: #8995a8;
  font-size: 11px;
}

.empty-report p {
  margin: 0;
}

.empty-table {
  padding: 25px 10px;
  text-align: center;
}

/* RESPONSIVE */

@media (max-width: 950px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .report-header {
    align-items: stretch;
    flex-direction: column;
  }

  .report-filters {
    flex-wrap: wrap;
  }

  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }

  .report-header h1 {
    font-size: 23px;
  }
}

@media (max-width: 420px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
