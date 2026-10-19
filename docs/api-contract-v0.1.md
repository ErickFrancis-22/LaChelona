# Contrato API v0.1 — LaChelonApp

> Importante para Sprint 1.

## 1. Objetivo

Este documento define el contrato inicial de comunicación entre los clientes frontend (Vue e Ionic) y la API REST desarrollada en Laravel.

El contrato permite que los equipos frontend trabajen con datos mock mientras los endpoints reales son implementados.

## 2. Convenciones generales

- Formato de intercambio: JSON
- Autenticación: Bearer Token
- Base URL local: `http://127.0.0.1:8000/api`

Los endpoints protegidos deben enviar:

```http
Authorization: Bearer {token}
Accept: application/json
```

## 3. Códigos HTTP utilizados

| Código | Significado |
|---|---|
| 200 | Solicitud procesada correctamente |
| 201 | Recurso creado correctamente |
| 401 | Usuario no autenticado |
| 403 | Usuario autenticado sin permisos |
| 404 | Recurso no encontrado |
| 422 | Error de validación |

## 4. Formato de errores

### Error de validación — 422

```json
{
  "message": "Los datos proporcionados no son válidos.",
  "errors": {
    "campo": [
      "Mensaje de error."
    ]
  }
}
```

### No autenticado — 401

```json
{
  "message": "No autenticado."
}
```

### Sin permisos — 403

```json
{
  "message": "No tiene permisos para realizar esta acción."
}
```

---

## 5. Autenticación

### 5.1 Iniciar sesión

**Historias relacionadas:** HU01, HU02

**Método:** `POST /api/auth/login`

**Autenticación:** No requerida.

### Request

```json
{
  "username": "cliente01",
  "password": "password123"
}
```

### Response — 200

```json
{
  "token": "1|token-ejemplo",
  "user": {
    "id": 1,
    "name": "Distribuidora Ejemplo",
    "username": "cliente01",
    "role": "CLIENT"
  }
}
```

Ejemplo para administrador:

```json
{
  "token": "2|token-ejemplo",
  "user": {
    "id": 2,
    "name": "Administrador",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### Errores posibles

- `422` — Campos requeridos o formato inválido.
- `401` — Usuario o contraseña incorrectos.
- `403` — Usuario inactivo.

### 5.2 Cerrar sesión

Endpoint utilizado para invalidar el token de autenticación de Laravel Sanctum.

**Método:** `POST /api/auth/logout`

**Autenticación:** Bearer Token requerida.

### Request

No requiere cuerpo JSON.

### Response — 200

```json
{
  "message": "Sesión cerrada correctamente."
}
```

### Errores posibles

- `401` — Token inexistente o inválido.

---

## 6. Productos

### 6.1 Consultar productos disponibles

**Historia relacionada:** HU03

**Método:** `GET /api/products`

**Autenticación:** Bearer Token requerida.

### Request

No requiere cuerpo JSON.

### Response — 200

```json
{
  "data": [
    {
      "id": 1,
      "code": "CC600-12",
      "name": "Coca-Cola 600 ml",
      "category": {
        "id": 1,
        "name": "Sodas"
      },
      "package_type": "FARDO",
      "units_per_package": 12,
      "sale_price": 8.50,
      "stock": 120,
      "image_url": "/images/coca-cola-600.jpg",
      "available": true
    }
  ]
}
```

### Errores posibles

- `401` — Usuario no autenticado.

### 6.2 Consultar producto por ID

**Método:** `GET /api/products/{id}`

**Autenticación:** Bearer Token requerida.

### Response — 200

```json
{
  "data": {
    "id": 1,
    "code": "CC600-12",
    "name": "Coca-Cola 600 ml",
    "description": "Bebida gaseosa Coca-Cola",
    "category": {
      "id": 1,
      "name": "Sodas"
    },
    "package_type": "FARDO",
    "units_per_package": 12,
    "sale_price": 8.50,
    "stock": 120,
    "image_url": "/images/coca-cola-600.jpg",
    "available": true
  }
}
```

### Errores posibles

- `401` — Usuario no autenticado.
- `404` — Producto no encontrado.

---

## 7. Endpoints previstos para siguientes historias

### HU04 — Carrito de compras

En la versión inicial, el carrito será administrado localmente por la aplicación Ionic.

No se define un endpoint independiente `/cart` en API v0.1.

Los productos del carrito serán enviados a la API al crear una orden.

### HU16 — Comentarios y observaciones

Los comentarios serán incluidos en el futuro endpoint:

`POST /api/orders`

Ejemplo previsto:

```json
{
  "customer_comment": "Entregar después de las 2 PM",
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "item_comment": "Si es posible entregar frías"
    },
    {
      "product_id": 4,
      "quantity": 1,
      "item_comment": null
    }
  ]
}
```

---

## 8. Resumen de endpoints v0.1

| Método | Ruta | Autenticación | Historia |
|---|---|---|---|
| POST | `/api/auth/login` | No | HU01, HU02 |
| POST | `/api/auth/logout` | Bearer | HU01, HU02 |
| GET | `/api/products` | Bearer | HU03 |
| GET | `/api/products/{id}` | Bearer | HU03 |

## 9. Endpoints previstos

| Método | Ruta | Historia |
|---|---|---|
| POST | `/api/orders` | HU04, HU05, HU16 |

> El contrato podrá ampliarse en versiones posteriores sin modificar el propósito de esta versión inicial.