<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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

const router = useRouter()

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
      throw new Error('La API no devolvió el token o los datos del usuario.')
    }

    if (String(datos.user.role).toUpperCase() !== 'ADMIN') {
      throw new Error(
        'Acceso denegado. Solo los usuarios con rol ADMIN pueden ingresar.',
      )
    }

    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')

    const almacenamiento = mantenerSesion.value
      ? localStorage
      : sessionStorage

    almacenamiento.setItem('token', datos.token)
    almacenamiento.setItem('usuario', JSON.stringify(datos.user))

    await router.push('/admin')
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

function recuperarContrasena() {
  error.value =
    'Contacta al administrador para recuperar tu contraseña.'
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

            <a
              href="#"
              class="forgot-link"
              @click.prevent="recuperarContrasena"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div
            v-if="error"
            class="message error-message"
            role="alert"
          >
            {{ error }}
          </div>

          <div
            v-if="exito"
            class="message success-message"
            role="status"
          >
            {{ exito }}
          </div>

          <button
            type="submit"
            class="login-button"
            :disabled="cargando"
          >
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

html,
body,
#app {
  min-height: 100%;
  margin: 0;
}

.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f3f5fa;
  color: #17243a;
  font-family: Arial, Helvetica, sans-serif;
}

.brand-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #1b3156;
  color: #ffffff;
}

.brand-content {
  width: 100%;
  max-width: 340px;
  text-align: center;
}

.brand-logo {
  display: block;
  width: min(100%, 240px);
  max-height: 190px;
  object-fit: contain;
  margin: 0 auto 22px;
}

.brand-badge {
  display: inline-block;
  padding: 5px 12px;
  border: none;
  border-radius: 20px;
  background: #ffc400;
  color: #101b2b;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0;
}

.brand-description {
  margin: 8px 0 0;
  color: #c5d0e1;
  font-size: 11px;
  line-height: 1.55;
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f3f5fa;
}

.login-container {
  width: 100%;
  max-width: 256px;
}

.form-header {
  margin-bottom: 14px;
}

.form-header h1 {
  margin: 0 0 5px;
  color: #111d31;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.6px;
}

.form-header p {
  margin: 0;
  color: #748096;
  font-size: 10px;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 14px;
}

.form-group > label {
  display: block;
  margin-bottom: 5px;
  color: #17243a;
  font-size: 9px;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  height: 31px;
  min-height: 31px;
  padding: 7px 10px;
  border: 1px solid #dce2ec;
  border-radius: 6px;
  outline: none;
  background: #ffffff;
  color: #17243a;
  font-family: inherit;
  font-size: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  border-color: #244c78;
  box-shadow: 0 0 0 2px rgb(36 76 120 / 10%);
}

.form-group input::placeholder {
  color: #a3acb8;
}

.password-container {
  position: relative;
}

.password-container input {
  padding-right: 35px;
}

.eye-button {
  position: absolute;
  top: 50%;
  right: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  padding: 3px;
  border: none;
  background: transparent;
  color: #748096;
  cursor: pointer;
  transform: translateY(-50%);
}

.eye-button svg {
  width: 15px;
  height: 15px;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  margin: 1px 0 20px;
}

.remember-option {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #536078;
  font-size: 9px;
  white-space: nowrap;
  cursor: pointer;
}

.remember-option input {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: #183d64;
  cursor: pointer;
}

.forgot-link {
  color: #173b61;
  font-size: 9px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.forgot-link:hover {
  text-decoration: underline;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 9px 14px;
  border: none;
  border-radius: 7px;
  background: #1b365d;
  color: #ffffff;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.login-button:hover:not(:disabled) {
  background: #274b79;
}

.login-button:active:not(:disabled) {
  transform: scale(0.99);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.message {
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.error-message {
  border: 1px solid #f1c5c5;
  background: #fff1f1;
  color: #a12d2d;
}

.success-message {
  border: 1px solid #bde3ce;
  background: #effaf3;
  color: #216b40;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgb(255 255 255 / 45%);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 230px;
    padding: 25px 20px;
  }

  .brand-content {
    max-width: 300px;
  }

  .brand-logo {
    width: min(100%, 180px);
    max-height: 105px;
    margin-bottom: 15px;
  }

  .brand-description {
    font-size: 11px;
  }

  .form-panel {
    padding: 38px 24px 45px;
  }

  .login-container {
    max-width: 320px;
  }
}

@media (max-width: 360px) {
  .form-options {
    flex-wrap: wrap;
  }

  .remember-option,
  .forgot-link {
    white-space: normal;
  }
}
</style>