
<template>
  <section class="reports-page">

    <!-- ENCABEZADO -->
    <header class="report-header">
      <div>
        <p class="eyebrow">REPORTE MENSUAL DE VENTAS</p>
        <h1>{{ monthName }} {{ selectedYear }}</h1>
      </div>

      <div class="report-filters">
        <!-- SELECTOR COMBINADO DE MES Y AÑO -->
        <select
          v-model="selectedPeriod"
          aria-label="Seleccionar mes y año del reporte"
          @change="handlePeriodChange"
        >
          <option
            v-for="period in periodOptions"
            :key="period.value"
            :value="period.value"
          >
            {{ period.label }}
          </option>
        </select>

        <!-- BOTÓN DESCARGAR PDF -->
        <button
          type="button"
          class="pdf-button"
          :disabled="!report || loading || exportingPdf"
          @click="downloadReportPdf"
        >
          <span class="download-icon">↓</span>
          {{ exportingPdf ? 'Generando PDF...' : 'Descargar PDF' }}
        </button>
      </div>
    </header>

    <p v-if="pdfErrorMessage" class="pdf-error" role="alert">
      {{ pdfErrorMessage }}
    </p>

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

                        <small
                          v-if="client.business_name && client.contact_name"
                        >
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
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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

const selectedPeriod = ref(
  `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, '0')}`,
)

// Laravel acepta años entre 2000 y 2100.
const periodOptions = Array.from(
  { length: 101 * 12 },
  (_, index) => {
    const year = 2100 - Math.floor(index / 12)
    const month = 12 - (index % 12)

    return {
      value: `${year}-${String(month).padStart(2, '0')}`,
      label: `${months[month - 1]?.label ?? `Mes ${month}`} ${year}`,
    }
  },
)

const selectedYear = computed(() =>
  Number(selectedPeriod.value.slice(0, 4)),
)

const selectedMonth = computed(() =>
  Number(selectedPeriod.value.slice(5, 7)),
)

const monthName = computed(() => {
  return months.find(
    (month) => month.value === selectedMonth.value,
  )?.label ?? ''
})

function handlePeriodChange(): void {
  void loadReport()
}



const report = ref<ReporteMensual | null>(null)

const loading = ref(false)
const errorMessage = ref('')
const pdfErrorMessage = ref('')
const exportingPdf = ref(false)

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


function formatCurrency(
  value: number | string | null | undefined,
): string {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}



function downloadReportPdf(): void {
  const currentReport = report.value

  if (!currentReport || loading.value || exportingPdf.value) {
    return
  }

  exportingPdf.value = true
  pdfErrorMessage.value = ''

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    pdf.setProperties({
      title: `Reporte mensual de ventas - ${monthName.value} ${selectedYear.value}`,
      subject: 'Reporte mensual de ventas',
      author: 'La Chelona App',
    })

    // ENCABEZADO
    pdf.setTextColor(29, 53, 91)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.text('LA CHELONA APP', 14, 15)

    pdf.setFontSize(12)
    pdf.text('REPORTE MENSUAL DE VENTAS', 14, 23)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(`${monthName.value} ${selectedYear.value}`, 14, 30)

    // RESUMEN OFICIAL DE LARAVEL
    pdf.setDrawColor(226, 231, 239)
    pdf.setFillColor(255, 255, 255)

    pdf.roundedRect(14, 36, 125, 20, 2, 2, 'FD')
    pdf.roundedRect(145, 36, 125, 20, 2, 2, 'FD')

    pdf.setFontSize(9)
    pdf.setTextColor(104, 117, 138)

    pdf.text('Ventas del mes', 19, 43)
    pdf.text('Pedidos entregados', 150, 43)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(29, 45, 73)

    pdf.text(
      formatCurrency(currentReport.summary.total_sales),
      19,
      51,
    )

    pdf.text(
      String(currentReport.summary.delivered_orders),
      150,
      51,
    )

    // PRODUCTOS MÁS VENDIDOS
    pdf.setFontSize(12)
    pdf.setTextColor(29, 53, 91)
    pdf.text('Productos mas vendidos', 14, 66)

    autoTable(pdf, {
      startY: 71,
      margin: { left: 14, right: 14 },

      head: [[
        'N.º',
        'Producto',
        'Codigo',
        'Cantidad vendida',
        'Ingresos',
      ]],

      body: currentReport.top_products.length > 0
        ? currentReport.top_products.map((product, index) => [
            String(index + 1),
            product.name,
            product.code || '-',
            String(product.quantity_sold),
            formatCurrency(product.revenue),
          ])
        : [[
            '',
            'Sin productos para este periodo',
            '',
            '',
            '',
          ]],

      theme: 'grid',

      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        textColor: [52, 65, 86],
        lineColor: [232, 236, 242],
      },

      headStyles: {
        fillColor: [29, 53, 91],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    })

    const pdfWithTables = pdf as jsPDF & {
      lastAutoTable?: { finalY: number }
    }

    const clientsStartY =
      (pdfWithTables.lastAutoTable?.finalY ?? 85) + 10

    // CLIENTES CON MÁS COMPRAS
    pdf.setFontSize(12)
    pdf.setTextColor(29, 53, 91)
    pdf.text('Clientes con mas compras', 14, clientsStartY)

    autoTable(pdf, {
      startY: clientsStartY + 5,
      margin: { left: 14, right: 14 },

      head: [[
        'N.º',
        'Cliente / negocio',
        'Contacto',
        'Cantidad de pedidos',
        'Importe comprado',
      ]],

      body: currentReport.top_clients.length > 0
        ? currentReport.top_clients.map((client, index) => [
            String(index + 1),
            client.business_name ||
              client.contact_name ||
              `Cliente #${client.client_id}`,
            client.contact_name || '-',
            String(client.orders_count),
            formatCurrency(client.total_purchased),
          ])
        : [[
            '',
            'Sin clientes para este periodo',
            '',
            '',
            '',
          ]],

      theme: 'grid',

      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        textColor: [52, 65, 86],
        lineColor: [232, 236, 242],
      },

      headStyles: {
        fillColor: [29, 53, 91],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
    })

    // DESCARGA CON EL PERIODO SELECCIONADO
    pdf.save(`reporte-mensual-${selectedPeriod.value}.pdf`)

  } catch (error) {
    console.error('Error al generar el PDF:', error)

    pdfErrorMessage.value = error instanceof Error
      ? `No se pudo generar el PDF: ${error.message}`
      : 'No se pudo generar el archivo PDF.'

  } finally {
    exportingPdf.value = false
  }
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
  pdfErrorMessage.value = ''

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
  min-width: 150px;
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

/* BOTÓN PDF */

.pdf-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 9px 15px;
  border: 1px solid #1d355b;
  border-radius: 8px;
  background: #1d355b;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
}

.pdf-button:hover:not(:disabled) {
  background: #29466f;
}

.pdf-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.download-icon {
  font-size: 15px;
  line-height: 1;
}

.pdf-error {
  margin: -8px 0 14px;
  color: #a12b2b;
  font-size: 11px;
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
    align-items: center;
    flex-wrap: wrap;
  }

  .report-filters select,
  .pdf-button {
    flex: 1;
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
