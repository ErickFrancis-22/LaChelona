import api from './api'
import type { PedidoDetalle } from './orders'

export interface Comprobante {
  id?: number
  invoice_number: string
  order_id: number
  issue_date: string
  total: number | string
  order?: PedidoDetalle | null
}

function esRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extraerComprobante(payload: unknown): Comprobante {
  let resultado: unknown = payload

  // Laravel puede responder directamente o dentro de { data: ... }.
  // Se admiten hasta dos envoltorios para soportar Resource + respuesta estándar.
  for (let nivel = 0; nivel < 2; nivel += 1) {
    if (esRegistro(resultado) && esRegistro(resultado.data)) {
      resultado = resultado.data
    } else {
      break
    }
  }

  if (
    !esRegistro(resultado) ||
    typeof resultado.invoice_number !== 'string' ||
    (typeof resultado.order_id !== 'number' &&
      typeof resultado.order_id !== 'string') ||
    typeof resultado.issue_date !== 'string' ||
    (typeof resultado.total !== 'number' &&
      typeof resultado.total !== 'string')
  ) {
    throw new Error(
      'Laravel no devolvió la estructura esperada del comprobante: invoice_number, order_id, issue_date y total.',
    )
  }

  return resultado as unknown as Comprobante
}

// Consulta el comprobante existente de un pedido.
// No genera ni modifica datos.
export async function obtenerComprobante(
  id: number,
): Promise<Comprobante> {
  const response = await api.get<unknown>(
    `/admin/orders/${id}/invoice`,
  )

  return extraerComprobante(response.data)
}

// Solicita a Laravel la generación del comprobante.
// Laravel valida el estado del pedido y evita la creación de duplicados.
export async function generarComprobante(
  id: number,
): Promise<Comprobante> {
  const response = await api.post<unknown>(
    `/admin/orders/${id}/invoice`,
  )

  return extraerComprobante(response.data)
}