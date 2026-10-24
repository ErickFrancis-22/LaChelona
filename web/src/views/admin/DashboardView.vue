
<template>
  <section class="dashboard">
    <div class="welcome">
      <div>
        <h2>Bienvenido a La Chelona</h2>
        <p>Administra los módulos de tu tienda desde un solo lugar.</p>
      </div>
      <span class="welcome-icon">▦</span>
    </div>

    <h3>Accesos rápidos</h3>

    <div class="modules-grid">
      <RouterLink
        v-for="module in modules"
        :key="module.path"
        :to="module.path"
        class="module-card"
      >
        <div class="module-icon">{{ module.icon }}</div>
        <h4>{{ module.name }}</h4>
        <p>{{ module.description }}</p>
        <span class="module-link">Abrir módulo →</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const modules = [
  {
    name: 'Clientes',
    description: 'Acceso a la gestión de clientes.',
    path: '/admin/clientes',
    icon: '♙',
  },
  {
    name: 'Productos',
    description: 'Acceso al catálogo de productos.',
    path: '/admin/productos',
    icon: '▣',
  },
  {
    name: 'Pedidos',
    description: 'Acceso a la gestión de pedidos.',
    path: '/admin/pedidos',
    icon: '▤',
  },
  {
    name: 'Categorías',
    description: 'Organización de los productos.',
    path: '/admin/categorias',
    icon: '▧',
  },
  {
    name: 'Inventario',
    description: 'Acceso al control de inventario.',
    path: '/admin/inventario',
    icon: '▥',
  },
  {
    name: 'Informes',
    description: 'Acceso a los informes administrativos.',
    path: '/admin/informes',
    icon: '▤',
  },
]
</script>

<style scoped>
.welcome {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 26px;
  border-radius: 14px;
  background: #17243a;
  color: white;
  margin-bottom: 30px;
}

.welcome h2 {
  margin: 0 0 8px;
  font-size: 23px;
}

.welcome p {
  margin: 0;
  color: #c6d1e1;
  font-size: 14px;
}

.welcome-icon {
  color: #f59e0b;
  font-size: 40px;
}

.dashboard h3 {
  font-size: 17px;
  margin-bottom: 18px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.module-card {
  background: white;
  border: 1px solid #e5e9f0;
  border-radius: 12px;
  padding: 22px;
  text-decoration: none;
  color: #202b3c;
  transition: transform 0.2s, box-shadow 0.2s;
}

.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px #17243a12;
}

.module-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: #fff4db;
  color: #a86500;
  border-radius: 10px;
  font-size: 24px;
}

.module-card h4 {
  margin: 18px 0 8px;
  font-size: 15px;
}

.module-card p {
  min-height: 38px;
  color: #78869a;
  font-size: 12px;
  line-height: 1.6;
}

.module-link {
  color: #b77908;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 1000px) {
  .modules-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }

  .welcome {
    padding: 20px;
  }

  .welcome h2 {
    font-size: 19px;
  }
}
</style>
