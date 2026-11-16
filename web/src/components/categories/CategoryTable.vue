
<template>
  <div class="table-container">
    <table class="categories-table">
      <thead>
        <tr>
          <th>CATEGORÍA</th>
          <th>DESCRIPCIÓN</th>
          <th>PRODUCTOS</th>
          <th>ORDEN</th>
          <th>ESTADO</th>
          <th>ACCIONES</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="categories.length === 0">
          <td colspan="6" class="empty-state">
            No hay categorías registradas.
          </td>
        </tr>

        <tr v-for="category in categories" :key="category.id">
          <td>
            <div class="category-info">
              <img
                v-if="category.image_url"
                :src="category.image_url"
                :alt="category.name"
                class="category-image"
              />

              <div v-else class="image-placeholder">
                IMG
              </div>

              <strong>{{ category.name }}</strong>
            </div>
          </td>

          <td class="description">
            {{ category.description || 'Sin descripción' }}
          </td>

          <td>
            <span class="products-count">
              {{ category.products_count }}
            </span>
          </td>

          <td>{{ category.sort_order }}</td>

          <td>
            <ProductStatus
              :label="category.active ? 'Activo' : 'Inactivo'"
              :type="category.active ? 'active' : 'inactive'"
            />
          </td>

          <td>
            <div class="actions">
              <button
                class="action-button edit"
                title="Editar categoría"
                @click="$emit('edit', category)"
              >
                ✎
              </button>

              <button
                class="action-button toggle"
                :title="category.active ? 'Desactivar' : 'Activar'"
                @click="$emit('toggle', category)"
              >
                {{ category.active ? '⊘' : '✓' }}
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import ProductStatus from '../products/ProductStatus.vue'

export interface Category {
  id: number
  name: string
  description: string | null
  image_url: string | null
  products_count: number
  sort_order: number
  active: boolean
}

defineProps<{
  categories: Category[]
}>()

defineEmits<{
  edit: [category: Category]
  toggle: [category: Category]
}>()
</script>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
  background: #fff;
  border-radius: 12px;
}

.categories-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

thead {
  background: #f8f9fc;
}

th {
  padding: 15px 12px;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

td {
  padding: 13px 12px;
  border-top: 1px solid #edf0f5;
  color: #334155;
}

tbody tr:hover {
  background: #fafbfe;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 160px;
}

.category-info strong {
  color: #1e293b;
  font-size: 12px;
}

.category-image,
.image-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 7px;
  object-fit: cover;
  flex-shrink: 0;
}

.image-placeholder {
  display: grid;
  place-items: center;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 10px;
}

.description {
  max-width: 250px;
  color: #64748b;
  font-size: 11px;
}

.products-count {
  padding: 5px 10px;
  border-radius: 15px;
  background: #eaf0fb;
  color: #29456f;
  font-size: 11px;
}

.actions {
  display: flex;
  gap: 7px;
}

.action-button {
  width: 29px;
  height: 29px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  cursor: pointer;
  font-size: 16px;
}

.action-button:hover {
  background: #f1f5f9;
}

.toggle {
  color: #d65b4a;
}

.edit {
  color: #334155;
}

.empty-state {
  padding: 35px;
  text-align: center;
  color: #94a3b8;
}
</style>
