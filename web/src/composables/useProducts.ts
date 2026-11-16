
import { ref } from 'vue'
import api from '../services/api'

export interface Product {
  id: number
  category_id: number
  name: string
  code: string
  category: string
  packageType: 'FARDO' | 'CAJA'
  unitsPerPackage: number
  description: string
  price: number
  stock: number
  minStock: number
  image: string | null
  active: boolean
}

interface ApiProduct {
  id: number
  category_id: number
  name: string
  code: string
  category?: {
    id: number
    name: string
  } | null
  package_type: 'FARDO' | 'CAJA'
  units_per_package: number
  description: string | null
  sale_price: string | number
  stock: number
  minimum_stock: number
  image_url: string | null
  active: boolean
}

export interface ProductPayload {
  category_id: number
  name: string
  code: string
  package_type: 'FARDO' | 'CAJA'
  units_per_package: number
  description: string
  sale_price: number
  stock: number
  minimum_stock: number
  image: File | null
  active: boolean
}

interface ApiResponse<T> {
  data: T
  message?: string
}

const products = ref<Product[]>([])
const loading = ref(false)
const errorMessage = ref('')

function mapProduct(item: ApiProduct): Product {
  return {
    id: item.id,
    category_id: item.category_id,
    name: item.name,
    code: item.code,
    category: item.category?.name ?? 'Sin categoría',
    packageType: item.package_type,
    unitsPerPackage: item.units_per_package,
    description: item.description ?? '',
    price: Number(item.sale_price),
    stock: item.stock,
    minStock: item.minimum_stock,
    image: item.image_url,
    active: item.active,
  }
}

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
    return 'El producto solicitado no existe.'
  }

  if (status === 422) {
    const errors = response?.errors

    if (errors) {
      return Object.values(errors).flat().join(' ')
    }

    return response?.message || 'Los datos enviados no son válidos.'
  }

  return response?.message || error.message || 'Error inesperado.'
}

function buildFormData(
  data: ProductPayload,
  includeStock = true
): FormData {
  const formData = new FormData()

  formData.append('category_id', String(data.category_id))
  formData.append('name', data.name)
  formData.append('code', data.code)
  formData.append('package_type', data.package_type)
  formData.append('units_per_package', String(data.units_per_package))
  formData.append('description', data.description)
  formData.append('sale_price', String(data.sale_price))
  if (includeStock) {
    formData.append('stock', String(data.stock))
  }
  formData.append('minimum_stock', String(data.minimum_stock))
  formData.append('active', data.active ? '1' : '0')

  if (data.image) {
    formData.append('image', data.image)
  }

  return formData
}

export function useProducts() {
  async function loadProducts() {
    loading.value = true
    errorMessage.value = ''

    try {
      const response = await api.get<ApiResponse<ApiProduct[]>>(
        '/admin/products'
      )

      products.value = response.data.data.map(mapProduct)

      return products.value
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function getProduct(id: number) {
    try {
      const response = await api.get<ApiResponse<ApiProduct>>(
        `/admin/products/${id}`
      )

      return mapProduct(response.data.data)
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  async function createProduct(data: ProductPayload) {
    errorMessage.value = ''

    try {
      const response = data.image
        ? await api.post<ApiResponse<ApiProduct>>(
            '/admin/products',
            buildFormData(data)
          )
        : await api.post<ApiResponse<ApiProduct>>(
            '/admin/products',
            {
              ...data,
              category_id: data.category_id,
              package_type: data.package_type,
              units_per_package: data.units_per_package,
              sale_price: data.sale_price,
              minimum_stock: data.minimum_stock,
            }
          )

      await loadProducts()

      return mapProduct(response.data.data)
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  async function updateProduct(id: number, data: ProductPayload) {
    errorMessage.value = ''

    try {
      const {
        stock,
        image,
        ...payload
      } = data

      let response

      if (image) {
       const formData = buildFormData(data, false)

        formData.append('_method', 'PUT')

        response = await api.post<ApiResponse<ApiProduct>>(
          `/admin/products/${id}`,
          formData
        )
      } else {
        response = await api.put<ApiResponse<ApiProduct>>(
          `/admin/products/${id}`,
          payload
        )
      }

      await loadProducts()

      return mapProduct(response.data.data)
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  async function updateProductStatus(id: number, active: boolean) {
    errorMessage.value = ''

    try {
      const response = await api.patch<ApiResponse<ApiProduct>>(
        `/admin/products/${id}/status`,
        { active }
      )

      await loadProducts()

      return mapProduct(response.data.data)
    } catch (error: any) {
      errorMessage.value = getErrorMessage(error)
      throw error
    }
  }

  return {
    products,
    loading,
    errorMessage,
    loadProducts,
    getProduct,
    createProduct,
    updateProduct,
    updateProductStatus,
  }
}
