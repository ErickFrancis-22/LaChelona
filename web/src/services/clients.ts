import api from './api'

export interface PedidoApi {
  id: number
  status: string
  total: number | string
  created_at?: string | null
}

export interface ClienteApi {
  id: number
  business_name: string
  contact_name: string
  phone: string
  email: string
  address: string
  address_reference: string | null
  latitude: number | string | null
  longitude: number | string | null

  user?: {
    name?: string
    username?: string
    email?: string
    active?: boolean | number
  } | null

  orders?: PedidoApi[]
}

export interface RespuestaApi<T> {
  data: T
  message?: string
}

export type DatosCliente = Record<
  string,
  string | number | null
>

// Listar clientes con búsqueda y filtros.
export async function listarClientes(
  opciones: { search?: string; active?: boolean } = {},
): Promise<RespuestaApi<ClienteApi[]>> {
  const params: {
    search?: string
    active?: boolean
  } = {}

  if (opciones.search?.trim()) {
    params.search = opciones.search.trim()
  }

  if (typeof opciones.active === 'boolean') {
    params.active = opciones.active
  }

  const response = await api.get<RespuestaApi<ClienteApi[]>>(
    '/admin/clients',
    { params },
  )

  return response.data
}

// Consultar detalle y pedidos del cliente.
export async function obtenerCliente(
  id: number,
): Promise<RespuestaApi<ClienteApi>> {
  const response = await api.get<RespuestaApi<ClienteApi>>(
    `/admin/clients/${id}`,
  )

  return response.data
}

// Crear cliente.
export async function crearCliente(
  datos: DatosCliente,
): Promise<RespuestaApi<ClienteApi>> {
  const response = await api.post<RespuestaApi<ClienteApi>>(
    '/admin/clients',
    datos,
  )

  return response.data
}

// Actualizar cliente.
export async function actualizarCliente(
  id: number,
  datos: DatosCliente,
): Promise<RespuestaApi<ClienteApi>> {
  const response = await api.put<RespuestaApi<ClienteApi>>(
    `/admin/clients/${id}`,
    datos,
  )

  return response.data
}

// Activar o desactivar cuenta.
export async function cambiarEstadoCliente(
  id: number,
  active: boolean,
): Promise<RespuestaApi<ClienteApi>> {
  const response = await api.patch<RespuestaApi<ClienteApi>>(
    `/admin/clients/${id}/status`,
    { active },
  )

  return response.data
}
