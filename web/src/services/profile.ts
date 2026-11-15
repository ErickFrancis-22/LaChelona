
import api from './api'

// Datos para actualizar el nombre del administrador.
export interface ActualizarNombrePayload {
  name: string
}

// Datos esperados por Laravel para cambiar la contraseña.
export interface CambiarContrasenaPayload {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

// Obtener perfil del administrador.
// GET /api/admin/profile
export async function obtenerPerfilAdmin() {
  const respuesta = await api.get('/admin/profile')
  return respuesta.data
}

// Actualizar nombre.
// PUT /api/admin/profile
export async function actualizarPerfilAdmin(
  datos: ActualizarNombrePayload
) {
  const respuesta = await api.put('/admin/profile', datos)
  return respuesta.data
}

// Cambiar contraseña.
// PATCH /api/admin/profile/password
export async function cambiarContrasenaAdmin(
  datos: CambiarContrasenaPayload
) {
  const respuesta = await api.patch(
    '/admin/profile/password',
    datos
  )

  return respuesta.data
}

// Cerrar sesión.
// POST /api/auth/logout
export async function cerrarSesionAdmin(): Promise<void> {
  await api.post('/auth/logout')

  // Eliminar el token solamente si Laravel confirma
  // que el cierre de sesión fue exitoso.
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')

  sessionStorage.removeItem('token')
  sessionStorage.removeItem('usuario')
}
