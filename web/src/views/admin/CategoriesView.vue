<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import {
  listarCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  type CategoriaApi,
  type DatosCategoria,
} from '../../services/categories'

interface CategoriaVista {
  id: number
  name: string
  description: string
  image: string | null
  order: number
  productsCount: number
  active: boolean
}

interface CategoryForm {
  name: string
  description: string
  order: number
  active: boolean
  imageFile: File | null
  imagePreview: string | null
}

interface ErrorLaravel {
  message?: string
  errors?: Record<string, string[] | string>
}

const categories = ref<CategoriaVista[]>([])
const loading = ref(false)
const loadingDetail = ref(false)
const saving = ref(false)
const changingStatusId = ref<number | null>(null)

const showForm = ref(false)
const editingCategory = ref<CategoriaVista | null>(null)
const selectedImageInput = ref<HTMLInputElement | null>(null)

const errorMessage = ref('')
const successMessage = ref('')
const formError = ref('')

const emptyForm = (): CategoryForm => ({
  name: '',
  description: '',
  order: 1,
  active: true,
  imageFile: null,
  imagePreview: null,
})

const form = ref<CategoryForm>(emptyForm())

const orderedCategories = computed(() =>
  [...categories.value].sort((a, b) => a.order - b.order),
)

function toBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (value === false || value === 0 || value === null || value === undefined) {
    return false
  }

  return ['1', 'true', 'active', 'activo', 'activa', 'enabled'].includes(
    String(value).trim().toLowerCase(),
  )
}

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function normalizeCategory(item: CategoriaApi): CategoriaVista {
  const raw = item as CategoriaApi & Record<string, unknown>
  const image = raw.imagen ?? raw.image_url ?? raw.image ?? null
  const order =
    raw['orden_de_clasificación'] ??
    raw.orden_de_clasificacion ??
    raw.orden ??
    raw.sort_order ??
    raw.order ??
    0

  return {
    id: Number(raw.id),
    name: toText(raw.nombre ?? raw.name),
    description: toText(
      raw['descripción'] ?? raw.descripcion ?? raw.description,
    ),
    image: image ? String(image) : null,
    order: Number(order) || 0,
    productsCount: Number(raw.products_count ?? raw.productos_count ?? raw.productsCount ?? 0) || 0,
    active: toBoolean(raw.activo ?? raw.active ?? raw.is_active),
  }
}

function revokePreview() {
  const preview = form.value.imagePreview
  if (preview?.startsWith('blob:')) {
    URL.revokeObjectURL(preview)
  }
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
  formError.value = ''
}

function getLaravelError(error: unknown): string {
  if (!axios.isAxiosError<ErrorLaravel>(error)) {
    return 'Ocurrió un error inesperado. Intenta nuevamente.'
  }

  const status = error.response?.status
  const data = error.response?.data

  if (status === 401) {
    return 'Tu sesión no es válida o ha vencido. Inicia sesión nuevamente.'
  }

  if (status === 403) {
    return 'No tienes permisos para realizar esta operación.'
  }

  if (status === 404) {
    return 'La categoría solicitada no existe o ya no está disponible.'
  }

  if (status === 422) {
    const validationErrors = data?.errors
    if (validationErrors) {
      const messages = Object.values(validationErrors).flatMap((value) =>
        Array.isArray(value) ? value.map(String) : [String(value)],
      )
      if (messages.length) return messages.join('\n')
    }

    return data?.message || 'Revisa los datos ingresados.'
  }

  if (data?.message) return data.message
  if (status) return `Laravel respondió con el error ${status}.`

  return 'No se pudo conectar con Laravel. Verifica que el servidor esté activo.'
}

async function loadCategories(showSpinner = true) {
  if (showSpinner) loading.value = true
  errorMessage.value = ''

  try {
    const response = await listarCategorias()
    categories.value = response.map(normalizeCategory).sort(
      (a, b) => a.order - b.order,
    )
  } catch (error) {
    errorMessage.value = getLaravelError(error)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  revokePreview()
  form.value = {
    ...emptyForm(),
    order: categories.value.length
      ? Math.max(...categories.value.map((category) => category.order)) + 1
      : 1,
  }

  if (selectedImageInput.value) selectedImageInput.value.value = ''
}

function openNewCategory() {
  clearMessages()
  editingCategory.value = null
  resetForm()
  showForm.value = true
}

function fillForm(category: CategoriaVista) {
  revokePreview()
  form.value = {
    name: category.name,
    description: category.description,
    order: category.order,
    active: category.active,
    imageFile: null,
    imagePreview: category.image,
  }
}

async function editCategory(category: CategoriaVista) {
  clearMessages()
  editingCategory.value = category
  fillForm(category)
  showForm.value = true
  loadingDetail.value = true

  try {
    const detail = await obtenerCategoria(category.id)
    const normalized = normalizeCategory(detail)
    editingCategory.value = normalized
    fillForm(normalized)
  } catch (error) {
    formError.value = getLaravelError(error)
  } finally {
    loadingDetail.value = false
  }
}

function closeForm() {
  if (saving.value) return
  showForm.value = false
  editingCategory.value = null
  formError.value = ''
  resetForm()
}

function handleImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  formError.value = ''

  if (!file.type.startsWith('image/')) {
    formError.value = 'Selecciona un archivo de imagen válido.'
    input.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    formError.value = 'La imagen no debe superar los 2 MB.'
    input.value = ''
    return
  }

  revokePreview()
  form.value.imageFile = file
  form.value.imagePreview = URL.createObjectURL(file)
}

function validateForm(): boolean {
  if (!form.value.name.trim()) {
    formError.value = 'Ingresa el nombre de la categoría.'
    return false
  }

  if (!Number.isInteger(form.value.order) || form.value.order < 1) {
    formError.value = 'El orden debe ser un número entero mayor que cero.'
    return false
  }

  return true
}

async function saveCategory() {
  clearMessages()
  if (!validateForm()) return

  const payload: DatosCategoria = {
    nombre: form.value.name.trim(),
    descripción: form.value.description.trim(),
    orden_de_clasificación: form.value.order,
    activo: form.value.active,
    imagen: form.value.imageFile,
  }

  saving.value = true

  try {
    if (editingCategory.value) {
      await actualizarCategoria(editingCategory.value.id, payload)
      successMessage.value = 'La categoría se actualizó correctamente.'
    } else {
      await crearCategoria(payload)
      successMessage.value = 'La categoría se creó correctamente.'
    }

    showForm.value = false
    editingCategory.value = null
    resetForm()
    await loadCategories(false)
  } catch (error) {
    formError.value = getLaravelError(error)
  } finally {
    saving.value = false
  }
}

async function toggleCategoryStatus(category: CategoriaVista) {
  clearMessages()
  changingStatusId.value = category.id

  try {
    await cambiarEstadoCategoria(category.id, !category.active)
    await loadCategories(false)
    successMessage.value = category.active
      ? 'La categoría se desactivó correctamente.'
      : 'La categoría se activó correctamente.'
  } catch (error) {
    errorMessage.value = getLaravelError(error)
  } finally {
    changingStatusId.value = null
  }
}

onMounted(() => {
  void loadCategories()
})

onBeforeUnmount(() => {
  revokePreview()
})
</script>

<template>
  <div class="categories-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">CATÁLOGO</span>
        <h1>Categorías</h1>
        <p>Administra las categorías de productos.</p>
      </div>

      <button class="primary-button" :disabled="loading" @click="openNewCategory">
        + Nueva categoría
      </button>
    </header>

    <div v-if="errorMessage" class="message-banner error-banner" role="alert">
      {{ errorMessage }}
    </div>
    <div v-if="successMessage" class="message-banner success-banner" role="status">
      {{ successMessage }}
    </div>

    <section class="categories-card">
      <div class="card-header">
        <div>
          <h2>Todas las categorías</h2>
          <span>{{ categories.length }} categorías registradas</span>
        </div>

        <span class="sort-info">Ordenadas como aparecen en la app</span>
      </div>

      <!-- Modal de creación y edición -->
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="category-modal">
          <div class="modal-header">
            <h2>{{ editingCategory ? 'Editar categoría' : 'Nueva categoría' }}</h2>
            <button class="close-button" type="button" :disabled="saving" @click="closeForm">
              ×
            </button>
          </div>

          <form @submit.prevent="saveCategory">
            <div class="modal-content">
              <div class="image-field">
                <label>Imagen</label>

                <div class="image-preview">
                  <img v-if="form.imagePreview" :src="form.imagePreview" alt="Imagen de categoría" />
                  <span v-else>Sin imagen</span>
                </div>

                <label class="upload-button">
                  {{ form.imagePreview ? 'Cambiar imagen' : 'Subir imagen' }}
                  <input
                    ref="selectedImageInput"
                    type="file"
                    accept="image/*"
                    hidden
                    :disabled="saving"
                    @change="handleImage"
                  />
                </label>
                <small>Imagen de hasta 2 MB.</small>
              </div>

              <div class="modal-fields">
                <div class="field">
                  <label for="category-name">Nombre *</label>
                  <input
                    id="category-name"
                    v-model.trim="form.name"
                    type="text"
                    placeholder="Nombre de la categoría"
                    maxlength="60"
                    required
                    :disabled="saving || loadingDetail"
                  />
                </div>

                <div class="field">
                  <label for="category-description">Descripción</label>
                  <textarea
                    id="category-description"
                    v-model.trim="form.description"
                    rows="3"
                    maxlength="500"
                    placeholder="Descripción de la categoría"
                    :disabled="saving || loadingDetail"
                  ></textarea>
                </div>

                <div class="field">
                  <label for="category-order">Orden en la app *</label>
                  <input
                    id="category-order"
                    v-model.number="form.order"
                    type="number"
                    min="1"
                    step="1"
                    required
                    :disabled="saving || loadingDetail"
                  />
                </div>

                <label class="visibility-option">
                  <input v-model="form.active" type="checkbox" :disabled="saving || loadingDetail" />
                  Categoría activa
                </label>

                <p class="modal-note">
                  Las categorías con productos asociados se conservan. Puedes desactivarlas sin eliminarlas.
                </p>
              </div>
            </div>

            <div v-if="loadingDetail" class="modal-loading">Cargando datos de la categoría...</div>
            <div v-if="formError" class="form-error" role="alert">{{ formError }}</div>

            <div class="form-actions">
              <button type="button" class="secondary-button" :disabled="saving" @click="closeForm">
                Cancelar
              </button>
              <button type="submit" class="primary-button" :disabled="saving || loadingDetail">
                {{ saving ? 'Guardando...' : editingCategory ? 'Guardar cambios' : 'Crear categoría' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <span class="loading-spinner"></span>
        <p>Cargando categorías...</p>
      </div>

      <div v-else-if="categories.length > 0" class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ORDEN</th>
              <th>CATEGORÍA</th>
              <th>PRODUCTOS</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="category in orderedCategories" :key="category.id">
              <td>{{ category.order }}</td>
              <td>
                <div class="category-name">
                  <div class="category-icon">
                    <img v-if="category.image" :src="category.image" :alt="category.name" />
                    <span v-else>IMG</span>
                  </div>
                  <div class="category-text">
                    <strong>{{ category.name }}</strong>
                    <small>{{ category.description || 'Sin descripción' }}</small>
                  </div>
                </div>
              </td>
              <td>{{ category.productsCount }} productos</td>
              <td>
                <span class="visibility-status" :class="category.active ? 'visible' : 'hidden'">
                  <span class="status-dot"></span>
                  {{ category.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button
                    class="action-button"
                    type="button"
                    title="Editar"
                    aria-label="Editar categoría"
                    :disabled="changingStatusId === category.id"
                    @click="editCategory(category)"
                  >
                    ✎
                  </button>
                  <button
                    class="status-button"
                    :class="category.active ? 'deactivate-button' : 'activate-button'"
                    type="button"
                    :disabled="changingStatusId === category.id"
                    @click="toggleCategoryStatus(category)"
                  >
                    {{ changingStatusId === category.id ? 'Actualizando...' : category.active ? 'Desactivar' : 'Activar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">▤</div>
        <h3>No hay categorías registradas</h3>
        <p>Crea una categoría para organizar los productos del catálogo.</p>
        <button class="primary-button" @click="openNewCategory">
          Crear primera categoría
        </button>
      </div>

      <div v-if="!loading && categories.length > 0" class="table-footer">
        <span>{{ categories.length }} categorías en total</span>
        <span>Las categorías se desactivan en lugar de eliminarse.</span>
      </div>
    </section>
  </div>
</template>

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

.primary-button:hover:not(:disabled) {
  background: #294a79;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  min-width: 220px;
}

.category-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 280px;
}

.category-text strong {
  color: #1e293b;
}

.category-text small {
  overflow: hidden;
  color: #94a3b8;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-icon {
  display: flex;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 7px;
  background: #edf2f8;
  color: #29456f;
  font-weight: 700;
}

.category-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-icon span {
  font-size: 9px;
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
  align-items: center;
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

.action-button:hover:not(:disabled) {
  background: #f1f5f9;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-button {
  min-height: 30px;
  padding: 0 9px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.status-button:disabled {
  opacity: 0.55;
  cursor: wait;
}

.deactivate-button {
  color: #b45309;
  border-color: #f3dfbd;
}

.activate-button {
  color: #16834a;
  border-color: #c8e8d6;
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

.message-banner,
.form-error {
  margin-bottom: 14px;
  padding: 11px 14px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-line;
}

.error-banner,
.form-error {
  color: #a53025;
  border: 1px solid #f2d0cc;
  background: #fff3f1;
}

.success-banner {
  color: #176b49;
  border: 1px solid #cce8d7;
  background: #f0faf4;
}

.loading-state {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 12px;
}

.loading-state p {
  margin: 0;
}

.loading-spinner {
  width: 27px;
  height: 27px;
  border: 3px solid #e2e8f0;
  border-top-color: #1d355b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.category-modal {
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
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

.modal-header h2 {
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

.close-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.modal-fields .field input,
.modal-fields .field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  outline: none;
  font-family: inherit;
  font-size: 12px;
  resize: vertical;
}

.modal-fields .field input:focus,
.modal-fields .field textarea:focus {
  border-color: #294a79;
}

.modal-fields .field input:disabled,
.modal-fields .field textarea:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.visibility-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.modal-note {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.modal-loading {
  padding: 0 20px 12px;
  color: #64748b;
  font-size: 11px;
}

.form-error {
  margin: 0 20px 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 20px;
  border-top: 1px solid #edf0f5;
}

.secondary-button {
  padding: 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: white;
  cursor: pointer;
}

.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

  .sort-info {
    text-align: left;
  }
}

@media (max-width: 520px) {
  .modal-content {
    grid-template-columns: 1fr;
  }

  .image-field {
    align-items: flex-start;
  }
}
</style>
