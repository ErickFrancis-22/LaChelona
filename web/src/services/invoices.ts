
import api from './api'

export interface ClienteComprobante {
  id?: number
  business_name?: string | null
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}



export interface ProductoComprobante {
  id: number
  code?: string | null
  name?: string | null
  description?: string | null
  package_type?: string | null
  units_per_package?: number | null
  sale_price?: number | string | null
}



export interface DetalleComprobante {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: number | string
  subtotal: number | string
  item_comment?: string | null
  product?: ProductoComprobante | null
}



export interface PedidoComprobante {
  id: number
  status?: string
  total: number | string
  created_at?: string
  customer_comment?: string | null

  client?: ClienteComprobante | null

  details?: DetalleComprobante[]
}



export interface Comprobante {
  id: number
  order_id: number
  invoice_number: string
  issue_date: string
  total: number | string
  created_at?: string

  order?: PedidoComprobante
}



export interface RespuestaComprobante<T> {
  message?: string
  data: T
}



export async function generarComprobante(
  orderId: number,
): Promise<RespuestaComprobante<Comprobante>> {
  const response = await api.post<RespuestaComprobante<Comprobante>>(
    `/admin/orders/${orderId}/invoice`,
  )

  return response.data
}



export async function obtenerComprobante(
  orderId: number,
): Promise<RespuestaComprobante<Comprobante>> {
  const response = await api.get<RespuestaComprobante<Comprobante>>(
    `/admin/orders/${orderId}/invoice`,
  )

  return response.data
}
