
import api from './api'



export interface PeriodoReporte {
  year: number
  month: number
}



export interface ResumenReporte {
  total_sales: string
  delivered_orders: number
}



export interface ProductoMasVendido {
  product_id: number
  code: string | null
  name: string
  quantity_sold: number
  revenue: string
}



export interface ClienteMasCompras {
  client_id: number
  business_name: string | null
  contact_name: string | null
  orders_count: number
  total_purchased: string
}



export interface ReporteMensual {
  period: PeriodoReporte
  summary: ResumenReporte
  top_products: ProductoMasVendido[]
  top_clients: ClienteMasCompras[]
}



export interface RespuestaReporte {
  data: ReporteMensual
}



export async function obtenerReporteMensual(
  year: number,
  month: number,
): Promise<ReporteMensual> {
  const response = await api.get<RespuestaReporte>(
    '/admin/reports/monthly',
    {
      params: {
        year,
        month,
      },
    },
  )

  return response.data.data
}
