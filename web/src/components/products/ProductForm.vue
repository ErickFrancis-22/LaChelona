
<template>
  <form class="product-form" @submit.prevent="saveProduct">
    <div class="form-header">
      <div>
        <span class="eyebrow">INVENTARIO</span>
        <h2>{{ isEditing ? 'Editar producto' : 'Nuevo producto' }}</h2>
        <p>Completa la información del producto.</p>
      </div>
    </div>

    <!-- Imagen -->
    <div class="image-section">
      <label>Imagen del producto</label>

      <div class="image-preview">
        <img
          v-if="preview"
          :src="preview"
          alt="Vista previa"
        />

        <div v-else class="image-empty">
          <span>▧</span>
          <small>FOTO DEL PRODUCTO</small>
        </div>
      </div>

      <label class="upload-button">
        {{ preview ? 'Cambiar imagen' : 'Subir imagen' }}
        <input
          type="file"
          accept="image/*"
          @change="handleImage"
        />
      </label>

      <small class="helper">Cuadrada, JPG o PNG</small>
    </div>

    <!-- Datos del producto -->
    <div class="fields-section">
      <div class="field">
        <label>Nombre del producto *</label>
        <input
          v-model.trim="form.name"
          type="text"
          placeholder="Ingrese el nombre del producto"
          required
        />
      </div>

      <div class="two-columns">
        <div class="field">
          <label>Categoría *</label>

          <select v-model="form.category" required>
            <option value="" disabled>
              Selecciona una categoría
            </option>

            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.name"
            >
              {{ category.name }}
            </option>
          </select>
        </div>

        <div class="field">
          <label>Código del producto *</label>
          <input
            v-model.trim="form.code"
            type="text"
            placeholder="Ingrese el código del producto"
            required
          />
        </div>
      </div>

      <div class="package-fields">
        <div class="field">
          <label>Tipo de empaque *</label>

          <select v-model="form.packageType" required>
            <option value="CAJA">CAJA</option>
            <option value="FARDO">FARDO</option>
          </select>
        </div>

        <div class="field">
          <label>Unidades por empaque *</label>

          <input
            v-model.number="form.unitsPerPackage"
            type="number"
            min="1"
            required
          />
        </div>
      </div>
    </div>

    <div class="field full-width">
      <label>Descripción</label>

      <textarea
        v-model.trim="form.description"
        rows="3"
        placeholder="Ingrese la descripción del producto"
      ></textarea>
    </div>

    <!-- Precio y stock -->
    <div class="stock-section">
      <h3>Precio y stock</h3>

      <div class="three-columns">
        <div class="field">
          <label>Precio por caja (USD) *</label>

          <input
            v-model.number="form.price"
            type="number"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div class="field">
          <label>
            {{
              isEditing
                ? 'Stock actual (cajas)'
                : 'Stock inicial (cajas) *'
            }}
          </label>

          <input
            v-model.number="form.stock"
            type="number"
            min="0"
            :disabled="isEditing"
            :required="!isEditing"
          />

          <small v-if="isEditing" class="helper">
            Las existencias se modifican mediante
            movimientos de inventario.
          </small>
        </div>

        <div class="field">
          <label>Alerta de stock bajo (cajas) *</label>

          <input
            v-model.number="form.minStock"
            type="number"
            min="0"
            required
          />
        </div>
      </div>

      <!-- Registrar entrada de inventario -->
      <div
        v-if="isEditing && props.product?.id"
        class="inventory-entry"
      >
        <div class="inventory-header">
          <div>
            <h4>Entradas de inventario</h4>
            <p>
              Registra nuevas cajas recibidas del proveedor.
            </p>
          </div>

          <button
            type="button"
            class="entry-toggle-button"
            :disabled="entrySaving"
            @click="showEntry = !showEntry"
          >
            {{
              showEntry
                ? 'Cancelar entrada'
                : '+ Registrar entrada'
            }}
          </button>
        </div>

        <div v-if="showEntry" class="entry-fields">
          <div class="field">
            <label>Cantidad de cajas recibidas *</label>

            <input
              v-model.number="entryQuantity"
              type="number"
              min="1"
              step="1"
              placeholder="Ejemplo: 20"
              :disabled="entrySaving"
            />
          </div>

          <div class="field">
            <label>Motivo de la entrada *</label>

            <input
              v-model.trim="entryReason"
              type="text"
              maxlength="255"
              placeholder="Ejemplo: Compra a proveedor"
              :disabled="entrySaving"
            />
          </div>

          <button
            type="button"
            class="entry-confirm-button"
            :disabled="entrySaving"
            @click="registerInventoryEntry"
          >
            {{
              entrySaving
                ? 'Registrando entrada...'
                : 'Confirmar entrada'
            }}
          </button>
        </div>

        <p
          v-if="entryError"
          class="entry-error"
          role="alert"
        >
          {{ entryError }}
        </p>

        <p
          v-if="entrySuccess"
          class="entry-success"
          role="status"
        >
          {{ entrySuccess }}
        </p>
      </div>
    </div>

    <!-- Visibilidad -->
    <label class="visibility-option">
      <input v-model="form.active" type="checkbox" />
      Visible para los clientes en la app
    </label>

    <!-- Acciones -->
    <div class="form-actions">
      <button
        type="button"
        class="cancel-button"
        @click="$emit('cancel')"
      >
        Cancelar
      </button>

      <button
        type="submit"
        class="save-button"
        :disabled="saving || entrySaving"
      >
        {{
          saving
            ? 'Guardando...'
            : isEditing
              ? 'Guardar cambios'
              : 'Guardar producto'
        }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import api from '../../services/api'
import { useCategories } from '../../composables/useCategories'

// Categorías reales de Laravel
const { categories, loadCategories } = useCategories()

onMounted(async () => {
  try {
    await loadCategories()
  } catch (error) {
    console.error('Error al cargar categorías:', error)
  }
})

interface ProductFormData {
  id?: number
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
  imageFile?: File | null
  active: boolean
}

const props = defineProps<{
  product?: ProductFormData | null
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [product: ProductFormData]
  cancel: []
  'inventory-updated': []
}>()

const emptyForm = (): ProductFormData => ({
  name: '',
  code: '',
  category: '',
  packageType: 'CAJA',
  unitsPerPackage: 1,
  description: '',
  price: 0,
  stock: 0,
  minStock: 0,
  image: null,
  imageFile: null,
  active: true,
})

const form = ref<ProductFormData>(emptyForm())
const preview = ref<string | null>(null)

const isEditing = computed(() => !!props.product)

// Estado de entrada de inventario
const showEntry = ref(false)
const entryQuantity = ref<number | null>(null)
const entryReason = ref('')
const entrySaving = ref(false)
const entryError = ref('')
const entrySuccess = ref('')

// Cargar producto al editarlo
watch(
  () => props.product,
  (product) => {
    form.value = product
      ? { ...product, imageFile: null }
      : emptyForm()

    preview.value = product?.image || null

    showEntry.value = false
    entryQuantity.value = null
    entryReason.value = ''
    entryError.value = ''
    entrySuccess.value = ''
  },
  { immediate: true },
)

// Seleccionar imagen
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

  if (preview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(preview.value)
  }

  preview.value = URL.createObjectURL(file)

  form.value.image = preview.value
  form.value.imageFile = file
}

// Guardar producto
function saveProduct() {
  emit('save', { ...form.value })
}

// Registrar entrada de inventario en Laravel
async function registerInventoryEntry() {
  if (entrySaving.value) return

  entryError.value = ''
  entrySuccess.value = ''

  const productId = props.product?.id
  const quantity = Number(entryQuantity.value)

  if (!productId) {
    entryError.value = 'Primero debes guardar el producto.'
    return
  }

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    entryError.value =
      'Ingresa una cantidad válida de cajas.'
    return
  }

  if (!entryReason.value.trim()) {
    entryError.value =
      'Debes indicar el motivo de la entrada.'
    return
  }

  entrySaving.value = true

  try {
    // El backend suma las existencias
    // y registra el movimiento ENTRY.
    await api.post('/admin/inventory/entries', {
      product_id: productId,
      quantity: quantity,
      reason: entryReason.value.trim(),
    })

    entrySuccess.value =
      'Entrada de inventario registrada correctamente.'

    entryQuantity.value = null
    entryReason.value = ''
    showEntry.value = false

    // Consultar el stock actualizado desde Laravel
    try {
      const response = await api.get<{
        data?: {
          stock?: number | string
        }
        stock?: number | string
      }>(`/admin/products/${productId}`)

      const stockFromApi =
        response.data.data?.stock ??
        response.data.stock

      if (stockFromApi !== undefined) {
        const updatedStock = Number(stockFromApi)

        if (Number.isFinite(updatedStock)) {
          form.value.stock = updatedStock
        }
      }
    } catch (refreshError) {
      console.error(
        'No se pudo actualizar la lectura del stock:',
        refreshError,
      )

      entrySuccess.value =
        'Entrada registrada. Recarga el producto para ver el stock actualizado.'
    }

    // Avisar al componente padre
    emit('inventory-updated')

  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const data = error.response?.data as {
        message?: string
        errors?: Record<string, string[]>
      } | undefined

      const firstError = Object.values(
        data?.errors ?? {},
      ).flat()[0]

      entryError.value =
        firstError ??
        data?.message ??
        'No se pudo registrar la entrada.'
    } else {
      entryError.value =
        'Ocurrió un error inesperado.'
    }

    console.error(
      'Error al registrar entrada de inventario:',
      error,
    )
  } finally {
    entrySaving.value = false
  }
}
</script>

<style scoped>
.product-form {
  max-width: 850px;
  padding: 28px;
  background: #fff;
  border-radius: 12px;
  color: #1e293b;
}

.form-header {
  margin-bottom: 24px;
}

.eyebrow {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
}

h2 {
  margin: 5px 0;
  font-size: 25px;
}

.form-header p {
  color: #94a3b8;
  font-size: 13px;
}

.form-grid {
  display: grid;
  grid-template-columns: 115px 1fr;
  gap: 20px;
}

.image-section label,
.field label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.image-preview {
  width: 100px;
  height: 100px;
  overflow: hidden;
  border: 1px dashed #cbd5e1;
  border-radius: 9px;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-empty {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 11px;
}

.image-empty span {
  font-size: 25px;
}

.upload-button {
  display: block;
  margin-top: 10px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: center;
  font-size: 11px !important;
  cursor: pointer;
}

.upload-button input {
  display: none;
}

.helper {
  display: block;
  margin-top: 5px;
  color: #94a3b8;
  font-size: 9px;
}

.fields-section {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-width: 0;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  outline: none;
  background: #fff;
  color: #334155;
  font: inherit;
  font-size: 12px;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #28436c;
  box-shadow: 0 0 0 2px #28436c18;
}

.two-columns,
.three-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.full-width {
  grid-column: 1 / -1;
  margin-top: 5px;
}

.stock-section {
  margin-top: 20px;
  padding: 18px;
  border-radius: 9px;
  background: #f5f7fa;
}

.stock-section h3 {
  margin: 0 0 15px;
  font-size: 14px;
}

.three-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.visibility-option {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 20px;
  font-size: 12px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
  padding-top: 18px;
  border-top: 1px solid #edf0f5;
}

.form-actions button {
  padding: 10px 16px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
}

.save-button {
  border: 0;
  background: #1d355b;
  color: #fff;
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.package-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
  width: 100%;
  align-items: start;
}

.package-fields .field {
  min-width: 0;
}

.package-fields .field select,
.package-fields .field input {
  width: 100%;
  box-sizing: border-box;
}

/* Entradas de inventario */

.inventory-entry {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #dbe3ee;
}

.inventory-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.entry-toggle-button {
  align-self: flex-start;
}

.inventory-header h4 {
  margin: 0 0 5px;
  color: #1d355b;
  font-size: 13px;
}

.inventory-header p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
}

.entry-toggle-button,
.entry-confirm-button {
  border: 0;
  border-radius: 7px;
  padding: 10px 14px;
  background: #1d355b;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.entry-toggle-button:disabled,
.entry-confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.entry-fields {
  display: grid;
  gap: 14px;
  margin-top: 16px;
  padding: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #fff;
}

.entry-error {
  margin-top: 12px;
  color: #b91c1c;
  font-size: 12px;
}

.entry-success {
  margin-top: 12px;
  color: #15803d;
  font-size: 12px;
}

@media (max-width: 650px) {
  .product-form {
    padding: 16px;
  }

  .form-grid,
  .two-columns,
  .three-columns,
  .package-fields {
    grid-template-columns: 1fr;
  }

  .inventory-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
