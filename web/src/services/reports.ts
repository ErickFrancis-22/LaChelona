import api from './api'

export interface ParametrosReporteMensual {
  year: number
  month: number
}

export interface ResumenReporteMensual {
  total_sales: number | string
  delivered_orders: number
}

export interface ProductoMasVendidoReporte {
  product_id: number
  name: string
  code?: string | null
  quantity_sold: number
  revenue: number | string
}

export interface ClienteMayorCompraReporte {
  client_id: number
  business_name?: string | null
  contact_name?: string | null
  orders_count: number
  total_purchased: number | string
}

export interface ReporteMensual {
  summary: ResumenReporteMensual
  top_products: ProductoMasVendidoReporte[]
  top_clients: ClienteMayorCompraReporte[]
}

function esRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function esProductoMasVendido(value: unknown): value is ProductoMasVendidoReporte {
  if (!esRegistro(value)) return false

  return (
    typeof value.product_id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.quantity_sold === 'number' &&
    (typeof value.revenue === 'number' || typeof value.revenue === 'string')
  )
}

function esClienteMayorCompra(value: unknown): value is ClienteMayorCompraReporte {
  if (!esRegistro(value)) return false

  return (
    typeof value.client_id === 'number' &&
    typeof value.orders_count === 'number' &&
    (typeof value.total_purchased === 'number' ||
      typeof value.total_purchased === 'string')
  )
}

function esReporteMensual(value: unknown): value is ReporteMensual {
  if (!esRegistro(value) || !esRegistro(value.summary)) {
    return false
  }

  const summary = value.summary

  return (
    (typeof summary.total_sales === 'number' ||
      typeof summary.total_sales === 'string') &&
    typeof summary.delivered_orders === 'number' &&
    Array.isArray(value.top_products) &&
    value.top_products.every(esProductoMasVendido) &&
    Array.isArray(value.top_clients) &&
    value.top_clients.every(esClienteMayorCompra)
  )
}


export async function obtenerReporteMensual(
  year: number,
  month: number,
): Promise<ReporteMensual> {
  const response = await api.get<unknown>(
    '/admin/reports/monthly',
    {
      params: { year, month },
    },
  )

  // Admite la respuesta directa o el envoltorio estándar { data: ... }.
  const payload = response.data
  const resultado = esRegistro(payload) && 'data' in payload
    ? payload.data
    : payload

  if (!esReporteMensual(resultado)) {
    throw new Error(
      'Laravel no devolvió la estructura esperada del reporte: summary, top_products y top_clients.',
    )
  }

  return resultado
}