
<template>
<div class="table-container">
    <table class="products-table">
    <thead>
        <tr>
        <th>PRODUCTO</th>
        <th>CATEGORÍA</th>
        <th>EMPAQUE</th>
        <th>PRECIO POR CAJA</th>
        <th>STOCK (CAJAS)</th>
        <th>ESTADO</th>
        <th>ACCIONES</th>
        </tr>
    </thead>

    <tbody>
        <tr v-if="products.length === 0">
        <td colspan="7" class="empty-state">
            No hay productos registrados.
        </td>
        </tr>

        <tr v-for="product in products" :key="product.id">
        <td>
            <div class="product-info">
            <img
                v-if="product.image"
                :src="product.image"
                :alt="product.name"
                class="product-image"
            />

            <div v-else class="image-placeholder">
                IMG
            </div>

            <div>
                <strong>{{ product.name }}</strong>
                <small>{{ product.code }}</small>
            </div>
            </div>
        </td>

        <td>
            <span class="category-tag">
            {{ product.category }}
            </span>
        </td>

        <td>
            {{ product.packageType }}
            <small class="units">
        {{ product.unitsPerPackage }} unidades
            </small>
        </td>

        <td class="price">
            ${{ product.price.toFixed(2) }}
        </td>

        <td>
            <div class="stock-info">
        <strong
                :class="{ 'low-stock': product.stock <= product.minStock }"
            >
                {{ product.stock }}
            </strong>

            <span
                v-if="product.stock <= product.minStock"
                class="stock-warning"
            >
                Stock bajo
            </span>
            </div>
        </td>

    <td>
            <ProductStatus
            :label="product.active ? 'Activo' : 'Inactivo'"
            :type="product.active ? 'active' : 'inactive'"
            />
        </td>

        <td>
            <div class="actions">
            <button
                class="action-button edit"
                title="Editar producto"
                @click="$emit('edit', product)"
            >
                ✎
            </button>

            <button
                class="action-button toggle"
                :title="product.active ? 'Desactivar' : 'Activar'"
                @click="$emit('toggle', product.id)"
            >
                {{ product.active ? '⊘' : '✓' }}
            </button>
            </div>
        </td>
        </tr>
</tbody>
    </table>
</div>
</template>


<script setup lang="ts">
import ProductStatus from './ProductStatus.vue'

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

defineProps<{
  products: Product[]
}>()

defineEmits<{
  edit: [product: Product]
  toggle: [id: number]
}>()
</script>

<style scoped>
.table-container {
width: 100%;
overflow-x: auto;
background: #fff;
border-radius: 12px;
}

.products-table {
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
white-space: nowrap;
}

tbody tr:hover {
background: #fafbfe;
}

.product-info {
display: flex;
align-items: center;
gap: 10px;
}

.product-info strong {
display: block;
color: #1e293b;
font-size: 12px;
}

.product-info small,
.units {
display: block;
margin-top: 4px;
color: #94a3b8;
font-size: 10px;
}

.product-image,
.image-placeholder {
width: 36px;
height: 36px;
border-radius: 7px;
object-fit: cover;
}

.image-placeholder {
display: grid;
place-items: center;
background: #f1f5f9;
color: #94a3b8;
font-size: 10px;
}

.category-tag {
padding: 5px 9px;
border-radius: 15px;
background: #eaf0fb;
color: #29456f;font-size: 10px;
}

.price {
font-weight: 700;
}

.stock-info {
display: flex;
align-items: center;
gap: 8px;
}

.low-stock {
color: #c15b16;
}

.stock-warning {
padding: 4px 6px;
border-radius: 5px;
background: #fff0df;
color: #b45309;
font-size: 9px;
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
