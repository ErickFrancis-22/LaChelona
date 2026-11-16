import api from './api'


export type EstadoPedido =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'


export interface FiltrosPedidos {
  status?: EstadoPedido
  date?: string
  search?: string
}


export interface ResumenPedidos {
  PENDING: number
  CONFIRMED: number
  IN_TRANSIT: number
  DELIVERED: number
  CANCELLED: number
}



export interface ClientePedido {
  id?: number
  business_name?: string | null
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  address_reference?: string | null
}



export interface PedidoListado {
  id: number
  status: EstadoPedido
  total: number | string
  products_count: number
  created_at: string

  confirmed_at?: string | null
  in_transit_at?: string | null
  delivered_at?: string | null
  cancelled_at?: string | null

  client?: ClientePedido | null
}


export interface ProductoPedido {
  id: number
  order_id: number
  product_id: number

  quantity: number
  unit_price: number | string
  subtotal: number | string

  item_comment?: string | null

  product?: {
    id: number
    name?: string | null
    code?: string | null
    description?: string | null
    package_type?: string | null
    units_per_package?: number | null
    sale_price?: number | string | null
    image_url?: string | null
  } | null
}



export interface MovimientoInventarioPedido {
  id?: number
  product_id: number
  user_id: number
  order_id: number | null

  type: string
  quantity: number
  reason?: string | null
  created_at: string
}


export interface PedidoDetalle extends PedidoListado {
  customer_comment?: string | null

  delivery_address?: string | null
  delivery_reference?: string | null
  delivery_latitude?: number | string | null
  delivery_longitude?: number | string | null

  details: ProductoPedido[]

  cancelled_by?: {
    id?: number
    name?: string
    email?: string
  } | null

  inventory_movements?: MovimientoInventarioPedido[]
}


export interface RespuestaApi<T> {
  data: T
  message?: string
}

export interface RespuestaListadoPedidos {
  data: PedidoListado[]
  summary: ResumenPedidos
}



export function crearResumenInicial(): ResumenPedidos {
  return {
    PENDING: 0,
    CONFIRMED: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  }
}



export async function listarPedidos(
  filtros: FiltrosPedidos = {},
): Promise<RespuestaListadoPedidos> {
  const params: FiltrosPedidos = {}

  // Filtro por estado
  if (filtros.status) {
    params.status = filtros.status
  }

  // Filtro por fecha
  if (filtros.date) {
    params.date = filtros.date
  }

  // Búsqueda por número de pedido o negocio
  if (filtros.search?.trim()) {
    params.search = filtros.search.trim()
  }

  const response = await api.get<RespuestaListadoPedidos>(
    '/admin/orders',
    {
      params,
    },
  )

  return response.data
}


export async function obtenerPedido(
  id: number,
): Promise<PedidoDetalle> {
  const response = await api.get<
    PedidoDetalle | RespuestaApi<PedidoDetalle>
  >(`/admin/orders/${id}`)

  const resultado = response.data

  // Laravel puede devolver el pedido directamente
  // o dentro de una propiedad llamada data.

  if ('data' in resultado) {
    return resultado.data
  }

  return resultado
}




export async function confirmarPedido(
  id: number,
): Promise<void> {
  await api.patch(`/admin/orders/${id}/confirm`)
}

export async function marcarPedidoEnTransito(
  id: number,
): Promise<void> {
  await api.patch(`/admin/orders/${id}/in-transit`)
}


export async function marcarPedidoEntregado(
  id: number,
): Promise<void> {
  await api.patch(`/admin/orders/${id}/deliver`)
}