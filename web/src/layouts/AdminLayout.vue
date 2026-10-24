
<template>
  <div class="admin-layout">
    <!-- Barra lateral -->
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">
    <img src="/logo-chelonapp.png" alt="Logo La Chelona">

     
</div>
        <div>
          <h2>La Chelona</h2>
          <span>Panel administrativo</span>
        </div>
      </div>

      <div class="menu-label">MENÚ PRINCIPAL</div>

      <nav class="navigation">
        <RouterLink
          to="/admin"
          class="nav-link"
          exact-active-class="active"
        >
          <span class="nav-icon">▦</span>
          <span>Dashboard</span>
        </RouterLink>

        <div class="menu-label">GESTIÓN COMERCIAL</div>

        <RouterLink to="/admin/clientes" class="nav-link" active-class="active">
          <span class="nav-icon">♙</span>
          <span>Clientes</span>
        </RouterLink>

        <RouterLink to="/admin/productos" class="nav-link" active-class="active">
          <span class="nav-icon">▣</span>
          <span>Productos</span>
        </RouterLink>

        <RouterLink to="/admin/pedidos" class="nav-link" active-class="active">
          <span class="nav-icon">▤</span>
          <span>Pedidos</span>
        </RouterLink>

        <RouterLink to="/admin/categorias" class="nav-link" active-class="active">
          <span class="nav-icon">▧</span>
          <span>Categorías</span>
        </RouterLink>

        <div class="menu-label">CONTROL Y ANÁLISIS</div>

        <RouterLink to="/admin/inventario" class="nav-link" active-class="active">
          <span class="nav-icon">▥</span>
          <span>Inventario</span>
        </RouterLink>

        <RouterLink to="/admin/informes" class="nav-link" active-class="active">
          <span class="nav-icon">▤</span>
          <span>Informes</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <span class="status-dot"></span>
        Sistema administrativo
      </div>
    </aside>

    <!-- Contenido principal -->
    <div class="main-area">
      <header class="topbar">
        <div>
          <span class="breadcrumb">La Chelona / Administración</span>
        <h1>{{ pageTitle }}</h1>
        </div>

        <div class="user-profile">
          <div class="avatar">AD</div>
          <div>
            <strong>Administrador</strong>
            <span>Panel de gestión</span>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>

      <footer class="footer">
        La Chelona · Sistema de gestión
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const pageTitle = computed(
  () => (route.meta.title as string) || 'Panel administrativo',
)
</script>

<style>
:root {
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  color: #202b3c;
  background: #f4f6fa;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

.admin-layout {
  min-height: 100vh;
  display: flex;
}

.sidebar {
  width: 255px;
  flex-shrink: 0;
  background: #17243a;
  color: #d5deeb;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 30px;
}

.brand-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  background: white;
  border-radius: 10px;
  display: grid;
  place-items: center;
  overflow: hidden;
}

.brand-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand h2 {
  font-size: 17px;
  margin: 0 0 5px;
  color: white;
}

.brand span,
.user-profile span {
  display: block;
  font-size: 11px;
  color: #aab8cc;
}

.menu-label {
  color: #8292aa;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  margin: 20px 10px 10px;
}

.navigation {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: #c6d1e1;
  text-decoration: none;
  border-radius: 8px;
  font-size: 13px;
  transition: background 0.2s;
}

.nav-link:hover {
  background: #263750;
  color: white;
}

.nav-link.active {
  background: #f59e0b;
  color: #17243a;
  font-weight: 700;
}

.nav-icon {
  width: 20px;
  text-align: center;
  font-size: 17px;
}

.sidebar-footer {
  margin-top: auto;
  padding: 18px 8px 0;
  font-size: 11px;
  color: #aab8cc;
  border-top: 1px solid #344158;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  background: #34d399;
  border-radius: 50%;
  margin-right: 6px;
}

.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  background: white;
  padding: 22px 32px;
  border-bottom: 1px solid #e5e9f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.breadcrumb {
  font-size: 11px;
  color: #8a96a8;
}

.topbar h1 {
  margin: 7px 0 0;
  font-size: 22px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.user-profile strong {
  display: block;
  margin-bottom: 4px;
}

.avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #e0e7ff;
  color: #3748a0;
  font-weight: 700;
}

.content {
  flex: 1;
  padding: 30px;
}

.footer {
  padding: 18px 30px;
  font-size: 11px;
  color: #8a96a8;
  border-top: 1px solid #e5e9f0;
  background: white;
}

@media (max-width: 760px) {
  .sidebar {
    width: 75px;
    padding: 20px 8px;
  }

  .brand {
    justify-content: center;
    padding: 0 0 20px;
  }

  .brand > div:last-child,
  .menu-label,
  .nav-link span:last-child,
  .sidebar-footer {
    display: none;
  }

  .nav-link {
    justify-content: center;
    padding: 13px 5px;
  }

  .topbar {
    padding: 18px;
  }

  .user-profile > div:last-child {
    display: none;
  }

  .content {
    padding: 18px;
  }
}
</style>
