
import { ref } from 'vue'
import api from '../services/api'

export interface Category {
  id: number
  name: string
  order: number
  productsCount: number
  visible: boolean
  image: string | null
}

interface ApiCategory {
  id: number
  name: string
  sort_order: number
  products_count: number
  active: boolean
  image_url: string | null
}

interface ApiResponse<T> {
  data: T
}

const categories = ref<Category[]>([])
const loading = ref(false)

export function useCategories() {
  async function loadCategories() {
    loading.value = true

    try {
      const response = await api.get<ApiResponse<ApiCategory[]>>(
        '/admin/categories'
      )

      categories.value = response.data.data.map(category => ({
        id: category.id,
        name: category.name,
        order: category.sort_order,
        productsCount: category.products_count,
        visible: category.active,
        image: category.image_url,
      }))

      return categories.value
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    loading,
    loadCategories,
  }
}
