
import { ref } from 'vue'
import api from '../services/api'

export interface Category {
  id: number
  name: string
  description: string | null
  image_url: string | null
  products_count: number
  sort_order: number
  active: boolean
}

export interface CategoryPayload {
  name: string
  description: string
  image: File | null
  sort_order: number
  active: boolean
}

interface ApiResponse<T> {
  data: T
  message?: string
}

const categories = ref<Category[]>([])
const loading = ref(false)
const errorMessage = ref('')

function getErrorMessage(error: any): string {
  const status = error.response?.status
  const response = error.response?.data

  if (status === 401) {
    return 'Sesión no válida. Inicia sesión nuevamente.'
  }

  if (status === 403) {
    return 'No tienes permisos para realizar esta operación.'
  }

  if (status === 404) {
    return 'La categoría solicitada no existe o fue encontrada en una ruta incorrecta.'
  }

  if (status === 422) {
    const validationErrors = response?.errors

    if (validationErrors) {
      return Object.values(validationErrors)
        .flat()
        .join(' ')
    }

    return response?.message || 'Los datos enviados no son válidos.'
  }

  return response?.message || error.message || 'Ocurrió un error inesperado.'
}

function buildFormData(data: CategoryPayload): FormData {
  const formData = new FormData()

  formData.append('name', data.name)
  formData.append('description', data.description)
  formData.append('sort_order', String(data.sort_order))
  formData.append('active', data.active ? '1' : '0')

  if (data.image) {
    formData.append('image', data.image)
  }

  return formData
}

export function useCategories() {
  // Listar todas las categorías, activas e inactivas.
  async function loadCategories() {
    loading.value = true
    errorMessage.value = ''

    try {
      const response = await api.get<ApiResponse<Category[]>>(
        '/admin/categories'
      )

      categories.value = response.data.data

      return categories.value
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Consultar una categoría específica.
  async function getCategory(id: number): Promise<Category> {
    try {
      const response = await api.get<ApiResponse<Category>>(
        `/admin/categories/${id}`
      )

      return response.data.data
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  // Crear una categoría.
  async function createCategory(data: CategoryPayload) {
    errorMessage.value = ''

    try {
      let response

      if (data.image) {
        response = await api.post<ApiResponse<Category>>(
          '/admin/categories',
          buildFormData(data)
        )
      } else {
        const { image, ...payload } = data

        response = await api.post<ApiResponse<Category>>(
          '/admin/categories',
          payload
        )
      }

      await loadCategories()

      return response.data.data
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  // Editar una categoría.
  async function updateCategory(
    id: number,
    data: CategoryPayload
  ) {
    errorMessage.value = ''

    try {
      let response

      if (data.image) {
        const formData = buildFormData(data)

        // Laravel reconoce el método PUT mediante method spoofing.
        formData.append('_method', 'PUT')

        response = await api.post<ApiResponse<Category>>(
          `/admin/categories/${id}`,
          formData
        )
      } else {
        const { image, ...payload } = data

        response = await api.put<ApiResponse<Category>>(
          `/admin/categories/${id}`,
          payload
        )
      }

      await loadCategories()

      return response.data.data
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  // Activar o desactivar una categoría.
  async function updateCategoryStatus(
    id: number,
    active: boolean
  ) {
    errorMessage.value = ''

    try {
      const response = await api.patch<ApiResponse<Category>>(
        `/admin/categories/${id}/status`,
        { active }
      )

      await loadCategories()

      return response.data.data
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  return {
    categories,
    loading,
    errorMessage,
    loadCategories,
    getCategory,
    createCategory,
    updateCategory,
    updateCategoryStatus,
  }
}
