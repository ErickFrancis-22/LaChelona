
<template>
  <div class="admin-layout">
    <!-- Barra lateral -->
    <aside class="sidebar">

      <!-- Logo -->
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

        <RouterLink
          to="/admin/reportes"
          class="menu-item"
          active-class="active"
        >
          <span class="menu-icon">▥</span>
          <span>Reportes</span>
        </RouterLink>

      </nav>

      <!-- Perfil inferior: Mi cuenta -->
      <div class="sidebar-footer">
        <RouterLink
          to="/admin/mi-cuenta"
          class="user-profile"
          active-class="user-profile-active"
          aria-label="Ir a Mi cuenta"
        >
          <div class="user-avatar">
            {{ iniciales }}
          </div>

          <div class="user-info">
            <strong>{{ nombreUsuario }}</strong>
            <span>Mi cuenta</span>
          </div>
        </RouterLink>
      </div>

    </aside>

    <!-- Contenido principal -->
    <main class="main-content">
      <RouterView />
    </main>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

interface UsuarioSesion {
  id?: number
  name?: string
  username?: string
  role?: string
}

// Recuperar los datos guardados al iniciar sesión.
function obtenerUsuarioGuardado(): UsuarioSesion | null {
  try {
    const usuarioGuardado =
      localStorage.getItem('usuario') ||
      sessionStorage.getItem('usuario')

    if (!usuarioGuardado) {
      return null
    }

    return JSON.parse(usuarioGuardado) as UsuarioSesion
  } catch (error) {
    console.error('No se pudieron recuperar los datos del usuario:', error)
    return null
  }
}

const usuario = ref<UsuarioSesion | null>(obtenerUsuarioGuardado())

// Nombre que aparecerá en la tarjeta.
const nombreUsuario = computed(() => {
  return (
    usuario.value?.name?.trim() ||
    usuario.value?.username ||
    'Administrador'
  )
})

// Iniciales que aparecerán dentro del círculo amarillo.
const iniciales = computed(() => {
  const palabras = nombreUsuario.value
    .trim()
    .split(/\s+/)
    .filter(Boolean)

if (palabras.length >= 2) {
  const primera = palabras[0] ?? ''
  const segunda = palabras[1] ?? ''

  return (
    primera.charAt(0) +
    segunda.charAt(0)
  ).toUpperCase()
}

  return nombreUsuario.value.substring(0, 2).toUpperCase()
})
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

/* Zona inferior del menú */
.sidebar-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
}

/* Tarjeta Mi cuenta */
.user-profile {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 7px;
  border-radius: 9px;
  background-color: #29466f;
  color: #ffffff;
  text-decoration: none;
  transition: background-color 0.2s;
}

.user-profile:hover {
  background-color: #365781;
}

.user-profile-active {
  background-color: #365781;
  outline: 1px solid rgba(255, 196, 0, 0.45);
}

/* Círculo amarillo */
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

/* Información del usuario */
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
  overflow: hidden;
  text-overflow: ellipsis;
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

  .user-profile {
    gap: 6px;
    padding: 7px 5px;
  }

  .user-avatar {
    width: 30px;
    height: 30px;
    min-width: 30px;
    font-size: 10px;
  }

  .user-info strong {
    font-size: 9px;
  }

  .main-content {
    padding: 14px;
  }
}
</style>
