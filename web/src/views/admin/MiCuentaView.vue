
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AxiosError } from 'axios'

import {
  obtenerPerfilAdmin,
  actualizarPerfilAdmin,
  cambiarContrasenaAdmin,
  cerrarSesionAdmin,
} from '../../services/profile'

interface PerfilAdmin {
  id?: number | string
  nombre?: string
  username?: string
  role?: string
  estado?: unknown
}

type DatosAPI = Record<string, unknown>

const router = useRouter()

const perfil = ref<PerfilAdmin>({})
const nombre = ref('')

const cargando = ref(true)
const guardandoNombre = ref(false)
const guardandoContrasena = ref(false)
const cerrandoSesion = ref(false)

const errorPerfil = ref('')
const errorNombre = ref('')
const errorContrasena = ref('')

const mensajePerfil = ref('')
const mensajeContrasena = ref('')

const contraseñaActual = ref('')
const nuevaContrasena = ref('')
const confirmarContrasena = ref('')

const verActual = ref(false)
const verNueva = ref(false)
const verConfirmacion = ref(false)

// Comprobar que una respuesta sea un objeto.
function esObjeto(valor: unknown): valor is DatosAPI {
  return typeof valor === 'object' &&
    valor !== null &&
    !Array.isArray(valor)
}

// Obtener los datos de una respuesta de Laravel.
function extraerObjeto(respuesta: unknown): DatosAPI {
  let datos: unknown = respuesta

  if (esObjeto(datos) && esObjeto(datos.data)) {
    datos = datos.data
  }

  if (esObjeto(datos) && esObjeto(datos.user)) {
    datos = datos.user
  }

  if (esObjeto(datos) && esObjeto(datos.admin)) {
    datos = datos.admin
  }

  return esObjeto(datos) ? datos : {}
}

// Obtener los datos almacenados durante el login.
function obtenerUsuarioGuardado(): DatosAPI {
  try {
    const guardado =
      localStorage.getItem('usuario') ||
      sessionStorage.getItem('usuario')

    return guardado
      ? JSON.parse(guardado) as DatosAPI
      : {}
  } catch {
    return {}
  }
}

function texto(valor: unknown): string {
  return valor === null || valor === undefined
    ? ''
    : String(valor)
}

// Adaptar los datos reales del perfil.
function normalizarPerfil(respuesta: unknown): PerfilAdmin {
  const datos = extraerObjeto(respuesta)
  const guardado = obtenerUsuarioGuardado()

  return {
    id: (datos.id ?? guardado.id) as number | string | undefined,

    nombre: texto(
      datos.name ??
      datos.nombre ??
      guardado.name ??
      guardado.nombre
    ),

    username: texto(
      datos.username ??
      guardado.username
    ),

    role: texto(
      datos.role ??
      guardado.role
    ),

    estado:
      datos.active ??
      datos.activo ??
      datos.is_active ??
      datos.status ??
      datos.estado,
  }
}

// Nombre del rol.
const nombreRol = computed(() => {
  const rol = perfil.value.role?.toUpperCase()

  return rol === 'ADMIN'
    ? 'Administrador'
    : perfil.value.role || 'No disponible'
})

// Estado de la cuenta.
const cuentaActiva = computed(() => {
  const estado = perfil.value.estado

  if (estado === true || estado === 1) return true
  if (estado === false || estado === 0) return false

  const valor = texto(estado).toLowerCase()

  if (
    ['true', 'activo', 'activa', 'active', 'enabled'].includes(valor)
  ) {
    return true
  }

  if (
    ['false', 'inactivo', 'inactiva', 'inactive', 'disabled'].includes(valor)
  ) {
    return false
  }

  return null
})

const textoEstado = computed(() => {
  if (cuentaActiva.value === true) return 'Activa'
  if (cuentaActiva.value === false) return 'Inactiva'

  return perfil.value.estado !== undefined
    ? texto(perfil.value.estado)
    : 'No disponible'
})

// Iniciales del administrador.
const iniciales = computed(() => {
  const palabras = (perfil.value.nombre || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (palabras.length >= 2) {
    return (
      (palabras[0] ?? '').charAt(0) +
      (palabras[1] ?? '').charAt(0)
    ).toUpperCase()
  }

  return (perfil.value.nombre || 'AD')
    .substring(0, 2)
    .toUpperCase()
})

// Obtener errores y validaciones enviados por Laravel.
function obtenerErrores(
  error: unknown,
  mensajePredeterminado: string
): string {
  const axiosError = error as AxiosError<{
    message?: string
    errors?: Record<string, unknown>
  }>

  const datos = axiosError.response?.data
  const errores = datos?.errors

  if (errores) {
    const mensajes = Object.values(errores).flatMap((valor) =>
      Array.isArray(valor)
        ? valor.map(String)
        : [String(valor)]
    )

    if (mensajes.length) {
      return mensajes.join(' ')
    }
  }

  if (datos?.message) {
    return datos.message
  }

  return mensajePredeterminado
}

// Actualizar los datos guardados en el navegador.
function actualizarUsuarioGuardado(nombreNuevo: string) {
  try {
    const anterior = obtenerUsuarioGuardado()

    const actualizado = {
      ...anterior,
      name: nombreNuevo,
      nombre: nombreNuevo,
    }

    if (localStorage.getItem('token')) {
      localStorage.setItem('usuario', JSON.stringify(actualizado))
    } else if (sessionStorage.getItem('token')) {
      sessionStorage.setItem('usuario', JSON.stringify(actualizado))
    }
  } catch (error) {
    console.error('Error al actualizar los datos locales:', error)
  }
}

// Consultar perfil.
async function cargarPerfil() {
  cargando.value = true
  errorPerfil.value = ''

  try {
    const respuesta = await obtenerPerfilAdmin()

    perfil.value = normalizarPerfil(respuesta)
    nombre.value = perfil.value.nombre || ''
  } catch (error) {
    perfil.value = normalizarPerfil(obtenerUsuarioGuardado())
    nombre.value = perfil.value.nombre || ''

    errorPerfil.value = obtenerErrores(
      error,
      'No se pudieron cargar los datos de la cuenta.'
    )
  } finally {
    cargando.value = false
  }
}

// Guardar nombre.
async function guardarNombre() {
  errorNombre.value = ''
  mensajePerfil.value = ''

  const nombreNuevo = nombre.value.trim()

  if (!nombreNuevo) {
    errorNombre.value = 'El nombre es obligatorio.'
    return
  }

  guardandoNombre.value = true

  try {
    // IMPORTANTE: Laravel solicita el campo "name".
    const respuesta = await actualizarPerfilAdmin({
      name: nombreNuevo,
    })

    const datos = extraerObjeto(respuesta)

    const nombreRespuesta = texto(
      datos.name ??
      datos.nombre ??
      nombreNuevo
    )

    perfil.value = {
      ...perfil.value,
      nombre: nombreRespuesta,
    }

    nombre.value = nombreRespuesta

    actualizarUsuarioGuardado(nombreRespuesta)

    mensajePerfil.value =
      'Los datos de tu cuenta se actualizaron correctamente.'

  } catch (error) {
    errorNombre.value = obtenerErrores(
      error,
      'No se pudo actualizar el nombre.'
    )
  } finally {
    guardandoNombre.value = false
  }
}

// Cambiar contraseña.
async function guardarContrasena() {
  errorContrasena.value = ''
  mensajeContrasena.value = ''

  if (!contraseñaActual.value) {
    errorContrasena.value = 'Escribe tu contraseña actual.'
    return
  }

  if (nuevaContrasena.value.length < 8) {
    errorContrasena.value =
      'La nueva contraseña debe tener al menos 8 caracteres.'
    return
  }

  if (nuevaContrasena.value !== confirmarContrasena.value) {
    errorContrasena.value =
      'La confirmación de contraseña no coincide.'
    return
  }

  guardandoContrasena.value = true

  try {
    // IMPORTANTE: estos son los nombres que Laravel solicita.
    await cambiarContrasenaAdmin({
      current_password: contraseñaActual.value,
      new_password: nuevaContrasena.value,
      new_password_confirmation: confirmarContrasena.value,
    })

    // Limpiar los campos después de una respuesta exitosa.
    contraseñaActual.value = ''
    nuevaContrasena.value = ''
    confirmarContrasena.value = ''

    verActual.value = false
    verNueva.value = false
    verConfirmacion.value = false

    mensajeContrasena.value =
      'Tu contraseña se actualizó correctamente.'

  } catch (error) {
    errorContrasena.value = obtenerErrores(
      error,
      'No se pudo actualizar la contraseña.'
    )
  } finally {
    guardandoContrasena.value = false
  }
}

// Cerrar sesión.
async function cerrarSesion() {
  errorPerfil.value = ''
  cerrandoSesion.value = true

  try {
    await cerrarSesionAdmin()

    await router.replace('/login')
  } catch (error) {
    errorPerfil.value = obtenerErrores(
      error,
      'No se pudo cerrar la sesión. Intenta nuevamente.'
    )
  } finally {
    cerrandoSesion.value = false
  }
}

// Requisitos de la contraseña.
const requisitosContrasena = computed(() => [
  {
    texto: 'Al menos 8 caracteres',
    cumplido: nuevaContrasena.value.length >= 8,
  },
  {
    texto: 'La confirmación coincide',
    cumplido:
      confirmarContrasena.value.length > 0 &&
      nuevaContrasena.value === confirmarContrasena.value,
  },
])

onMounted(cargarPerfil)
</script>

<template>
  <div class="account-page">

    <!-- ENCABEZADO -->
    <header class="page-header">
      <span class="eyebrow">ADMINISTRADOR</span>
      <h1>Mi cuenta</h1>
    </header>

    <!-- ERROR GENERAL -->
    <div v-if="errorPerfil" class="alert alert-error">
      {{ errorPerfil }}
    </div>

    <!-- CARGANDO -->
    <div v-if="cargando" class="loading-message">
      Cargando información de la cuenta...
    </div>

    <div class="account-grid">

      <!-- DATOS DE LA CUENTA -->
      <section class="card profile-card">

        <div class="card-heading">
          <div class="avatar">
            {{ iniciales }}
          </div>

          <div class="profile-heading-text">
            <h2>Datos de la cuenta</h2>

            <div class="badges">
              <span class="role-badge">
                {{ nombreRol }}
              </span>

              <span
                class="status-badge"
                :class="{
                  'status-active': cuentaActiva === true,
                  'status-inactive': cuentaActiva === false
                }"
              >
                <span class="status-dot"></span>
                {{ textoEstado }}
              </span>
            </div>
          </div>
        </div>

        <form class="profile-form" @submit.prevent="guardarNombre">

          <!-- NOMBRE EDITABLE -->
          <div class="form-group">
            <label for="nombre">Nombre</label>

            <input
              id="nombre"
              v-model="nombre"
              type="text"
              placeholder="Nombre del administrador"
              autocomplete="name"
              maxlength="150"
              :disabled="cargando || guardandoNombre"
            />
          </div>

          <!-- USUARIO NO EDITABLE -->
          <div class="form-group">
            <label for="username">Usuario</label>

            <input
              id="username"
              :value="perfil.username || ''"
              type="text"
              readonly
              disabled
            />

            <small>
              Con este usuario inicias sesión. No se puede cambiar.
            </small>
          </div>

          <!-- ID -->
          <div class="account-id">
            <span>ID de administrador</span>
            <strong>{{ perfil.id ?? 'No disponible' }}</strong>
          </div>

          <div v-if="errorNombre" class="field-error">
            {{ errorNombre }}
          </div>

          <div v-if="mensajePerfil" class="field-success">
            {{ mensajePerfil }}
          </div>

          <button
            type="submit"
            class="btn-primary"
            :disabled="cargando || guardandoNombre"
          >
            {{ guardandoNombre ? 'Guardando...' : 'Guardar cambios' }}
          </button>

        </form>
      </section>

      <!-- COLUMNA DERECHA -->
      <div class="right-column">

        <!-- CAMBIAR CONTRASEÑA -->
        <section class="card password-card">

          <div class="card-title">
            <h2>Cambiar contraseña</h2>
            <p>
              Por seguridad, escribe primero tu contraseña actual.
            </p>
          </div>

          <form @submit.prevent="guardarContrasena">

            <!-- CONTRASEÑA ACTUAL -->
            <div class="form-group">
              <label for="actual">Contraseña actual</label>

              <div class="password-wrapper">
                <input
                  id="actual"
                  v-model="contraseñaActual"
                  :type="verActual ? 'text' : 'password'"
                  autocomplete="current-password"
                  :disabled="guardandoContrasena"
                />

                <button
                  type="button"
                  class="password-toggle"
                  @click="verActual = !verActual"
                >
                  {{ verActual ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>

            <!-- NUEVA CONTRASEÑA -->
            <div class="form-group">
              <label for="nueva">Nueva contraseña</label>

              <div class="password-wrapper">
                <input
                  id="nueva"
                  v-model="nuevaContrasena"
                  :type="verNueva ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  :disabled="guardandoContrasena"
                />

                <button
                  type="button"
                  class="password-toggle"
                  @click="verNueva = !verNueva"
                >
                  {{ verNueva ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>

            <!-- CONFIRMAR CONTRASEÑA -->
            <div class="form-group">
              <label for="confirmar">
                Confirmar nueva contraseña
              </label>

              <div class="password-wrapper">
                <input
                  id="confirmar"
                  v-model="confirmarContrasena"
                  :type="verConfirmacion ? 'text' : 'password'"
                  autocomplete="new-password"
                  :disabled="guardandoContrasena"
                />

                <button
                  type="button"
                  class="password-toggle"
                  @click="verConfirmacion = !verConfirmacion"
                >
                  {{ verConfirmacion ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>

            <!-- REQUISITOS -->
            <div class="requirements">
              <div
                v-for="(requisito, index) in requisitosContrasena"
                :key="index"
                class="requirement"
                :class="{ 'requirement-met': requisito.cumplido }"
              >
                <span class="requirement-dot"></span>
                {{ requisito.texto }}
              </div>
            </div>

            <div v-if="errorContrasena" class="field-error">
              {{ errorContrasena }}
            </div>

            <div v-if="mensajeContrasena" class="field-success">
              {{ mensajeContrasena }}
            </div>

            <button
              type="submit"
              class="btn-primary"
              :disabled="guardandoContrasena"
            >
              {{
                guardandoContrasena
                  ? 'Actualizando...'
                  : 'Actualizar contraseña'
              }}
            </button>

          </form>
        </section>

        <!-- SESIÓN -->
        <section class="card session-card">

          <div>
            <h2>Sesión</h2>
            <p>Cierra la sesión en este navegador.</p>
          </div>

          <button
            type="button"
            class="btn-logout"
            @click="cerrarSesion"
            :disabled="cerrandoSesion"
          >
            {{ cerrandoSesion ? 'Cerrando...' : 'Cerrar sesión' }}
          </button>

        </section>

      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.account-page {
  width: 100%;
  min-height: calc(100vh - 48px);
  padding-bottom: 30px;
  color: #1d355b;
  font-family: Arial, Helvetica, sans-serif;
}

.page-header {
  margin-bottom: 18px;
}

.eyebrow {
  display: block;
  color: #697b96;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.7px;
  margin-bottom: 5px;
}

.page-header h1 {
  margin: 0;
  color: #1d355b;
  font-size: 27px;
  line-height: 1.2;
  font-weight: 800;
}

.account-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 16px;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.card {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e3e9f1;
  border-radius: 12px;
  box-shadow: 0 2px 5px rgba(29, 53, 91, 0.02);
}

.card h2 {
  margin: 0;
  color: #1d355b;
  font-size: 14px;
  font-weight: 800;
}

.card p {
  margin: 4px 0 0;
  color: #71809a;
  font-size: 10px;
  line-height: 1.5;
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.avatar {
  width: 38px;
  height: 38px;
  min-width: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d355b;
  background: #ffc400;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 800;
}

.profile-heading-text {
  min-width: 0;
}

.badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 4px;
}

.role-badge {
  padding: 3px 6px;
  color: #1d355b;
  background: #e7edf8;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 700;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #68778e;
  font-size: 9px;
  font-weight: 600;
}

.status-dot {
  width: 6px;
  height: 6px;
  display: inline-block;
  background: #aab5c5;
  border-radius: 50%;
}

.status-active {
  color: #176b49;
}

.status-active .status-dot {
  background: #198754;
}

.status-inactive {
  color: #bf3d32;
}

.status-inactive .status-dot {
  background: #dc493c;
}

.profile-form,
.password-card form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.password-card form {
  margin-top: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.form-group label {
  color: #1d355b;
  font-size: 10px;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  height: 37px;
  padding: 0 10px;
  color: #1d355b;
  background: #ffffff;
  border: 1px solid #dce3ed;
  border-radius: 7px;
  outline: none;
  font-family: inherit;
  font-size: 11px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  border-color: #345b91;
  box-shadow: 0 0 0 2px rgba(52, 91, 145, 0.09);
}

.form-group input:disabled,
.form-group input:read-only {
  color: #526681;
  background: #f1f3f7;
  cursor: not-allowed;
}

.form-group small {
  color: #71809a;
  font-size: 9px;
  line-height: 1.4;
}

.account-id {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  color: #71809a;
  background: #f5f7fa;
  border-radius: 7px;
  font-size: 10px;
}

.account-id strong {
  color: #1d355b;
  font-size: 10px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  padding-right: 65px;
}

.password-toggle {
  position: absolute;
  right: 9px;
  padding: 4px;
  color: #71809a;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 9px;
  cursor: pointer;
}

.password-toggle:hover {
  color: #1d355b;
}

.requirements {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 11px;
  background: #f2f4f8;
  border-radius: 8px;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #687990;
  font-size: 9px;
}

.requirement-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  background: #bdc8d8;
  border-radius: 50%;
}

.requirement-met {
  color: #176b49;
}

.requirement-met .requirement-dot {
  background: #198754;
}

.btn-primary {
  align-self: flex-start;
  min-height: 36px;
  padding: 0 14px;
  color: #ffffff;
  background: #1d355b;
  border: none;
  border-radius: 7px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #294b78;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.field-error {
  color: #b42318;
  font-size: 10px;
  line-height: 1.5;
}

.field-success {
  color: #167347;
  font-size: 10px;
  line-height: 1.5;
}

.alert {
  margin-bottom: 13px;
  padding: 10px 12px;
  border-radius: 7px;
  font-size: 11px;
}

.alert-error {
  color: #a32f29;
  background: #fff0ee;
  border: 1px solid #f1d1cc;
}

.loading-message {
  margin-bottom: 12px;
  color: #71809a;
  font-size: 11px;
}

.session-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.btn-logout {
  min-height: 32px;
  padding: 0 12px;
  color: #b44134;
  background: #ffffff;
  border: 1px solid #f0d5d1;
  border-radius: 7px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.btn-logout:hover:not(:disabled) {
  background: #fff3f1;
}

.btn-logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 850px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .account-page {
    min-height: calc(100vh - 28px);
  }

  .page-header h1 {
    font-size: 23px;
  }

  .card {
    padding: 13px;
  }

  .session-card {
    align-items: flex-start;
  }
}
</style>
