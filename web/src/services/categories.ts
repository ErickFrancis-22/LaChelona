import api from './api'

// Estructura de categoría devuelta por Laravel.
export interface CategoriaApi {
  id: number
  nombre?: string | null
  descripción?: string | null
  descripcion?: string | null
  description?: string | null
  imagen?: string | null
  image?: string | null
  image_url?: string | null
  orden_de_clasificación?: number | string | null
  orden_de_clasificacion?: number | string | null
  orden?: number | string | null
  activo?: boolean | number | string | null
  active?: boolean | number | string | null
  products_count?: number | string | null
  productos_count?: number | string | null
}

// Datos enviados al crear o actualizar una categoría.
export interface DatosCategoria {
  nombre: string
  descripción: string
  orden_de_clasificación: number
  activo: boolean
  imagen?: File | null
}

export interface RespuestaApi<T> {
  data: T
  message?: string
}

function extraerData<T>(respuesta: T | RespuestaApi<T>): T {
  if (
    typeof respuesta === 'object' &&
    respuesta !== null &&
    'data' in respuesta
  ) {
    return (respuesta as RespuestaApi<T>).data
  }

  return respuesta as T
}

function prepararDatos(datos: DatosCategoria): FormData | Omit<DatosCategoria, 'imagen'> {
  const campos = {
    nombre: datos.nombre,
    descripción: datos.descripción,
    orden_de_clasificación: datos.orden_de_clasificación,
    activo: datos.activo,
  }

  if (!(datos.imagen instanceof File)) {
    return campos
  }

  const formData = new FormData()
  formData.append('nombre', datos.nombre)
  formData.append('descripción', datos.descripción)
  formData.append(
    'orden_de_clasificación',
    String(datos.orden_de_clasificación),
  )
  formData.append('activo', datos.activo ? '1' : '0')
  formData.append('imagen', datos.imagen)

  return formData
}

// GET /api/admin/categories
// Incluye categorías activas e inactivas.
export async function listarCategorias(): Promise<CategoriaApi[]> {
  const response = await api.get<CategoriaApi[] | RespuestaApi<CategoriaApi[]>>(
    '/admin/categories',
  )

  const resultado = extraerData(response.data)
  return Array.isArray(resultado) ? resultado : []
}

// GET /api/admin/categories/{id}
export async function obtenerCategoria(id: number): Promise<CategoriaApi> {
  const response = await api.get<CategoriaApi | RespuestaApi<CategoriaApi>>(
    `/admin/categories/${id}`,
  )

  return extraerData(response.data)
}

// POST /api/admin/categories
export async function crearCategoria(datos: DatosCategoria) {
  const response = await api.post(
    '/admin/categories',
    prepararDatos(datos),
  )

  return response.data
}

// PUT /api/admin/categories/{id}
// Para multipart se utiliza method spoofing (_method=PUT),
// que permite a Laravel procesar correctamente el archivo enviado.
export async function actualizarCategoria(
  id: number,
  datos: DatosCategoria,
) {
  const payload = prepararDatos(datos)
  const url = `/admin/categories/${id}`

  if (payload instanceof FormData) {
    payload.append('_method', 'PUT')
    const response = await api.post(url, payload)
    return response.data
  }

  const response = await api.put(url, payload)
  return response.data
}

// PATCH /api/admin/categories/{id}/status
export async function cambiarEstadoCategoria(
  id: number,
  active: boolean,
) {
  const response = await api.patch(
    `/admin/categories/${id}/status`,
    { active },
  )

  return response.data
}
