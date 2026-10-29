
<template>
  <div class="admin-layout">
    <!-- Barra lateral -->
    <aside class="sidebar">

      <!-- Logo y nombre -->
      <div class="brand">
        <img
  src="/logo-chelonapp-oscuro.png"
  alt="Logo La Chelona App"
  class="brand-logo"
/>
      </div>

      <!-- Menú de navegación -->
      <nav class="menu">

        <RouterLink
          to="/admin"
          class="menu-item"
          active-class="active"
          exact-active-class="active"
        >
          <span class="menu-icon">▣</span>
          <span>Pedidos del día</span>
        </RouterLink>

        <RouterLink
          to="/admin/productos"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">◉</span>
          <span>Productos</span>
        </RouterLink>

        <RouterLink
          to="/admin/categorias"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">◆</span>
          <span>Categorías</span>
        </RouterLink>

        <RouterLink
          to="/admin/clientes"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">♙</span>
          <span>Clientes</span>
        </RouterLink>

  <RouterLink to="/admin/reportes" class="menu-item">
  <span class="menu-icon">▥</span>
  <span>Reportes</span>
</RouterLink>

      </nav>

      

    </aside>

    <!-- Contenido principal -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fb;
  font-family: Arial, Helvetica, sans-serif;
}

/* Barra lateral */
.sidebar {
  width: 250px;
  min-width: 250px;
  min-height: 100vh;
  padding: 20px 12px 16px;
  background-color: #1d355b;
  color: #ffffff;
  display: flex;
  flex-direction: column;
}

/* Logo */
.brand {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.brand-logo {
  width: 175px;
  height: 100px;
  object-fit: contain;
  display: block;
}

/* Menú */
.menu {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 10px 12px;
  color: #c8d2e2;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  border-radius: 9px;
  transition: background-color 0.2s, color 0.2s;
}

.menu-item:hover {
  background-color: #29466f;
  color: #ffffff;
}

/* Opción seleccionada */
.menu-item.active {
  background-color: #ffc400;
  color: #1d355b;
  font-weight: 700;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
}

.menu-icon {
  width: 15px;
  min-width: 15px;
  text-align: center;
  font-size: 13px;
}

/* Perfil inferior */
.user-profile {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding: 12px 3px 0;
}

.user-avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  background-color: #ffc400;
  color: #1d355b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.user-info strong {
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.user-info span {
  font-size: 9px;
  color: #b9c7db;
}

/* Contenido de las páginas */
.main-content {
  flex: 1;
  min-width: 0;
  padding: 24px;
}

/* Adaptación a pantallas pequeñas */
@media (max-width: 600px) {
  .sidebar {
    width: 190px;
    min-width: 190px;
    padding: 16px 9px;
  }

  .brand-logo {
    width: 155px;
  }

  .menu-item {
    font-size: 12px;
    padding: 9px 7px;
  }

  .main-content {
    padding: 14px;
  }
}
</style>
