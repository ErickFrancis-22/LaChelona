
<template>
<span class="product-status" :class="statusClass">
    <span class="status-dot"></span>
    {{ label }}
</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
label: string
type: 'active' | 'inactive' | 'low-stock' | 'normal'
}>()

const statusClass = computed(() => `status-${props.type}`)
</script>

<style scoped>
.product-status {
display: inline-flex;
align-items: center;
gap: 6px;
padding: 5px 9px;
border-radius: 20px;
font-size: 12px;
font-weight: 600;
white-space: nowrap;
}

.status-dot {
width: 7px;
height: 7px;
border-radius: 50%;
background: currentColor;
}

.status-active {
color: #16834a;
background: #e8f7ee;
}

.status-inactive {
color: #737373;
background: #eeeeee;
}

.status-low-stock {
color: #b45309;
background: #fff1db;
}

.status-normal {
color: #2563a6;
background: #eaf2ff;
}
</style>
