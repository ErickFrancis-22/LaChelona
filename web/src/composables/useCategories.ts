import { ref } from 'vue'

export interface Category {
  id: number
  name: string
  order: number
  productsCount: number
  visible: boolean
  image: string | null
}

const categories = ref<Category[]>([])

export function useCategories() {
  return {
    categories,
  }
}