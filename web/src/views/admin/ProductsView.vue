
<template>
  <div class="products-page">
    <header class="page-header">
      <div>
       
      </div>

      <button
        v-if="!showForm"
        class="primary-button"
        @click="openNewProduct"
      >
        + Nuevo producto
      </button>
    </header>

    <section v-if="showForm" class="form-container">
      <button class="back-button" @click="closeForm">
        ← Volver a productos
      </button>

      <ProductForm
        :product="editingProduct"
        :saving="saving"
        @save="saveProduct"
        @cancel="closeForm"
      />
    </section>

    <section v-else class="catalog-section">
      <div class="toolbar">
        <div class="category-filters">
          <button
            v-for="category in categories"
            :key="category"
            class="filter-button"
            :class="{ selected: selectedCategory === category }"
            @click="selectedCategory = category"
          >
            {{ category }}
          </button>
        </div>

        <input
          v-model="search"
          type="search"
          class="search-input"
          placeholder="Buscar por nombre o código..."
        />
      </div>

      <div class="results-info">
        <span>{{ filteredProducts.length }} productos encontrados</span>
        <span>{{ activeCount }} activos</span>
      </div>

      <div v-if="loading" class="message-state">
        Cargando productos...
      </div>

      <div v-else-if="errorMessage" class="message-state error-state">
        {{ errorMessage }}
      </div>

     <ProductTable
  v-else-if="filteredProducts.length > 0"
  :products="paginatedProducts"
  @edit="openEditProduct"
  @toggle="toggleProduct"
/>

      <div
        v-if="!loading && !errorMessage && filteredProducts.length > 0"
        class="pagination"
      >
        <span>
          Mostrando {{ startItem }}–{{ endItem }}
          de {{ filteredProducts.length }} productos
        </span>

        <div class="pagination-buttons">
          <button
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Anterior
          </button>

          <span>{{ currentPage }} / {{ totalPages }}</span>

          <button
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div
        v-if="!loading && !errorMessage && filteredProducts.length === 0"
        class="empty-message"
      >
        <h3>No hay productos registrados</h3>
        <p>Registra un producto para comenzar a administrar el catálogo.</p>
        <button @click="openNewProduct">
          Registrar producto
        </button>
      </div>

    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProductTable from '../../components/products/ProductTable.vue'
import ProductForm from '../../components/products/ProductForm.vue'
import { useCategories } from '../../composables/useCategories'

const { categories: categoryRecords } = useCategories()

const categories = computed(() => [
  'Todas',
  ...categoryRecords.value.map(category => category.name),
])

interface Product {
  id: number
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

type ProductFormData = Omit<Product, 'id'> & {
  id?: number
}


const products = ref<Product[]>([])

const search = ref('')
const selectedCategory = ref('Todas')
const currentPage = ref(1)

const pageSize = 6

const showForm = ref(false)
const editingProduct = ref<Product | null>(null)

const saving = ref(false)
const loading = ref(false)
const errorMessage = ref('')

let nextProductId = 1

const filteredProducts = computed(() => {
  const term = search.value.toLowerCase().trim()

  return products.value.filter((product) => {
    const matchesCategory =
      selectedCategory.value === 'Todas' ||
      product.category === selectedCategory.value

    const matchesSearch =
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term)

    return matchesCategory && matchesSearch
  })
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize

  return filteredProducts.value.slice(start, start + pageSize)
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProducts.value.length / pageSize))
)

const startItem = computed(() =>
  filteredProducts.value.length === 0
    ? 0
    : (currentPage.value - 1) * pageSize + 1
)

const endItem = computed(() =>
  Math.min(
    currentPage.value * pageSize,
    filteredProducts.value.length
  )
)

const activeCount = computed(() =>
  products.value.filter((product) => product.active).length
)

watch([search, selectedCategory], () => {
  currentPage.value = 1
})

watch(totalPages, (total) => {
  if (currentPage.value > total) {
    currentPage.value = total
  }
})

function openNewProduct() {
  editingProduct.value = null
  showForm.value = true
}

function openEditProduct(
  product: Omit<Product, 'description'> & {
    description?: string
  }
) {
  editingProduct.value = {
    ...product,
    description: product.description ?? '',
  }

  showForm.value = true
}


function closeForm() {
  showForm.value = false
  editingProduct.value = null
}

function saveProduct(data: ProductFormData) {
  saving.value = true

  try {
    const productId = data.id ?? editingProduct.value?.id

    if (productId !== undefined) {
      const index = products.value.findIndex(
        (product) => product.id === productId
      )

      if (index !== -1) {
        products.value[index] = {
          ...data,
          id: productId,
        }
      }
    } else {
      products.value.push({
        ...data,
        id: nextProductId++,
      })
    }

    closeForm()
  } finally {
    saving.value = false
  }
}

function toggleProduct(id: number) {
  const product = products.value.find(
    (item) => item.id === id
  )

  if (!product) return

  product.active = !product.active
}
</script>

<style scoped>
.products-page {
  min-height: 100%;
  padding: 28px;
  color: #1e293b;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
}

.eyebrow {
  color: #8794a8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.page-header h1 {
  margin: 5px 0;
  color: #1e2e49;
  font-size: 27px;
  font-weight: 750;
}

.page-header p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.primary-button {
  padding: 12px 18px;
  border: none;
  border-radius: 8px;
  background: #1d355b;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.primary-button:hover {
  background: #294a79;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 18px;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.filter-button {
  padding: 8px 13px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  color: #64748b;
  font-size: 11px;
  cursor: pointer;
}

.filter-button.selected {
  border-color: #1d355b;
  background: #1d355b;
  color: white;
}

.search-input {
  width: 240px;
  max-width: 100%;
  padding: 10px 13px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  background: white;
  font-size: 12px;
}

.search-input:focus {
  border-color: #1d355b;
}

.results-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #94a3b8;
  font-size: 11px;
}

.form-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 15px;
}

.back-button {
  border: none;
  background: transparent;
  color: #29456f;
  font-size: 12px;
  cursor: pointer;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-top: 18px;
  color: #94a3b8;
  font-size: 11px;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-buttons button {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #334155;
  cursor: pointer;
}

.pagination-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.message-state,
.empty-message {
  padding: 50px 20px;
  border-radius: 10px;
  background: white;
  text-align: center;
  color: #64748b;
}

.error-state {
  color: #b91c1c;
}

.empty-message h3 {
  color: #334155;
}

.empty-message p {
  font-size: 12px;
}

.empty-message button {
  margin-top: 12px;
  padding: 9px 14px;
  border: none;
  border-radius: 7px;
  background: #1d355b;
  color: white;
  cursor: pointer;
}

@media (max-width: 700px) {
  .products-page {
    padding: 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .pagination {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
