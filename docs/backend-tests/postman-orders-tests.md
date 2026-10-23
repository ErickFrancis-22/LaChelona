# Reporte de Pruebas API: Gestión de Pedidos (Sprint 2)

## Índice

- [Bloque 1: Creación de Pedidos](#bloque-1-creación-de-pedidos)
- [Bloque 2: Consulta de Pedidos](#bloque-2-consulta-de-pedidos)
- [Bloque 3: Modificación de Pedidos](#bloque-3-modificación-de-pedidos)
- [Bloque 4: Cancelación de Pedidos](#bloque-4-cancelación-de-pedidos)
- [Bloque 5: Verificaciones de Base de Datos](#bloque-5-verificaciones-de-base-de-datos)

---

## Bloque 1: Creación de Pedidos

### Test 1: Crear pedido válido

**Objetivo:** Verificar que un cliente autenticado pueda crear correctamente un pedido con varios productos válidos y stock disponible.

**Endpoint:** `POST /api/orders`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 4,
      "quantity": 1
    }
  ],
  "customer_comment": "Pedido de prueba TT32"
}
```

#### Resultado esperado

- Código HTTP 201 Created.

- Crear un pedido en estado PENDING.

- Calcular el total desde el backend.

- Crear dos registros en order_details.

- Guardar la dirección y coordenadas del cliente como snapshot.

- No descontar stock.

#### Resultado obtenido

- Código HTTP 201 Created.

- Pedido creado con ID 2.

- Estado PENDING.

- Total calculado: $23.50.

- Coca-Cola 600 ml: Cantidad: 2, Precio unitario: $8.50, Subtotal: $17.00.

- Agua Cristal 600 ml: Cantidad: 1, Precio unitario: $6.50, Subtotal: $6.50.

- Se crearon correctamente los detalles del pedido.

- Se almacenaron dirección, referencia y coordenadas de entrega.

**Estado:** **APROBADO**

**Observaciones:** El backend calculó correctamente los precios, subtotales y total. El pedido quedó en estado PENDING.

### Test 2: Cantidad inválida

**Objetivo:** Verificar que la API rechace pedidos con cantidades menores a 1.

**Endpoint:** `POST /api/orders`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 0
    }
  ],
  "customer_comment": "Prueba cantidad inválida"
}
```

#### Resultado esperado

- Código HTTP 422 Unprocessable Entity.

- La API debe rechazar la solicitud e indicar que la cantidad mínima permitida es 1.

- No debe crearse ningún pedido.

#### Resultado obtenido

- Código HTTP 422 Unprocessable Entity.

- Se recibió el mensaje: The items.0.quantity field must be at least 1.

- La validación se aplicó correctamente.

**Estado:**  **APROBADO**

**Observaciones:** La validación del request evita que cantidades inválidas lleguen a la lógica de negocio.

### Test 3: Producto inexistente

**Objetivo:** Verificar que la API rechace la creación de pedidos cuando se envía un producto que no existe.

**Endpoint:** `POST /api/orders`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 999,
      "quantity": 1
    }
  ],
  "customer_comment": "Prueba producto inexistente"
}
```

#### Resultado esperado

- Código HTTP 422 Unprocessable Entity.

- La API debe rechazar la solicitud e indicar que el producto no existe o está inactivo.

- No debe crearse ningún pedido.

#### Resultado obtenido

- Código HTTP 422 Unprocessable Entity.

- Se recibió el mensaje: El producto con ID 999 no existe o está inactivo.

- El error fue devuelto dentro del campo products.

**Estado:**  **APROBADO**

**Observaciones:** La API valida correctamente que los productos enviados en el pedido existan y estén disponibles para su uso.

### Test 4: Producto inactivo

**Objetivo:** Verificar que la API rechace la creación de pedidos cuando el producto solicitado está inactivo.

**Endpoint:** `POST /api/orders`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 3,
      "quantity": 1
    }
  ],
  "customer_comment": "Prueba producto inactivo"
}
```

#### Resultado esperado

- Código HTTP 422 Unprocessable Entity.

- La API debe rechazar la solicitud e indicar que el producto no existe o está inactivo.

- No debe crearse ningún pedido.

#### Resultado obtenido

- Código HTTP 422 Unprocessable Entity.

- Se recibió el mensaje: El producto con ID 3 no existe o está inactivo.

- El error fue devuelto dentro del campo products.

**Estado:**  **APROBADO**

**Observaciones:** La API evita correctamente que productos inactivos puedan utilizarse para crear pedidos.

### Test 5: Stock insuficiente

**Objetivo:** Verificar que la API rechace la creación de pedidos cuando la cantidad solicitada supera el stock disponible.

**Endpoint:** `POST /api/orders`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 9999
    }
  ],
  "customer_comment": "Prueba stock insuficiente"
}
```

#### Resultado esperado

- Código HTTP 422 Unprocessable Entity.

- La API debe rechazar la creación del pedido e indicar que no existe stock suficiente.

- No debe crearse ningún pedido.

#### Resultado obtenido

- Código HTTP 422 Unprocessable Entity.

- Se recibió el mensaje: Stock insuficiente para Coca-Cola 600 ml.

- El error fue devuelto dentro del campo products.

**Estado:**  **APROBADO**

**Observaciones:** La API valida correctamente el stock disponible antes de permitir la creación de un pedido.

### Test 6: Petición sin token

**Objetivo:** Verificar que la API bloquee la creación de pedidos cuando la petición no incluye un token de autenticación.

**Endpoint:** `POST /api/orders`

**Headers:**

```http
Accept: application/json
Content-Type: application/json
```

(Sin header `Authorization`)

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    }
  ],
  "customer_comment": "Prueba sin token"
}
```

#### Resultado esperado

- Código HTTP 401 Unauthorized.

- La API debe rechazar la petición e indicar que el usuario no está autenticado.

- No debe crearse ningún pedido.

#### Resultado obtenido

- Código HTTP 401 Unauthorized.

- Se recibió la respuesta: Unauthenticated.

**Estado:**  **APROBADO**

**Observaciones:** El middleware auth:sanctum protege correctamente el endpoint de creación de pedidos.

## Bloque 2: Consulta de Pedidos

### Test 7: Historial del cliente autenticado

**Objetivo:** Verificar que un cliente autenticado pueda consultar únicamente su historial de pedidos.

**Endpoint:** `GET /api/orders`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
```

#### Resultado esperado

- Código HTTP 200 OK.

- La API debe devolver los pedidos pertenecientes al cliente autenticado.

- Los pedidos deben aparecer ordenados del más reciente al más antiguo.

- Debe incluir información básica como ID, estado, total, comentario y fecha de creación.

#### Resultado obtenido

- Código HTTP 200 OK.

- Se devolvieron correctamente los pedidos del cliente autenticado.

- El pedido más reciente fue el ID 2 con estado PENDING y total $23.50.

- También se devolvió el pedido ID 1 con estado CANCELLED y total $21.50.

- Los resultados fueron mostrados del más reciente al más antiguo.

**Estado:**  **APROBADO**

**Observaciones:** El endpoint devuelve correctamente el historial del cliente autenticado y mantiene el orden descendente por fecha de creación.

### Test 8: Detalle de un pedido propio

**Objetivo:** Verificar que el cliente autenticado pueda consultar el detalle completo de uno de sus propios pedidos.

**Endpoint:** `GET /api/orders/2`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
```

#### Resultado esperado

- Código HTTP 200 OK.

- La API debe devolver únicamente el pedido perteneciente al cliente autenticado.

- Debe incluir información general del pedido y datos de entrega.

- Debe incluir los productos asociados en details mostrando cantidad, precio unitario y subtotal.

#### Resultado obtenido

- Código HTTP 200 OK.

- Se devolvió correctamente el pedido ID 2 (Estado: PENDING, Total: $23.50).

- Se devolvió correctamente la dirección, referencia y coordenadas de entrega.

- Detalle 1: Coca-Cola 600 ml, cantidad 2, subtotal $17.00.

- Detalle 2: Agua Cristal 600 ml, cantidad 1, subtotal $6.50.

- Los productos relacionados fueron incluidos correctamente dentro de cada detalle.

**Estado:**  **APROBADO**

**Observaciones:** La relación orders -> order_details -> products se devuelve correctamente y el cliente puede consultar toda la información necesaria de su pedido.

### Test 9: Pedido inexistente

**Objetivo:** Verificar que la API responda correctamente cuando el cliente intenta consultar un pedido que no existe.

**Endpoint:** `GET /api/orders/999`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
```

#### Resultado esperado

- Código HTTP 404 Not Found.

- La API debe indicar que el pedido no fue encontrado.

#### Resultado obtenido

- Código HTTP 404 Not Found.

- Se recibió el mensaje: Pedido no encontrado.

**Estado:**  **APROBADO**

**Observaciones:** La API maneja correctamente la consulta de pedidos inexistentes y devuelve una respuesta JSON clara.

### Test 10: Intento de consultar pedido de otro cliente

**Objetivo:** Verificar que un cliente autenticado no pueda consultar pedidos pertenecientes a otro cliente.

**Endpoint:** `GET /api/orders/2`

**Headers:**

```http
Authorization: Bearer {token de otro cliente}
Accept: application/json
```

#### Resultado esperado

- Código HTTP 404 Not Found.

- La API no debe revelar información del pedido.

- Debe responder como si el pedido no existiera para ese cliente.

#### Resultado obtenido

- Código HTTP 404 Not Found.

- Se recibió el mensaje: Pedido no encontrado.

**Estado:**  **APROBADO**

**Observaciones:** La API restringe correctamente el acceso a los pedidos según el cliente autenticado y evita exponer información de otros usuarios.

## Bloque 3: Modificación de Pedidos

### Test 11: Modificar cantidades de pedido PENDING

**Objetivo:** Verificar que un cliente pueda modificar las cantidades de un pedido mientras su estado sea PENDING.

**Endpoint:** `PUT /api/orders/2`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    },
    {
      "product_id": 4,
      "quantity": 2
    }
  ],
  "customer_comment": "Pedido modificado durante TT32"
}
```

#### Resultado esperado

- Código HTTP 200 OK.

- El pedido debe mantenerse en estado PENDING.

- Deben actualizarse las cantidades, recalcularse los subtotales, el total y el comentario.

#### Resultado obtenido

- Código HTTP 200 OK.

- Se recibió el mensaje: Pedido actualizado correctamente.

- El pedido ID 2 permaneció en estado PENDING.

- Coca-Cola 600 ml: Cantidad 1, Precio unitario $8.50, Subtotal $8.50.

- Agua Cristal 600 ml: Cantidad 2, Precio unitario $6.50, Subtotal $13.00.

- Total recalculado correctamente: $21.50.

- El comentario fue actualizado correctamente.

**Estado:**  **APROBADO**

**Observaciones:** La API actualizó correctamente las cantidades y recreó los detalles del pedido, generando nuevos registros con los valores recalculados.

### Test 12: Agregar y eliminar productos

**Objetivo:** Verificar que un cliente pueda modificar los productos incluidos en un pedido PENDING, eliminando productos existentes y agregando nuevos.

**Endpoint:** `PUT /api/orders/2`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    },
    {
      "product_id": 2,
      "quantity": 2
    }
  ],
  "customer_comment": "Prueba agregar y eliminar productos TT32"
}
```

#### Resultado esperado

- Código HTTP 200 OK.

- El pedido debe permanecer en estado PENDING.

- Agua Cristal debe ser eliminada de order_details y Sprite debe agregarse correctamente.

- Los subtotales y el total deben recalcularse.

#### Resultado obtenido

- Código HTTP 200 OK.

- Se recibió el mensaje: Pedido actualizado correctamente.

- El pedido ID 2 permaneció en estado PENDING.

- Coca-Cola 600 ml: Cantidad 1, Subtotal $8.50.

- Sprite 600 ml: Cantidad 2, Subtotal $16.50.

- Agua Cristal dejó de aparecer en los detalles.

- Total recalculado correctamente: $25.00.

**Estado:**  **APROBADO**

**Observaciones:** La API permite reemplazar correctamente los productos de un pedido pendiente y mantiene sincronizados los registros.

### Test 13: Recalcular total del pedido

**Objetivo:** Verificar que la API recalcule correctamente los subtotales y el total cuando se modifican las cantidades de los productos de un pedido PENDING.

**Endpoint:** `PUT /api/orders/2`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 3
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ],
  "customer_comment": "Prueba recálculo de total TT32"
}
```

#### Resultado esperado

- Código HTTP 200 OK.

- El pedido debe permanecer en estado PENDING.

- Coca-Cola 600 ml: 3 x $8.50 = $25.50.

- Sprite 600 ml: 1 x $8.25 = $8.25.

- Total esperado: $33.75.

#### Resultado obtenido

- Código HTTP 200 OK.

- El pedido permaneció en estado PENDING.

- Coca-Cola 600 ml: Cantidad 3, Subtotal $25.50.

- Sprite 600 ml: Cantidad 1, Subtotal $8.25.

- Total recalculado correctamente: $33.75.

**Estado:**  **APROBADO**

**Observaciones:** La API recalcula correctamente los subtotales y el total utilizando los precios actuales almacenados en la base de datos.

### Test 14: Stock insuficiente al editar

**Objetivo:** Verificar que la API rechace la modificación de un pedido PENDING cuando la nueva cantidad solicitada supera el stock disponible.

**Endpoint:** `PUT /api/orders/2`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 9999
    }
  ],
  "customer_comment": "Prueba stock insuficiente al editar TT32"
}
```

#### Resultado esperado

- Código HTTP 422 Unprocessable Entity.

- La API debe rechazar la modificación e indicar que el producto no tiene stock suficiente.

- El pedido debe conservar sus datos anteriores.

#### Resultado obtenido

- Código HTTP 422 Unprocessable Entity.

- Se recibió el mensaje: Stock insuficiente para Coca-Cola 600 ml.

- El error fue devuelto dentro del campo products.

**Estado:**  **APROBADO**

**Observaciones:** La API vuelve a validar el stock durante la edición y evita guardar cantidades superiores a la disponibilidad del producto.

### Test 15: Intentar editar un pedido no PENDING

**Objetivo:** Verificar que la API impida modificar pedidos cuyo estado ya no sea PENDING.

**Endpoint:** `PUT /api/orders/1`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

**Body:**

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    }
  ],
  "customer_comment": "Intento modificar pedido cancelado TT32"
}
```

#### Resultado esperado

- Código HTTP 422 Unprocessable Entity.

- La API debe rechazar la modificación e indicar que únicamente los pedidos pendientes pueden modificarse.

#### Resultado obtenido

- Código HTTP 422 Unprocessable Entity.

- Se recibió el mensaje: Solo los pedidos pendientes pueden modificarse.

- El error fue devuelto dentro del campo order.

**Estado:**  **APROBADO**

**Observaciones:** La regla de negocio que restringe la edición a pedidos PENDING funciona correctamente.

## Bloque 4: Cancelación de Pedidos

### Test 16: Cancelar pedido PENDING

**Objetivo:** Verificar que un cliente pueda cancelar correctamente un pedido mientras su estado sea PENDING.

**Endpoint:** `PATCH /api/orders/2/cancel`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
```

#### Resultado esperado

- Código HTTP 200 OK.

- El pedido debe cambiar de estado PENDING a CANCELLED.

- Debe registrarse la fecha de cancelación y el usuario responsable.

- No debe modificarse el total del pedido.

#### Resultado obtenido

- Código HTTP 200 OK.

- Se recibió el mensaje: Pedido cancelado correctamente.

- El pedido ID 2 cambió correctamente a estado CANCELLED.

- Total conservado: $33.75.

- cancelled_at fue registrado correctamente.

- cancelled_by quedó registrado con el usuario ID 3.

**Estado:** **APROBADO**

**Observaciones:** La cancelación registra correctamente la fecha y el usuario responsable, manteniendo intacta la información económica del pedido.

### Test 17: Intentar cancelar nuevamente

**Objetivo:** Verificar que la API impida cancelar nuevamente un pedido que ya se encuentra en estado CANCELLED.

**Endpoint:** `PATCH /api/orders/2/cancel`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
```

#### Resultado esperado

- Código HTTP 422 Unprocessable Entity.

- La API debe rechazar una segunda cancelación e indicar que únicamente los pedidos pendientes pueden cancelarse.

#### Resultado obtenido

- Código HTTP 422 Unprocessable Entity.

- Se recibió el mensaje: Solo los pedidos pendientes pueden cancelarse.

- El error fue devuelto dentro del campo order.

**Estado:**  **APROBADO**

**Observaciones:** La API evita correctamente que un pedido ya cancelado vuelva a procesar una operación de cancelación.

### Test 18: Intentar cancelar un pedido no editable

**Objetivo:** Verificar que la API impida cancelar pedidos cuyo estado ya no sea PENDING.

**Endpoint:** `PATCH /api/orders/1/cancel`

**Headers:**

```http
Authorization: Bearer {token}
Accept: application/json
```

#### Resultado esperado

- Código HTTP 422 Unprocessable Entity.

- La API debe rechazar la operación e indicar que únicamente los pedidos pendientes pueden cancelarse.

#### Resultado obtenido

- Código HTTP 422 Unprocessable Entity.

- Se recibió el mensaje: Solo los pedidos pendientes pueden cancelarse.

- El error fue devuelto dentro del campo order.

**Estado:**  **APROBADO**

**Observaciones:** La regla de negocio de cancelación se aplica correctamente a pedidos que ya no se encuentran en estado PENDING.

## Bloque 5: Verificaciones de Base de Datos

### Test 19: Verificación final de persistencia, relaciones y stock

**Objetivo:** Verificar que los datos generados durante las pruebas se hayan persistido correctamente en Supabase, que las relaciones sean correctas y que el stock no haya sido descontado.

#### Verificaciones realizadas

##### Tabla orders

- Pedido ID 2 almacenado correctamente.

- Estado final: CANCELLED.

- Total: $33.75.

- El pedido conserva correctamente la información actualizada durante las pruebas.

##### Tabla order_details (Para el pedido ID 2)

- Producto ID 1 (Coca-Cola 600 ml): Cantidad 3, Precio unitario $8.50, Subtotal $25.50.

- Producto ID 2 (Sprite 600 ml): Cantidad 1, Precio unitario $8.25, Subtotal $8.25.

- Cálculo matemático verificado: $25.50 + $8.25 = $33.75.

##### Tabla products

- Se verificó que el stock permaneciera sin cambios:

- Coca-Cola 600 ml: 120

- Sprite 600 ml: 80

#### Resultado esperado

- Persistencia correcta en orders y order_details.

- Relaciones correctas entre pedidos y productos.

- Total consistente con los subtotales.

- Stock sin modificaciones mientras el pedido no haya sido confirmado.

#### Resultado obtenido

- Todas las verificaciones fueron satisfactorias.

**Estado:**  **APROBADO**

**Observaciones:** La API mantiene correctamente la integridad de los datos y no descuenta stock durante el estado PENDING, cumpliendo la regla de negocio definida para el Sprint 2.
