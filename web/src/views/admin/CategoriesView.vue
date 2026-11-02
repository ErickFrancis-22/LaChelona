
<template>
  <div class="categories-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">CATÁLOGO</span>
        <h1>Categorías</h1>
        <p>Administra las categorías de productos.</p>
      </div>

      <button class="primary-button" @click="openNewCategory">
        + Nueva categoría
      </button>
    </header>

    <section class="categories-card">
      <div class="card-header">
        <div>
          <h2>Todas las categorías</h2>
          <span>{{ categories.length }} categorías registradas</span>
        </div>

        <span class="sort-info">
          Ordenadas como aparecen en la app
        </span>
      </div>

      <!-- Modal de creación y edición -->
<div
  v-if="showForm"
  class="modal-overlay"
  @click.self="closeForm"
>
  <div class="category-modal">
    <div class="modal-header">
      <h2>{{ editingCategory ? 'Editar categoría' : 'Nueva categoría' }}</h2>

      <button class="close-button" @click="closeForm">
        ×
      </button>
    </div>

    <form @submit.prevent="saveCategory">
      <div class="modal-content">
        <div class="image-field">
          <label>Imagen</label>

          <div class="image-preview">
            <img
              v-if="form.image"
              :src="form.image"
              alt="Imagen de categoría"
            />

            <span v-else>Sin imagen</span>
          </div>

          <label class="upload-button">
            {{ editingCategory ? 'Cambiar imagen' : 'Subir imagen' }}
            <input
              type="file"
              accept="image/*"
              @change="handleImage"
              hidden
            />
          </label>

          <small></small>
        </div>

        <div class="modal-fields">
          <div class="field">
            <label>Nombre *</label>
            <input
              v-model.trim="form.name"
              type="text"
              placeholder="Nombre de la categoría"
              maxlength="60"
              required
            />
          </div>

          <div class="field">
            <label>Orden en la app *</label>
            <input
              v-model.number="form.order"
              type="number"
              min="1"
              step="1"
              required
            />
            
          </div>

          <label class="visibility-option">
            <input v-model="form.visible" type="checkbox" />
            Visible en la aplicación
          </label>

          <p class="modal-note">
            Si la categoría no tiene productos visibles, no se mostrará en la aplicación.
          </p>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="secondary-button"
          @click="closeForm"
        >
          Cancelar
        </button>

        <button type="submit" class="primary-button">
          {{ editingCategory ? 'Guardar cambios' : 'Crear categoría' }}
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Modal de confirmación de eliminación -->
<div
  v-if="showDeleteModal"
  class="modal-overlay"
  @click.self="cancelDelete"
>
  <div class="delete-modal">
    <h2>¿Eliminar la categoría {{ categoryToDelete?.name }}?</h2>
    <p>Esta acción no se puede deshacer.</p>

    <div class="form-actions">
      <button class="secondary-button" @click="cancelDelete">
        Cancelar
      </button>

      <button class="danger-button" @click="confirmDelete">
        Eliminar
      </button>
    </div>
  </div>
</div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ORDEN</th>
              <th>CATEGORÍA</th>
              <th>PRODUCTOS</th>
              <th>EN LA APP</th>
              <th>ACCIONES</th>
            </tr>
          </thead>

          <tbody v-if="categories.length > 0">
            <tr v-for="category in orderedCategories" :key="category.id">
              <td>{{ category.order }}</td>

              <td>
  <div class="category-name">
    <div class="category-icon">
      <img
        v-if="category.image"
        :src="category.image"
        :alt="category.name"
      />
      <span v-else>IMG</span>
    </div>

    <strong>{{ category.name }}</strong>
  </div>
</td>

              <td>
                {{ category.productsCount }} productos
              </td>

              <td>
                <span
                  class="visibility-status"
                  :class="category.visible ? 'visible' : 'hidden'"
                >
                  <span class="status-dot"></span>
                  {{ category.visible ? 'Visible' : 'Oculta' }}
                </span>
              </td>

              <td>
                <div class="actions">
                  <button
                    class="action-button"
                    title="Editar"
                    @click="editCategory(category)"
                  >
                    ✎
                  </button>

                  <button
  class="action-button delete-button"
  title="Eliminar"
  :disabled="category.productsCount > 0"
  @click="requestDeleteCategory(category)"
>
  🗑
</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="categories.length === 0 && !showForm" class="empty-state">
        <div class="empty-icon">▤</div>
        <h3>No hay categorías registradas</h3>
        <p>
          Crea una categoría para organizar los productos del catálogo.
        </p>

        <button class="primary-button" @click="openNewCategory">
          Crear primera categoría
        </button>
      </div>

      <div v-if="categories.length > 0" class="table-footer">
        <span>
          {{ categories.length }} categorías en total
        </span>

        <span>
          Solo se pueden eliminar categorías sin productos asociados.
        </span>
      </div>
    </section>
  </div>

  <div
  v-if="showDeleteModal && categoryToDelete"
  class="modal-overlay"
  @click.self="cancelDelete"
>
  <div class="delete-modal">
    <h2>¿Eliminar la categoría {{ categoryToDelete.name }}?</h2>

    <p>Esta acción no se puede deshacer.</p>

    <div class="modal-actions">
      <button
        class="cancel-button"
        @click="cancelDelete"
      >
        Cancelar
      </button>

      <button
        class="confirm-delete-button"
        @click="confirmDelete"
      >
        Eliminar
      </button>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCategories, type Category } from '../../composables/useCategories'

const { categories } = useCategories()


interface CategoryForm {
  name: string
  order: number
  visible: boolean
  image: string | null
}

const showForm = ref(false)
const showDeleteModal = ref(false)

const editingCategory = ref<Category | null>(null)
const categoryToDelete = ref<Category | null>(null)

const form = ref<CategoryForm>({
  name: '',
  order: 1,
  visible: true,
  image: null,
})

let nextCategoryId = 1

const orderedCategories = computed(() =>
  [...categories.value].sort((a, b) => a.order - b.order)
)

function resetForm() {
  form.value = {
    name: '',
    order: categories.value.length + 1,
    visible: true,
    image: null,
  }
}

function openNewCategory() {
  editingCategory.value = null
  resetForm()
  showForm.value = true
}

function editCategory(category: Category) {
  editingCategory.value = category

  form.value = {
    name: category.name,
    order: category.order,
    visible: category.visible,
    image: category.image,
  }

  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingCategory.value = null
  resetForm()
}

function handleImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Selecciona un archivo de imagen válido.')
    input.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    alert('La imagen no debe superar los 2 MB.')
    input.value = ''
    return
  }

  const reader = new FileReader()

  reader.onload = () => {
    form.value.image = reader.result as string
  }

  reader.readAsDataURL(file)
}

function saveCategory() {
  const name = form.value.name.trim()


  if (!name) {
    alert('Ingresa el nombre de la categoría.')
    return
  }

  if (!Number.isInteger(form.value.order) || form.value.order < 1) {
    alert('El orden debe ser un número entero mayor que cero.')
    return
  }

  const duplicated = categories.value.some(
    category =>
      category.name.toLowerCase() === name.toLowerCase() &&
      category.id !== editingCategory.value?.id
  )

  if (duplicated) {
    alert('Ya existe una categoría con ese nombre.')
    return
  }

  if (editingCategory.value) {
    const index = categories.value.findIndex(
      category => category.id === editingCategory.value?.id
    )

    if (index === -1) return

    categories.value[index] = {
      ...editingCategory.value,
      name,
      order: form.value.order,
      visible: form.value.visible,
      image: form.value.image,
    }
  } else {
    categories.value.push({
      id: nextCategoryId++,
      name,
      order: form.value.order,
      productsCount: 0,
      visible: form.value.visible,
      image: form.value.image,
    })
  }

  closeForm()
}

function requestDeleteCategory(category: Category) {
  if (category.productsCount > 0) {
    alert('No se puede eliminar una categoría con productos asociados.')
    return
  }

  categoryToDelete.value = category
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  categoryToDelete.value = null
}

function confirmDelete() {
  if (!categoryToDelete.value) return

  categories.value = categories.value.filter(
    category => category.id !== categoryToDelete.value?.id
  )

  cancelDelete()
}
</script>

<style scoped>
.categories-page {
  min-height: 100%;
  padding: 28px;
  color: #1e293b;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
}

.page-header p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.primary-button {
  padding: 11px 17px;
  border: none;
  border-radius: 7px;
  background: #1d355b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.primary-button:hover {
  background: #294a79;
}

.categories-card {
  overflow: hidden;
  border-radius: 10px;
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.card-header h2 {
  margin: 0 0 5px;
  font-size: 15px;
}

.card-header span {
  color: #94a3b8;
  font-size: 11px;
}

.sort-info {
  text-align: right;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

thead {
  background: #f8fafc;
}

th {
  padding: 14px 16px;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

td {
  padding: 13px 16px;
  border-top: 1px solid #edf0f5;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1e293b;
}

.category-icon {
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  background: #edf2f8;
  color: #29456f;
  font-weight: 700;
}

.visibility-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 600;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.visible {
  color: #16834a;
}

.hidden {
  color: #94a3b8;
}

.actions {
  display: flex;
  gap: 7px;
}

.action-button {
  width: 30px;
  height: 30px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #475569;
  font-size: 16px;
  cursor: pointer;
}

.action-button:hover {
  background: #f1f5f9;
}

.delete-button {
  color: #dc5555;
}

.delete-button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.empty-state {
  display: flex;
  min-height: 280px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 30px;
  text-align: center;
}

.empty-icon {
  display: flex;
  width: 52px;
  height: 52px;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 25px;
}

.empty-state h3 {
  margin: 16px 0 5px;
  font-size: 17px;
}

.empty-state p {
  margin: 0 0 18px;
  color: #94a3b8;
  font-size: 12px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 14px 18px;
  border-top: 1px solid #edf0f5;
  color: #94a3b8;
  font-size: 10px;
}

.category-form {
  margin: 0 20px 20px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #f8fafc;
}

.category-form h3 {
  margin: 0 0 18px;
  font-size: 15px;
}

.form-fields {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 15px;
}

.field label {
  display: block;
  margin-bottom: 7px;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.field input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  outline: none;
  font-size: 12px;
}

.field input:focus {
  border-color: #294a79;
}

.visibility-option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 17px;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.secondary-button {
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: white;
  cursor: pointer;
}

@media (max-width: 700px) {
  .categories-page {
    padding: 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .card-header,
  .table-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .form-fields {
    grid-template-columns: 1fr;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
}

.category-modal,
.delete-modal {
  width: 100%;
  max-width: 560px;
  border-radius: 14px;
  background: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #edf0f5;
}

.modal-header h2,
.delete-modal h2 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
}

.close-button {
  width: 34px;
  height: 34px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 22px;
  cursor: pointer;
}

.modal-content {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 18px;
  padding: 20px;
}

.image-field,
.modal-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-field > label:first-child,
.modal-fields .field label {
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.image-preview {
  display: flex;
  width: 120px;
  height: 120px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 11px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-button {
  padding: 9px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  text-align: center;
  font-size: 11px;
  cursor: pointer;
}

.image-field small,
.modal-fields small {
  color: #94a3b8;
  font-size: 10px;
}

.modal-fields .field input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
}

.modal-note {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 20px;
  border-top: 1px solid #edf0f5;
}

.danger-button {
  padding: 10px 16px;
  border: none;
  border-radius: 7px;
  background: #b93827;
  color: white;
  cursor: pointer;
}

.delete-modal {
  max-width: 380px;
  padding: 24px;
}

.delete-modal p {
  color: #64748b;
  font-size: 13px;
}

.category-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-icon span {
  font-size: 9px;
}

@media (max-width: 520px) {
  .modal-content {
    grid-template-columns: 1fr;
  }

  .image-field {
    align-items: flex-start;
  }

  .category-modal {
    max-height: 90vh;
    overflow-y: auto;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
}

.delete-modal {
  width: 100%;
  max-width: 420px;
  padding: 28px;
  border-radius: 14px;
  background: white;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.delete-modal h2 {
  margin: 0 0 12px;
  color: #1e293b;
  font-size: 20px;
}

.delete-modal p {
  margin-bottom: 24px;
  color: #64748b;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button,
.confirm-delete-button {
  padding: 10px 16px;
  border-radius: 7px;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #e2e8f0;
  background: white;
}

.confirm-delete-button {
  border: none;
  background: #b93828;
  color: white;
}
</style>
