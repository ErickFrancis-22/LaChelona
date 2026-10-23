
<script setup lang="ts">
import { ref } from 'vue'

interface Usuario {
  id: number
  name?: string
  username: string
  role: string
}

interface RespuestaLogin {
  token?: string
  user?: Usuario
  message?: string
  errors?: Record<string, string[]>
}

const usuario = ref('')
const contrasena = ref('')
const mostrarContrasena = ref(false)
const mantenerSesion = ref(false)
const cargando = ref(false)
const error = ref('')
const exito = ref('')

async function ingresar() {
  error.value = ''
  exito.value = ''

  const username = usuario.value.trim()
  const password = contrasena.value

  if (!username || !password) {
    error.value = 'Ingresa tu usuario y contraseña.'
    return
  }

  cargando.value = true

  try {
    const respuesta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    const datos: RespuestaLogin = await respuesta.json().catch(() => ({}))

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        throw new Error('Usuario o contraseña incorrectos.')
      }

      if (respuesta.status === 403) {
        throw new Error(
          datos.message ||
            'Tu usuario está inactivo o no tiene permiso para ingresar.',
        )
      }

      if (respuesta.status === 422) {
        throw new Error(
          datos.errors?.username?.[0] ||
            datos.errors?.password?.[0] ||
            datos.message ||
            'Verifica los datos ingresados.',
        )
      }

      throw new Error(
        datos.message || 'No se pudo iniciar sesión. Intenta nuevamente.',
      )
    }

    if (!datos.token || !datos.user) {
      throw new Error(
        'La API no devolvió el token o los datos del usuario.',
      )
    }

    if (String(datos.user.role).toUpperCase() !== 'ADMIN') {
      throw new Error(
        'Acceso denegado. Solo los usuarios con rol ADMIN pueden ingresar.',
      )
    }

    // Limpiar la sesión anterior.
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')

    // Guardar la sesión según la opción seleccionada.
    const almacenamiento = mantenerSesion.value
      ? localStorage
      : sessionStorage

    almacenamiento.setItem('token', datos.token)
    almacenamiento.setItem('usuario', JSON.stringify(datos.user))

    exito.value = `Inicio de sesión correcto. Bienvenido, ${
      datos.user.name || datos.user.username
    }.`
    contrasena.value = ''
  } catch (e: unknown) {
    error.value =
      e instanceof TypeError
        ? 'No se pudo conectar con Laravel. Comprueba que el backend esté activo.'
        : e instanceof Error
          ? e.message
          : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="brand-panel">
      <div class="brand-content">
        <img
          src="/logo-chelonapp-oscuro.png"
          alt="Logo La ChelonAPP"
          class="brand-logo"
        />

        <span class="brand-badge">PANEL DE ADMINISTRACIÓN</span>

        <p class="brand-description">
          Pedidos, productos, clientes y reportes de tu
          <br class="desktop-break" />
          distribuidora en un solo lugar.
        </p>
      </div>
    </section>

    <section class="form-panel">
      <div class="login-container">
        <header class="form-header">
          <h1>Iniciar sesión</h1>
          <p>Ingresa con tu cuenta de administrador.</p>
        </header>

        <form @submit.prevent="ingresar" novalidate>
          <div class="form-group">
            <label for="usuario">Usuario</label>
            <input
              id="usuario"
              v-model="usuario"
              type="text"
              placeholder="Tu usuario"
              autocomplete="username"
              :disabled="cargando"
              required
              @input="error = ''; exito = ''"
            />
          </div>

          <div class="form-group">
            <label for="contrasena">Contraseña</label>

            <div class="password-container">
              <input
                id="contrasena"
                v-model="contrasena"
                :type="mostrarContrasena ? 'text' : 'password'"
                placeholder="Tu contraseña"
                autocomplete="current-password"
                :disabled="cargando"
                required
                @input="error = ''; exito = ''"
              />

              <button
                type="button"
                class="eye-button"
                :aria-label="
                  mostrarContrasena
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                "
                @click="mostrarContrasena = !mostrarContrasena"
              >
                <svg
                  v-if="!mostrarContrasena"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true"
                >
                  <path
                    d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>

                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  aria-hidden="true"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path
                    d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7s-3.6 7-10 7a10 10 0 0 1-4.5-1"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="remember-option">
              <input
                v-model="mantenerSesion"
                type="checkbox"
                :disabled="cargando"
              />
              <span>Mantener sesión iniciada</span>
            </label>
          </div>

          <div v-if="error" class="message error-message" role="alert">
            {{ error }}
          </div>

          <div v-if="exito" class="message success-message" role="status">
            {{ exito }}
          </div>

          <button type="submit" class="login-button" :disabled="cargando">
            <span v-if="cargando" class="spinner"></span>
            {{ cargando ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

:root {
  font-family: Arial, Helvetica, sans-serif;
  color: #172b4d;
  background: #f4f6fa;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

html,
body,
#app {
  margin: 0;
  min-width: 320px;
  min-height: 100%;
}

body {
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

.login-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  min-height: 100vh;
}

.brand-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #1d355c;
  color: #fff;
}

.brand-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  text-align: center;
}

.brand-logo {
  display: block;
  width: 270px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  margin-bottom: 13px;
}

.brand-badge {
  display: inline-block;
  padding: 6px 15px;
  border-radius: 30px;
  background: #ffc400;
  color: #142745;
  font-size: 10px;
  font-weight: 800;
}

.brand-description {
  margin: 13px 0 0;
  color: #c1d0e7;
  font-size: 12px;
  line-height: 1.6;
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 40px;
  background: #f4f6fa;
}

.login-container {
  width: 100%;
  max-width: 300px;
}

.form-header {
  margin-bottom: 19px;
}

.form-header h1 {
  margin: 0 0 5px;
  color: #15243d;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.8px;
}

.form-header p {
  margin: 0;
  color: #65748b;
  font-size: 10px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 15px;
}

.form-group > label {
  display: block;
  margin-bottom: 5px;
  color: #182b49;
  font-size: 10px;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #dce3ed;
  border-radius: 7px;
  outline: none;
  background: #fff;
  color: #243753;
  font-size: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input::placeholder {
  color: #8995a8;
}

.form-group input:focus {
  border-color: #365c94;
  box-shadow: 0 0 0 3px rgb(54 92 148 / 10%);
}

.password-container {
  position: relative;
}

.password-container input {
  padding-right: 38px;
}

.eye-button {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: 34px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: #687891;
  cursor: pointer;
}

.eye-button svg {
  width: 16px;
  height: 16px;
}

.form-options {
  display: flex;
  align-items: center;
  margin: 18px 0;
}

.remember-option {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #34445d;
  font-size: 11px;
  cursor: pointer;
}

.remember-option input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #1d355c;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-height: 38px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: #1d355c;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.login-button:hover:not(:disabled) {
  background: #294b7c;
}

.login-button:disabled {
  opacity: 0.75;
  cursor: wait;
}

.message {
  margin: 0 0 14px;
  padding: 9px 10px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.error-message {
  border: 1px solid #f4cccc;
  background: #fff0f0;
  color: #a12626;
}

.success-message {
  border: 1px solid #c6ead2;
  background: #eaf8ef;
  color: #17653a;
}

.spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgb(255 255 255 / 45%);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 650px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 235px;
    padding: 28px 20px 24px;
  }

  .brand-logo {
    width: 220px;
    margin-bottom: 8px;
  }

  .form-panel {
    align-items: flex-start;
    padding: 35px 24px 45px;
  }

  .login-container {
    max-width: 360px;
    margin: 0 auto;
  }

  .form-header h1 {
    font-size: 25px;
  }

  .form-header p {
    font-size: 12px;
  }

  .form-group > label {
    font-size: 12px;
  }

  .form-group input,
  .eye-button {
    height: 42px;
  }

  .form-group input {
    font-size: 13px;
  }

  .form-options {
    flex-wrap: wrap;
    margin: 20px 0;
  }

  .login-button {
    min-height: 42px;
    font-size: 13px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
