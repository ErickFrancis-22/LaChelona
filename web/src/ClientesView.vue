
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  cambiarEstadoCliente,
} from './services/clients'

interface PedidoApi {
  id: number
  status: string
  total: number | string
  created_at?: string | null
}

interface ClienteApi {
  id: number
  business_name: string
  contact_name: string
  phone: string
  email: string
  address: string
  address_reference: string | null
  latitude: number | string | null
  longitude: number | string | null

  user?: {
    name?: string
    username?: string
    email?: string
    active?: boolean | number
  } | null

  orders?: PedidoApi[]
}

interface Cliente {
  id: number
  nombre: string
  direccion: string
  referencia: string
  contacto: string
  telefono: string
  correo: string
  activo: boolean
  latitude: number | string | null
  longitude: number | string | null
  nombreUsuario: string
  username: string
  pedidos: PedidoApi[]
}

interface FormularioCliente {
  name: string
  username: string
  email: string
  password: string
  password_confirmation: string
  business_name: string
  contact_name: string
  phone: string
  address: string
  address_reference: string
  latitude: string
  longitude: string
}

const busqueda = ref('')
const filtroActivo = ref<'todos' | 'activos' | 'inactivos'>('todos')

const clientes = ref<Cliente[]>([])
const resumenClientes = ref<Cliente[]>([])

const clienteSeleccionado = ref<number | null>(null)
const clienteActual = ref<Cliente | null>(null)

const cargandoLista = ref(false)
const cargandoResumen = ref(false)
const cargandoDetalle = ref(false)
const guardando = ref(false)
const cambiandoEstado = ref(false)

const errorLista = ref('')
const errorDetalle = ref('')
const errorOperacion = ref('')
const mensajeExito = ref('')
const erroresFormulario = ref<string[]>([])

const formularioVisible = ref(false)
const modoFormulario = ref<'crear' | 'editar'>('crear')

function formularioVacio(): FormularioCliente {
  return {
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    business_name: '',
    contact_name: '',
    phone: '',
    address: '',
    address_reference: '',
    latitude: '',
    longitude: '',
  }
}

const formulario = reactive<FormularioCliente>(formularioVacio())

const clientesFiltrados = computed(() => clientes.value)

const totalActivos = computed(
  () => resumenClientes.value.filter(cliente => cliente.activo).length,
)

const totalInactivos = computed(
  () => resumenClientes.value.filter(cliente => !cliente.activo).length,
)

const mapaUrl = computed(() => {
  const cliente = clienteActual.value

  if (
    !cliente ||
    cliente.latitude === null ||
    cliente.longitude === null ||
    cliente.latitude === '' ||
    cliente.longitude === ''
  ) {
    return ''
  }

  return `https://www.google.com/maps?q=${cliente.latitude},${cliente.longitude}`
})

let solicitudLista = 0
let solicitudDetalle = 0

function texto(valor: unknown): string {
  return valor === null || valor === undefined ? '' : String(valor)
}

// Adaptar los nombres reales de Laravel al diseño de Vue.
function normalizarCliente(datos: ClienteApi): Cliente {
  return {
    id: datos.id,
    nombre: texto(datos.business_name),
    direccion: texto(datos.address),
    referencia: texto(datos.address_reference),
    contacto: texto(datos.contact_name),
    telefono: texto(datos.phone),
    correo: texto(datos.email || datos.user?.email),
    activo: Boolean(datos.user?.active),
    latitude: datos.latitude ?? null,
    longitude: datos.longitude ?? null,
    nombreUsuario: texto(datos.user?.name),
    username: texto(datos.user?.username),
    pedidos: Array.isArray(datos.orders) ? datos.orders : [],
  }
}

// Obtener la respuesta de error de Laravel.
function obtenerDatosError(error: unknown) {
  return error as {
    response?: {
      status?: number
      data?: {
        message?: string
        errors?: Record<string, string[] | string>
      }
    }
    message?: string
  }
}

// Mostrar mensajes de Laravel.
function obtenerMensajeError(error: unknown): string {
  const errorHttp = obtenerDatosError(error)
  const status = errorHttp.response?.status
  const datos = errorHttp.response?.data

  if (status === 401) {
    return 'Tu sesión ha expirado. Inicia sesión nuevamente.'
  }

  if (status === 403) {
    return datos?.message ||
      'No tienes permisos para esta operación administrativa.'
  }

  const errores = datos?.errors

  if (errores) {
    const primerError = Object.values(errores)
      .flatMap(valor => Array.isArray(valor) ? valor : [valor])
      .find(Boolean)

    if (primerError) return primerError
  }

  return datos?.message ||
    errorHttp.message ||
    'No fue posible completar la solicitud.'
}

function obtenerErroresValidacion(error: unknown): string[] {
  const datos = obtenerDatosError(error).response?.data
  const errores = datos?.errors

  if (errores) {
    return Object.values(errores)
      .flatMap(valor => Array.isArray(valor) ? valor : [valor])
      .filter(Boolean)
  }

  return [obtenerMensajeError(error)]
}

// Cargar resumen de clientes para los contadores.
async function cargarResumen() {
  cargandoResumen.value = true

  try {
    const respuesta = await listarClientes()

    if (!Array.isArray(respuesta?.data)) {
      throw new Error(
        'La respuesta de Laravel no contiene una lista válida de clientes.',
      )
    }

    resumenClientes.value = respuesta.data.map(normalizarCliente)
  } catch (error) {
    console.error('No se pudo cargar el resumen de clientes:', error)
  } finally {
    cargandoResumen.value = false
  }
}


// Consultar listado real desde Laravel.
async function cargarClientes() {
  const numeroSolicitud = ++solicitudLista

  cargandoLista.value = true
  errorLista.value = ''
  errorOperacion.value = ''

  const filtros: {
    search: string
    active?: boolean
  } = {
    search: busqueda.value.trim(),
  }

  if (filtroActivo.value !== 'todos') {
    filtros.active = filtroActivo.value === 'activos'
  }

  try {
    const respuesta = await listarClientes(filtros)

    if (numeroSolicitud !== solicitudLista) return

    if (!Array.isArray(respuesta?.data)) {
      throw new Error(
        'La respuesta de Laravel no contiene una lista válida de clientes.',
      )
    }

    clientes.value = respuesta.data.map(normalizarCliente)

    const seleccionadoExiste = clientes.value.some(
      cliente => cliente.id === clienteSeleccionado.value,
    )

    if (seleccionadoExiste && clienteSeleccionado.value !== null) {
      await seleccionarCliente(clienteSeleccionado.value)
    } else {
      const primerCliente = clientes.value[0]

      if (primerCliente) {
        await seleccionarCliente(primerCliente.id)
      } else {
        clienteSeleccionado.value = null
        clienteActual.value = null
        errorDetalle.value = ''
      }
    }
  } catch (error) {
    if (numeroSolicitud !== solicitudLista) return

    clientes.value = []
    clienteSeleccionado.value = null
    clienteActual.value = null
    errorLista.value = obtenerMensajeError(error)
  } finally {
    if (numeroSolicitud === solicitudLista) {
      cargandoLista.value = false
    }
  }
}



// Consultar detalle real y pedidos asociados.
async function seleccionarCliente(id: number) {
  const numeroSolicitud = ++solicitudDetalle

  clienteSeleccionado.value = id
  clienteActual.value = null
  cargandoDetalle.value = true
  errorDetalle.value = ''

  try {
    const respuesta = await obtenerCliente(id)

    if (numeroSolicitud !== solicitudDetalle) return

    if (!respuesta?.data || respuesta.data.id === undefined) {
      throw new Error('Laravel no devolvió el detalle del cliente.')
    }

    clienteActual.value = normalizarCliente(respuesta.data)
  } catch (error) {
    if (numeroSolicitud !== solicitudDetalle) return

    errorDetalle.value = obtenerMensajeError(error)
  } finally {
    if (numeroSolicitud === solicitudDetalle) {
      cargandoDetalle.value = false
    }
  }
}

// Limpiar búsqueda y filtros.
function limpiarFiltros() {
  busqueda.value = ''
  filtroActivo.value = 'todos'
  clienteSeleccionado.value = null
}

// Abrir formulario de creación.
function abrirCrearCliente() {
  Object.assign(formulario, formularioVacio())

  modoFormulario.value = 'crear'
  erroresFormulario.value = []
  errorOperacion.value = ''
  mensajeExito.value = ''

  formularioVisible.value = true
}

// Abrir formulario de edición.
function abrirEditarCliente() {
  const cliente = clienteActual.value

  if (!cliente) return

  Object.assign(formulario, {
    ...formularioVacio(),

    name: cliente.nombreUsuario || cliente.contacto,
    username: cliente.username,
    email: cliente.correo,

    business_name: cliente.nombre,
    contact_name: cliente.contacto,
    phone: cliente.telefono,
    address: cliente.direccion,
    address_reference: cliente.referencia,

    latitude: cliente.latitude === null ? '' : String(cliente.latitude),
    longitude: cliente.longitude === null ? '' : String(cliente.longitude),
  })

  modoFormulario.value = 'editar'
  erroresFormulario.value = []
  errorOperacion.value = ''
  mensajeExito.value = ''

  formularioVisible.value = true
}

function cerrarFormulario() {
  if (guardando.value) return

  formularioVisible.value = false
  erroresFormulario.value = []
}

// Convertir coordenadas opcionales.
function numeroOpcional(valor: string): number | null {
  if (valor.trim() === '') return null

  const numero = Number(valor)

  return Number.isFinite(numero) ? numero : null
}

// Crear o editar utilizando Laravel.
async function guardarCliente() {
  guardando.value = true

  erroresFormulario.value = []
  errorOperacion.value = ''
  mensajeExito.value = ''

  const datos: Record<string, string | number | null> = {
    name: formulario.name.trim(),
    username: formulario.username.trim(),
    email: formulario.email.trim(),

    business_name: formulario.business_name.trim(),
    contact_name: formulario.contact_name.trim(),
    phone: formulario.phone.trim(),
    address: formulario.address.trim(),
    address_reference: formulario.address_reference.trim() || null,

    latitude: numeroOpcional(formulario.latitude),
    longitude: numeroOpcional(formulario.longitude),
  }

  try {
    let respuesta

    if (modoFormulario.value === 'crear') {
      datos.password = formulario.password
      datos.password_confirmation = formulario.password_confirmation

      respuesta = await crearCliente(datos)
    } else {
      if (!clienteActual.value) {
        throw new Error('No hay un cliente seleccionado para editar.')
      }

      respuesta = await actualizarCliente(
        clienteActual.value.id,
        datos,
      )
    }

    const idResultado = respuesta?.data?.id

    formularioVisible.value = false

    mensajeExito.value = respuesta?.message || (
      modoFormulario.value === 'crear'
        ? 'Cliente creado correctamente.'
        : 'Cliente actualizado correctamente.'
    )

    await cargarResumen()
    await cargarClientes()

    if (typeof idResultado === 'number') {
      await seleccionarCliente(idResultado)
    }
  } catch (error) {
    erroresFormulario.value = obtenerErroresValidacion(error)
    errorOperacion.value = obtenerMensajeError(error)
  } finally {
    guardando.value = false
  }
}

// Activar o desactivar sin eliminar físicamente.
async function alternarEstadoCliente() {
  const cliente = clienteActual.value

  if (!cliente || cambiandoEstado.value) return

  const nuevoEstado = !cliente.activo
  const accion = nuevoEstado ? 'activar' : 'desactivar'

  const confirmado = window.confirm(
    `¿Deseas ${accion} la cuenta de ${cliente.nombre}?`,
  )

  if (!confirmado) return

  cambiandoEstado.value = true
  errorOperacion.value = ''
  mensajeExito.value = ''

  try {
    const respuesta = await cambiarEstadoCliente(
      cliente.id,
      nuevoEstado,
    )

    mensajeExito.value = respuesta?.message ||
      `Cliente ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`

    await cargarResumen()
    await cargarClientes()
  } catch (error) {
    errorOperacion.value = obtenerMensajeError(error)
  } finally {
    cambiandoEstado.value = false
  }
}

// Formatear fecha real de pedido.
function formatearFecha(fecha?: string | null): string {
  if (!fecha) return ''

  const valor = new Date(fecha)

  if (Number.isNaN(valor.getTime())) return fecha

  return valor.toLocaleDateString('es-SV')
}

// Mostrar el total recibido por Laravel.
function formatearTotal(total: number | string): string {
  const numero = Number(total)

  if (!Number.isFinite(numero)) {
    return String(total)
  }

  return `$${numero.toFixed(2)}`
}

// Actualizar listado al cambiar búsqueda o estado.
watch(
  [busqueda, filtroActivo],
  (_nuevo, _anterior, onCleanup) => {
    const temporizador = window.setTimeout(() => {
      void cargarClientes()
    }, 350)

    onCleanup(() => window.clearTimeout(temporizador))
  },
)

onMounted(() => {
  void cargarResumen()
  void cargarClientes()
})
</script>

<template>
  <main class="clients-page">
    <header class="page-header">
      <div>
        <div class="eyebrow">NEGOCIOS REGISTRADOS</div>
        <h1>Clientes</h1>
      </div>

      <div class="page-actions">
        <button
          type="button"
          class="primary-button"
          @click="abrirCrearCliente"
        >
          Nuevo cliente
        </button>
      </div>
    </header>

    <div
      v-if="mensajeExito"
      class="alert-message alert-success"
      role="status"
    >
      {{ mensajeExito }}
    </div>

    <div
      v-if="errorOperacion"
      class="alert-message alert-error"
      role="alert"
    >
      {{ errorOperacion }}
    </div>

    <div class="clients-layout">
      <!-- LISTADO DE CLIENTES -->
      <section class="clients-list card" aria-label="Listado de clientes">
        <div class="search-box">
          <span class="search-icon" aria-hidden="true">⌕</span>

          <input
            v-model="busqueda"
            type="search"
            placeholder="Negocio o contacto"
            aria-label="Buscar negocio o contacto"
          />
        </div>

        <div
          class="filter-tabs"
          aria-label="Filtrar clientes por estado"
        >
          <button
            type="button"
            :class="{ selected: filtroActivo === 'todos' }"
            @click="filtroActivo = 'todos'; clienteSeleccionado = null"
          >
            Todos · {{ cargandoResumen ? '…' : resumenClientes.length }}
          </button>

          <button
            type="button"
            :class="{ selected: filtroActivo === 'activos' }"
            @click="filtroActivo = 'activos'; clienteSeleccionado = null"
          >
            Activos · {{ cargandoResumen ? '…' : totalActivos }}
          </button>

          <button
            type="button"
            :class="{ selected: filtroActivo === 'inactivos' }"
            @click="filtroActivo = 'inactivos'; clienteSeleccionado = null"
          >
            Inactivos · {{ cargandoResumen ? '…' : totalInactivos }}
          </button>
        </div>

        <div
          v-if="cargandoLista"
          class="loading-state"
          role="status"
        >
          Cargando clientes...
        </div>

        <div
          v-else-if="errorLista"
          class="empty-clients"
        >
          <h2>No se pudo cargar el listado</h2>
          <p>{{ errorLista }}</p>

          <button
            type="button"
            class="secondary-button"
            @click="cargarClientes"
          >
            Reintentar
          </button>
        </div>

        <div
          v-else-if="clientesFiltrados.length === 0"
          class="empty-clients"
        >
          <div class="empty-search-icon" aria-hidden="true">⌕</div>

          <h2>No se encontraron clientes</h2>

          <p>
            {{ busqueda || filtroActivo !== 'todos'
              ? 'No hay clientes que coincidan con la búsqueda o el filtro.'
              : 'Todavía no hay clientes registrados.' }}
          </p>

          <button
            v-if="busqueda || filtroActivo !== 'todos'"
            type="button"
            class="secondary-button"
            @click="limpiarFiltros"
          >
            Limpiar filtros
          </button>
        </div>

        <button
          v-for="cliente in clientesFiltrados"
          :key="cliente.id"
          type="button"
          class="client-row"
          :class="{
            'client-row-selected': clienteSeleccionado === cliente.id,
          }"
          @click="seleccionarCliente(cliente.id)"
        >
          <span class="client-avatar">
            {{ cliente.nombre.slice(0, 2).toUpperCase() }}
          </span>

          <span class="client-row-info">
            <strong>{{ cliente.nombre }}</strong>

            <small>
              {{ cliente.direccion || 'Dirección no registrada' }}
            </small>
          </span>

          <span
            class="client-status"
            :class="cliente.activo ? 'status-active' : 'status-inactive'"
          >
            {{ cliente.activo ? 'Activo' : 'Inactivo' }}
          </span>
        </button>
      </section>

      <!-- DETALLE DEL CLIENTE -->
      <div class="client-details-column">
        <section class="client-details card">
          <div
            v-if="cargandoDetalle"
            class="loading-state"
            role="status"
          >
            Cargando detalle del cliente...
          </div>

          <div
            v-else-if="errorDetalle"
            class="detail-placeholder"
            role="alert"
          >
            <h2>No se pudo cargar el detalle</h2>
            <p>{{ errorDetalle }}</p>
          </div>

          <div v-else-if="clienteActual">
            <div class="details-heading">
              <div class="details-title">
                <h2>{{ clienteActual.nombre }}</h2>

                <p>
                  {{ clienteActual.contacto || 'Contacto no registrado' }}
                </p>
              </div>

              <span class="account-status">
                <span
                  class="status-dot"
                  :class="
                    clienteActual.activo
                      ? 'status-active-dot'
                      : 'status-inactive-dot'
                  "
                ></span>

                {{ clienteActual.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <div class="client-actions">
              <button
                type="button"
                class="secondary-button"
                @click="abrirEditarCliente"
              >
                Editar cliente
              </button>

              <button
                type="button"
                :class="
                  clienteActual.activo
                    ? 'danger-outline-button'
                    : 'primary-button'
                "
                :disabled="cambiandoEstado"
                @click="alternarEstadoCliente"
              >
                {{
                  cambiandoEstado
                    ? 'Actualizando...'
                    : clienteActual.activo
                      ? 'Desactivar cuenta'
                      : 'Activar cuenta'
                }}
              </button>
            </div>

            <div class="delivery-panel">
              <h3>
                <span class="location-icon" aria-hidden="true">♧</span>
                DIRECCIÓN DE ENTREGA
              </h3>

              <p class="detail-value">
                {{ clienteActual.direccion || 'Sin dirección registrada' }}
              </p>

              <div class="reference-line">
                <span>Referencia:</span>

                <span>
                  {{ clienteActual.referencia || 'Sin referencia' }}
                </span>
              </div>

              <div v-if="mapaUrl" class="map-placeholder">
                <span class="map-pin" aria-hidden="true">●</span>

                <span>UBICACIÓN REGISTRADA</span>

                <a
                  class="client-map-link"
                  :href="mapaUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver ubicación en el mapa
                </a>
              </div>

              <div v-else class="map-placeholder">
                <span>Este cliente no tiene coordenadas registradas.</span>
              </div>
            </div>

            <div class="contact-grid">
              <div class="contact-field">
                <span>Contacto</span>

                <strong>
                  {{ clienteActual.contacto || 'No registrado' }}
                </strong>
              </div>

              <div class="contact-field">
                <span>Teléfono</span>

                <strong>
                  {{ clienteActual.telefono || 'No registrado' }}
                </strong>
              </div>

              <div class="contact-field email-field">
                <span>Correo</span>

                <strong>
                  {{ clienteActual.correo || 'No registrado' }}
                </strong>
              </div>
            </div>
          </div>

          <div v-else class="detail-placeholder">
            <h2>Selecciona un cliente</h2>
            <p>Selecciona un registro para consultar su información.</p>
          </div>
        </section>

        <!-- HISTORIAL REAL DE PEDIDOS -->
        <section class="order-history card">
          <div class="history-header">
            <h2>Historial de pedidos</h2>
          </div>

          <div v-if="cargandoDetalle" class="loading-state">
            Cargando historial...
          </div>

          <div v-else-if="errorDetalle" class="detail-placeholder">
            <p>{{ errorDetalle }}</p>
          </div>

          <div v-else-if="!clienteActual" class="empty-history">
            <h3>Selecciona un cliente</h3>
            <p>El historial se consulta desde Laravel.</p>
          </div>

          <div
            v-else-if="clienteActual.pedidos.length === 0"
            class="empty-history"
          >
            <div class="history-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="5" y="3" width="14" height="18" rx="1" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>

            <h3>Sin pedidos registrados</h3>
            <p>Este cliente todavía no tiene pedidos asociados.</p>
          </div>

          <div v-else class="orders-list">
            <article
              v-for="pedido in clienteActual.pedidos"
              :key="pedido.id"
              class="order-row"
            >
              <div class="order-main">
                <strong>Pedido #{{ pedido.id }}</strong>

                <small v-if="pedido.created_at">
                  {{ formatearFecha(pedido.created_at) }}
                </small>
              </div>

              <span class="order-status">
                {{ pedido.status }}
              </span>

              <strong class="order-total">
                {{ formatearTotal(pedido.total) }}
              </strong>
            </article>
          </div>
        </section>
      </div>
    </div>

    <!-- MODAL CREAR / EDITAR CLIENTE -->
    <div
      v-if="formularioVisible"
      class="modal-backdrop"
      @click.self="cerrarFormulario"
    >
      <section
        class="client-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="
          modoFormulario === 'crear'
            ? 'Crear cliente'
            : 'Editar cliente'
        "
      >
        <div class="modal-header">
          <div>
            <h2>
              {{
                modoFormulario === 'crear'
                  ? 'Crear cliente'
                  : 'Editar cliente'
              }}
            </h2>

            <p>
              Los datos se validan y guardan mediante Laravel.
            </p>
          </div>

          <button
            type="button"
            class="modal-close"
            aria-label="Cerrar"
            :disabled="guardando"
            @click="cerrarFormulario"
          >
            ×
          </button>
        </div>

        <ul
          v-if="erroresFormulario.length"
          class="form-validation-errors"
          role="alert"
        >
          <li
            v-for="(error, indice) in erroresFormulario"
            :key="indice"
          >
            {{ error }}
          </li>
        </ul>

        <form @submit.prevent="guardarCliente">
          <div class="client-form-grid">
            <div class="client-form-field">
              <label for="cliente-name">Nombre del usuario</label>

              <input
                id="cliente-name"
                v-model.trim="formulario.name"
                required
                maxlength="255"
              />
            </div>

            <div class="client-form-field">
              <label for="cliente-username">Usuario</label>

              <input
                id="cliente-username"
                v-model.trim="formulario.username"
                required
                maxlength="255"
                autocomplete="username"
              />
            </div>

            <div class="client-form-field">
              <label for="cliente-email">Correo</label>

              <input
                id="cliente-email"
                v-model.trim="formulario.email"
                type="email"
                required
                maxlength="255"
                autocomplete="email"
              />
            </div>

            <div class="client-form-field">
              <label for="cliente-business">Negocio</label>

              <input
                id="cliente-business"
                v-model.trim="formulario.business_name"
                required
                maxlength="255"
              />
            </div>

            <div class="client-form-field">
              <label for="cliente-contact">Contacto</label>

              <input
                id="cliente-contact"
                v-model.trim="formulario.contact_name"
                required
                maxlength="255"
              />
            </div>

            <div class="client-form-field">
              <label for="cliente-phone">Teléfono</label>

              <input
                id="cliente-phone"
                v-model.trim="formulario.phone"
                required
                maxlength="20"
              />
            </div>

            <div class="client-form-field full-width">
              <label for="cliente-address">Dirección</label>

              <input
                id="cliente-address"
                v-model.trim="formulario.address"
                required
                maxlength="255"
              />
            </div>

            <div class="client-form-field full-width">
              <label for="cliente-reference">
                Referencia (opcional)
              </label>

              <input
                id="cliente-reference"
                v-model.trim="formulario.address_reference"
                maxlength="255"
              />
            </div>

            <div class="client-form-field">
              <label for="cliente-latitude">
                Latitud (opcional)
              </label>

              <input
                id="cliente-latitude"
                v-model="formulario.latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
              />
            </div>

            <div class="client-form-field">
              <label for="cliente-longitude">
                Longitud (opcional)
              </label>

              <input
                id="cliente-longitude"
                v-model="formulario.longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
              />
            </div>

            <template v-if="modoFormulario === 'crear'">
              <div class="client-form-field">
                <label for="cliente-password">Contraseña</label>

                <input
                  id="cliente-password"
                  v-model="formulario.password"
                  type="password"
                  required
                  minlength="8"
                  autocomplete="new-password"
                />
              </div>

              <div class="client-form-field">
                <label for="cliente-password-confirmation">
                  Confirmar contraseña
                </label>

                <input
                  id="cliente-password-confirmation"
                  v-model="formulario.password_confirmation"
                  type="password"
                  required
                  minlength="8"
                  autocomplete="new-password"
                />
              </div>
            </template>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="secondary-button"
              :disabled="guardando"
              @click="cerrarFormulario"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="primary-button"
              :disabled="guardando"
            >
              {{
                guardando
                  ? 'Guardando...'
                  : modoFormulario === 'crear'
                    ? 'Crear cliente'
                    : 'Guardar cambios'
              }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.clients-page {
  min-height: 100vh;
  padding: 25px 26px 32px;
  background: #f1f4fa;
  color: #10284b;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.eyebrow {
  margin-bottom: 6px;
  color: #526b8f;
  font-size: 10px;
  letter-spacing: 0.5px;
}

.page-header h1 {
  margin: 0;
  color: #10284b;
  font-size: 29px;
  font-weight: 750;
  letter-spacing: -0.7px;
}

.clients-layout {
  display: grid;
  grid-template-columns: minmax(275px, 0.74fr) minmax(0, 1.65fr);
  align-items: start;
  gap: 13px;
  width: 100%;
}

.card {
  min-width: 0;
  border: 1px solid #dce5f1;
  border-radius: 12px;
  background: #fff;
}

.clients-list {
  min-height: 515px;
  padding: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 39px;
  padding: 0 12px;
  border: 1px solid #d6e1ef;
  border-radius: 8px;
  background: #fff;
}

.search-icon {
  color: #647e9f;
  font-size: 21px;
  line-height: 1;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: #142f53;
  background: transparent;
  font-size: 12px;
}

.search-box input::placeholder {
  color: #7487a2;
}

.filter-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
  margin-top: 10px;
  padding: 3px;
  border-radius: 8px;
  background: #edf1f6;
}

.filter-tabs button {
  min-width: 0;
  min-height: 32px;
  padding: 5px 2px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #506783;
  background: transparent;
  font-size: 10px;
  white-space: nowrap;
  cursor: pointer;
}

.filter-tabs button.selected {
  border-color: #dce5f1;
  color: #10284b;
  background: #fff;
  font-weight: 700;
}

.empty-clients {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 380px;
  padding: 25px 5px;
  text-align: center;
}

.empty-search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55px;
  height: 55px;
  margin-bottom: 14px;
  border-radius: 50%;
  color: #718bac;
  background: #f0f5fc;
  font-size: 36px;
}

.empty-clients h2 {
  margin: 0 0 7px;
  color: #10284b;
  font-size: 15px;
}

.empty-clients p {
  margin: 0;
  color: #607795;
  font-size: 12px;
  line-height: 1.65;
}

.secondary-button {
  margin-top: 16px;
  color: #1c3b63;
  background: #fff;
}

.secondary-button,
.primary-button,
.danger-outline-button {
  min-height: 36px;
  padding: 8px 13px;
  border: 1px solid #cbd8e8;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  border-color: #173e69;
  color: #fff;
  background: #173e69;
}

.primary-button:hover:not(:disabled) {
  background: #245481;
}

.secondary-button {
  border-color: #d2dfef;
}

.danger-outline-button {
  border-color: #e6b9b5;
  color: #a63e36;
  background: #fff;
}

.primary-button:disabled,
.secondary-button:disabled,
.danger-outline-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.client-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 6px;
  padding: 9px 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.client-row-selected {
  border-color: #9aacc6;
  background: #f0f4fa;
}

.client-avatar {
  display: flex;
  flex: 0 0 29px;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  border-radius: 7px;
  color: #385372;
  background: #e6ecf5;
  font-size: 10px;
  font-weight: 700;
}

.client-row-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.client-row-info strong,
.client-row-info small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-row-info strong {
  color: #142d4d;
  font-size: 11px;
}

.client-row-info small {
  color: #73839a;
  font-size: 9px;
}

.client-status {
  font-size: 9px;
  font-weight: 700;
}

.status-active {
  color: #207653;
}

.status-inactive {
  color: #b45a38;
}

.client-details-column {
  display: flex;
  flex-direction: column;
  gap: 13px;
  min-width: 0;
}

.client-details {
  padding: 16px;
}

.details-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 17px;
}

.details-title {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding-top: 2px;
}

.details-title h2 {
  margin: 0;
  color: #142d4d;
  font-size: 16px;
}

.details-title p {
  margin: 0;
  color: #74849a;
  font-size: 11px;
}

.account-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 9px 11px;
  border-radius: 7px;
  color: #526b85;
  background: #edf1f5;
  font-size: 10px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a9b7c8;
}

.status-active-dot {
  background: #27845a;
}

.status-inactive-dot {
  background: #c64a43;
}

.delivery-panel {
  padding: 14px 12px 12px;
  border: 1px solid #ffdc81;
  border-radius: 10px;
  background: #fff9e7;
}

.delivery-panel h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: #a36d00;
  font-size: 10px;
  font-weight: 750;
}

.location-icon {
  font-size: 15px;
}

.detail-value {
  margin: 0 0 12px;
  color: #526783;
  font-size: 11px;
}

.reference-line {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: #75849a;
  font-size: 9px;
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 130px;
  border: 1px dashed #efbd45;
  border-radius: 8px;
  color: #6f7f98;
  background: #fff2c9;
  font-size: 10px;
}

.map-pin {
  font-size: 25px;
}

.client-map-link {
  display: inline-block;
  margin-top: 8px;
  color: #245481;
  font-size: 11px;
  font-weight: 700;
  text-decoration: underline;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px 20px;
  margin-top: 19px;
}

.contact-field {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: #75849b;
  font-size: 9px;
}

.contact-field strong {
  overflow-wrap: anywhere;
  color: #526783;
  font-size: 11px;
  font-weight: 500;
}

.email-field {
  grid-column: 1 / -1;
}

.order-history {
  min-height: 225px;
  padding: 15px 16px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.history-header h2 {
  margin: 0;
  color: #10284b;
  font-size: 15px;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 145px;
  padding: 15px 0 8px;
  text-align: center;
}

.history-icon {
  width: 35px;
  height: 35px;
  margin-bottom: 9px;
  color: #7790b2;
}

.history-icon svg {
  width: 100%;
  height: 100%;
}

.empty-history h3 {
  margin: 0 0 7px;
  color: #536e91;
  font-size: 12px;
  font-weight: 500;
}

.empty-history p {
  margin: 0;
  color: #8493a8;
  font-size: 10px;
}

.loading-state,
.detail-placeholder {
  padding: 28px 14px;
  color: #607795;
  text-align: center;
  font-size: 12px;
}

.detail-placeholder h2 {
  margin: 0 0 8px;
  color: #536e91;
  font-size: 15px;
}

.detail-placeholder p {
  margin: 0;
  line-height: 1.5;
}

.page-actions,
.client-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.client-actions {
  justify-content: flex-end;
  margin: 0 0 14px;
}

.alert-message {
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid #d7e2ef;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.45;
}

.alert-error {
  border-color: #efc4c0;
  color: #8f302a;
  background: #fff3f2;
}

.alert-success {
  border-color: #b9dfca;
  color: #216744;
  background: #f0faf4;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.order-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border: 1px solid #e0e7f0;
  border-radius: 8px;
  background: #fff;
}

.order-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.order-main strong {
  color: #183556;
  font-size: 11px;
}

.order-main small {
  color: #74849a;
  font-size: 10px;
}

.order-status {
  color: #526783;
  font-size: 10px;
  overflow-wrap: anywhere;
}

.order-total {
  color: #183556;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* FORMULARIO */

.modal-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgb(12 28 48 / 55%);
}

.client-modal {
  width: min(720px, 100%);
  max-height: min(90vh, 850px);
  overflow: auto;
  padding: 22px;
  border: 1px solid #dce5f1;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 18px 55px rgb(10 30 55 / 22%);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.modal-header h2 {
  margin: 0;
  color: #142d4d;
  font-size: 19px;
}

.modal-header p {
  margin: 6px 0 0;
  color: #71839b;
  font-size: 11px;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: 1px solid #dce5f1;
  border-radius: 7px;
  color: #526783;
  background: #fff;
  font-size: 18px;
  cursor: pointer;
}

.client-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.client-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.client-form-field.full-width {
  grid-column: 1 / -1;
}

.client-form-field label {
  color: #526783;
  font-size: 11px;
  font-weight: 700;
}

.client-form-field input {
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid #d5e0ee;
  border-radius: 7px;
  outline: none;
  color: #183556;
  background: #fff;
  font: inherit;
  font-size: 12px;
}

.client-form-field input:focus {
  border-color: #527da8;
  box-shadow: 0 0 0 2px rgb(82 125 168 / 12%);
}

.form-validation-errors {
  margin: 0 0 14px;
  padding: 10px 12px 10px 28px;
  border: 1px solid #efc4c0;
  border-radius: 8px;
  color: #8f302a;
  background: #fff3f2;
  font-size: 11px;
}

.form-validation-errors li + li {
  margin-top: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 20px;
}

@media (min-width: 1500px) {
  .clients-page {
    padding: 30px 28px;
  }

  .clients-layout {
    grid-template-columns: minmax(320px, 0.74fr) minmax(0, 1.65fr);
    gap: 16px;
  }

  .clients-list {
    padding: 14px;
  }

  .client-details {
    padding: 20px;
  }

  .delivery-panel {
    padding: 16px;
  }

  .map-placeholder {
    min-height: 150px;
  }

  .order-history {
    min-height: 240px;
    padding: 19px 20px;
  }
}

@media (max-width: 900px) {
  .clients-page {
    padding: 20px 16px;
  }

  .clients-layout {
    grid-template-columns: minmax(225px, 0.8fr) minmax(0, 1.4fr);
    gap: 10px;
  }

  .client-details {
    padding: 12px;
  }

  .contact-grid {
    grid-template-columns: 1fr;
  }

  .email-field {
    grid-column: auto;
  }

  .map-placeholder {
    min-height: 110px;
  }
}

@media (max-width: 620px) {
  .clients-page {
    padding: 22px 14px 28px;
  }

  .page-header {
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 27px;
  }

  .page-actions {
    flex-shrink: 0;
  }

  .clients-layout {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .clients-list,
  .client-details-column {
    width: 100%;
  }

  .clients-list {
    min-height: 270px;
    padding: 12px;
  }

  .empty-clients {
    min-height: 195px;
  }

  .client-details {
    padding: 13px;
  }

  .details-heading {
    gap: 8px;
  }

  .delivery-panel {
    padding: 13px 10px 10px;
  }

  .map-placeholder {
    min-height: 110px;
  }

  .contact-grid {
    grid-template-columns: 1fr 1fr;
    gap: 14px 8px;
  }

  .contact-field {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .email-field {
    grid-column: 1 / -1;
  }

  .order-history {
    min-height: 205px;
    padding: 14px 12px;
  }

  .order-row {
    grid-template-columns: 1fr auto;
  }

  .order-status {
    grid-column: 1;
  }

  .order-total {
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  .client-form-grid {
    grid-template-columns: 1fr;
  }

  .client-form-field.full-width {
    grid-column: auto;
  }

  .client-modal {
    padding: 17px;
  }
}

@media (max-width: 380px) {
  .clients-page {
    padding-right: 10px;
    padding-left: 10px;
  }

  .filter-tabs button {
    font-size: 9px;
  }

  .account-status {
    padding: 7px;
    font-size: 9px;
  }
}
</style>
