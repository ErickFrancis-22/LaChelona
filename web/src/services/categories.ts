
import api from './api'

// Estructura de categoría devuelta por Laravel.
export interface CategoriaApi {
  id: number
  name?: string | null
  description?: string | null
  image_url?: string | null
  sort_order?: number | string | null
  active?: boolean | number | string | null
  products_count?: number | string | null

  // Compatibilidad con respuestas anteriores.
  nombre?: string | null
  descripcion?: string | null
  orden?: number | string | null
  activo?: boolean | number | string | null
}

// Datos internos utilizados por el formulario Vue.
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

// Convertir los nombres internos al formato esperado por Laravel.
function prepararDatos(datos: DatosCategoria): FormData | object {
  const campos = {
    name: datos.nombre,
    description: datos.descripción,
    sort_order: Number(datos.orden_de_clasificación),
    active: datos.activo,
  }

  if (!(datos.imagen instanceof File)) {
    return campos
  }

  const formData = new FormData()

  formData.append('name', datos.nombre)
  formData.append('description', datos.descripción)
  formData.append(
    'sort_order',
    String(datos.orden_de_clasificación),
  )
  formData.append('active', datos.activo ? '1' : '0')
  formData.append('image', datos.imagen)

  return formData
}

// GET /api/admin/categories
export async function listarCategorias(): Promise<CategoriaApi[]> {
  const response = await api.get<
    CategoriaApi[] | RespuestaApi<CategoriaApi[]>
  >('/admin/categories')

  const resultado = extraerData(response.data)

  return Array.isArray(resultado) ? resultado : []
}

// GET /api/admin/categories/{id}
export async function obtenerCategoria(
  id: number,
): Promise<CategoriaApi> {
  const response = await api.get<
    CategoriaApi | RespuestaApi<CategoriaApi>
  >(`/admin/categories/${id}`)

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
