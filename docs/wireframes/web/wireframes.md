# pantallas del administrador (Vue 3)

| N.º | Pantalla | Función principal |
|---|---|---|
| 1 | Inicio de sesión | Acceso seguro al panel |
| 2 | Pedidos del día | Seguimiento y cambio de estados de pedidos |
| 3 | Productos | Consultar y administrar el catálogo |
| 4 | Nuevo producto | Registrar productos nuevos |
| 5 | Editar producto | Actualizar información de productos |
| 6 | Categorías | Organizar los productos por categorías |
| 7 | Clientes | Consultar negocios y gestionar su estado |
| 8 | Reportes mensuales | Revisar resultados y descargar PDF |
| 9 | Mi cuenta | Actualizar perfil, contraseña y sesión |

## Descripción de cada pantalla
**Inicio de sesión del administrador**
*Objetivo: permitir que el encargado de la distribuidora ingrese de manera segura al panel web.*
**Elementos que mostrará:**
- Logotipo e identificación de LACHELONAPP.
- Campo de usuario.
- Campo de contraseña, con opción de mostrarla u ocultarla.
- Casilla Mantener sesión iniciada.
- Enlace ¿Olvidaste tu contraseña?.
- Botón Ingresar.
Acciones esperadas: el administrador escribirá sus credenciales y presionará Ingresar. Si son correctas, su cuenta está activa y tiene el rol requerido, podrá acceder al panel. Si los datos son incorrectos o no tiene permisos, aparecerá un mensaje de error y no se permitirá la entrada.
Reglas y consideraciones: únicamente podrán iniciar sesión usuarios con rol ADMIN y active = true. La validación de las credenciales se realizará en Laravel. La opción de recuperación de contraseña está dibujada en el diseño, pero su flujo específico no está detallado en la guía y deberá definirse antes de implementarlo. También deberá definirse el comportamiento exacto de Mantener sesión iniciada.
![pantalla de inicio se seccion de admin LaChelonApp](/docs/wireframes/web/login.jpg)

**Pedidos del día**
*Objetivo: ofrecer una vista rápida de los pedidos registrados y permitir al administrador darles seguimiento durante la jornada.*
**Elementos que mostrará:**
- Título Pedidos del día y fecha seleccionada.
- Buscador por número de pedido o nombre del negocio.
- Selector de fecha (en el diseño aparece Hoy).
- Resumen de pedidos Pendientes, Confirmados, En camino, Entregados y Cancelados.
- Columnas o tarjetas agrupadas por estado, con número de pedido, negocio, hora, cantidad de productos y total.
- Sección separada para los pedidos cancelados.
Acciones esperadas:
1. Buscar un pedido por su número o por el negocio que lo realizó.
2. Consultar los pedidos correspondientes a la fecha seleccionada.
3. Confirmar un pedido pendiente.
4. Marcar en camino un pedido confirmado.
5. Marcar entregado un pedido que está en camino.
6. Abrir el detalle de un pedido para revisar los productos solicitados, cantidades, importes, observaciones del pedido y de sus productos y dirección de entrega.
7. Consultar la ubicación de entrega en un mapa integrado, cuando el pedido tenga coordenadas registradas.
8. Identificar los pedidos cancelados y consultar su estado.
Reglas y consideraciones: el flujo permitido es PENDING → CONFIRMED → IN_TRANSIT → DELIVERED. CANCELLED es un estado fuera de ese flujo y solo aplica cuando el pedido todavía está PENDING. En la interfaz se mostrarán los estados traducidos al español. Los cambios de estado los ejecutará el administrador y deberán avanzar solamente hacia adelante.
Regla clave de inventario: crear un pedido pendiente no descuenta existencias. Al confirmarlo, Laravel tendrá que volver a validar el stock, descontarlo y registrar el movimiento de tipo SALE dentro de una transacción. Si no hay stock suficiente, la confirmación no se completará. La interfaz deberá mostrar el resultado o error correspondiente.
Aclaración sobre el diseño: el wireframe presenta el tablero general, pero no muestra una captura independiente del detalle del pedido o del mapa. Estas funciones están contempladas en la guía técnica y deben diseñarse o integrarse cuando se implemente esta historia.
![pedidos del dia vista admin](/docs/wireframes/web/pedidos_del_dia.jpg)

**Productos**
*Objetivo: permitir al administrador visualizar el catálogo y controlar los productos que ofrece la distribuidora.*
**Elementos que mostrará:**
- Botón Nuevo producto.
- Filtros por categoría, como cervezas, carbonatadas, agua, jugos y tés o energéticas.
- Buscador por nombre o código del producto.
- Tabla con producto, categoría, precio por caja, stock, estado y acciones.
- Aviso de stock bajo para productos cuyo inventario haya alcanzado o esté por debajo del mínimo establecido.
- Controles de paginación.
Acciones esperadas:
1. Consultar todos los productos registrados.
2. Buscar productos y filtrarlos por categoría.
3. Ver el precio, las existencias y si están activos en el catálogo.
4. Identificar productos con poco inventario.
5. Presionar Nuevo producto para abrir el formulario de registro.
6. Seleccionar Editar para modificar un producto existente.
7. Gestionar la disponibilidad del producto en el catálogo (activo/inactivo).
Reglas y consideraciones: cada presentación se registrará como un producto independiente. Las cantidades y precios se manejarán por fardo o caja cerrada, no por unidad suelta. La guía establece administrar productos mediante activar/desactivar; aunque el diseño muestra un ícono similar a una papelera, no se debe asumir eliminación física sin definir antes esa regla. Es preferible ocultar o desactivar un producto para conservar el historial de pedidos.
![vista de productos para admin](/docs/wireframes/web/productos.jpg)

**Nuevo producto**
*Objetivo: registrar un producto para que forme parte del catálogo de bebidas.*
**Elementos que mostrará:**
- Espacio para cargar una imagen.
- Campo Nombre del producto.
- Selector de Categoría.
- Campo Código del producto.
- Campo Unidades por caja.
- Campo Descripción.
- Sección Precio y stock, con precio por caja, stock inicial y alerta de stock bajo.
- Opción Visible para los clientes en la app.
- Botones Cancelar y Guardar producto.
Acciones esperadas: el administrador completará el formulario, seleccionará la categoría, podrá subir una imagen, indicará el precio y el inventario inicial, decidirá si el producto aparece en el catálogo móvil y guardará el registro. Cancelar regresará al listado sin registrar el producto.
Validaciones y reglas: el código debe ser único, la categoría debe existir, el nombre y la presentación son necesarios, el precio y el stock no pueden ser negativos, y el número de unidades por empaque debe ser mayor que cero. El inventario estará expresado en cajas o fardos completos. El indicador de stock mínimo permitirá mostrar alertas en otras vistas.
Campos de la guía que conviene incorporar: aunque no aparecen diferenciados en el wireframe, el modelo de datos incluye presentation (p. ej. 355 ml) y package_type (CAJA o FARDO). Se recomienda agregar ambos campos de forma explícita al formulario para que el registro coincida con el backend. La carga de imagen debe respetar las reglas de formato y tamaño que se definan en la implementación.

![vista para nuevo producto](/docs/wireframes/web/nuevo_Producto.png)

**Editar producto**
*Objetivo: modificar la información de un producto ya registrado, sin tener que crear uno nuevo.*
**Elementos que mostrará:** formulario similar al de Nuevo producto, pero con los datos actuales: imagen, nombre, categoría, código, unidades por caja, descripción, precio, stock, stock mínimo y visibilidad en la aplicación. Incluye Cambiar imagen, Guardar cambios, Cancelar y Eliminar producto (según el diseño).
Acciones esperadas:
1. Abrir el producto desde el listado y cargar sus datos actuales.
2. Modificar nombre, categoría, descripción, presentación, precio y otros datos editables.
3. Actualizar la imagen cuando sea necesario.
4. Ajustar si el producto está visible para los clientes.
5. Guardar las modificaciones o cancelar la edición.
Reglas y consideraciones: deben mantenerse las mismas validaciones que al crear productos. No se deben alterar los precios históricos de pedidos anteriores al actualizar el precio actual. La guía contempla registrar las entradas y ajustes de stock como movimientos de inventario; por ello, cambiar existencias no debería hacerse sin un registro de movimiento y una justificación cuando corresponda.
Aclaración sobre el botón Eliminar: el diseño presenta dicho botón, pero la guía define activar/desactivar productos y utiliza relaciones históricas con pedidos. La eliminación permanente debe tratarse como una decisión pendiente; la alternativa recomendada para el alcance actual es desactivar el producto, con confirmación visual.
![vista para editar producto](/docs/wireframes/web/editar_Producto.jpg)

**Categorías**
*Objetivo: organizar el catálogo de bebidas para facilitar la administración y la navegación de los clientes.*
**Elementos que mostrará:**
- Botón Nueva categoría.
- Listado de categorías con orden, nombre, cantidad de productos, visibilidad en la app y acciones.
- Acciones visuales para editar y eliminar o desactivar categorías.
- Nota sobre la restricción de eliminación de categorías con productos asignados.
Acciones esperadas:
1. Ver todas las categorías registradas.
2. Crear una categoría nueva.
3. Modificar su nombre, descripción, imagen u orden de aparición, según lo que se incorpore al formulario.
4. Definir su estado activo/inactivo y, con ello, su disponibilidad en el catálogo.
5. Consultar cuántos productos están asociados a cada categoría.
6. Evitar que se elimine una categoría que todavía tenga productos relacionados.
Reglas y consideraciones: la tabla categories incluye name, description, image_url, sort_order y active. El orden de la tabla representará la secuencia en que se mostrarán las categorías en la aplicación móvil. La captura indica que las categorías sin productos visibles se ocultan automáticamente de la app; esto debe conservarse como comportamiento propuesto por el diseño y validarse durante la implementación.
![vista para categorias](/docs/wireframes/web/categorias.jpg)

**Clientes**
*Objetivo: consultar y administrar los negocios que se registran para realizar pedidos a la distribuidora.*
**Elementos que mostrará:**
- Buscador por negocio o contacto.
- Resumen de clientes totales, activos e inactivos.
- Listado lateral de negocios registrados.
- Ficha del negocio seleccionado con nombre comercial, contacto, teléfono, correo, dirección de entrega y referencia.
- Área para mostrar su ubicación en un mapa.
- Control Cuenta activa.
- Sección Historial de pedidos, con filtro temporal y columnas de pedido, fecha, productos, estado y total.
Acciones esperadas:
1. Localizar un negocio por nombre o contacto.
2. Seleccionarlo y revisar su información de contacto.
3. Consultar su dirección y referencia de entrega.
4. Visualizar su ubicación geográfica cuando tenga coordenadas disponibles.
5. Activar o desactivar su cuenta.
6. Revisar su historial de compras y filtrar el período mostrado.
Reglas y consideraciones: la activación se controlará mediante el campo users.active; no debe existir un segundo indicador independiente de activación en clients. Una cuenta desactivada no podrá ingresar al sistema.
![vista para consultar clientes](/docs/wireframes/web/Clientes.jpg)

**Reportes mensuales**
*Objetivo: ayudar al administrador a revisar el resultado de las ventas y conocer los productos y clientes con mayor actividad durante un mes determinado.*
**Elementos que mostrará:**
- Selector de mes y año.
- Indicador Ventas del mes.
- Indicador Pedidos entregados.
- Clasificación de Productos más vendidos, con cantidades e importes.
- Clasificación de Clientes con más compras, con cantidad de pedidos e importe comprado.
- Botón Descargar PDF.
Acciones esperadas:
1. Seleccionar el mes a consultar.
2. Revisar el monto total vendido durante el período.
3. Ver cuántos pedidos se entregaron.
4. Identificar los productos más vendidos.
5. Consultar cuáles clientes realizaron más compras.
6. Descargar el reporte del período en formato PDF.
Reglas y consideraciones: para el cálculo mensual se utilizará la información correspondiente a los pedidos entregados, tomando como referencia su fecha delivered_at 
los totales y clasificaciones deberán calcularse en el backend a partir de la información real, no con los valores ilustrativos de las capturas. La descarga en PDF deberá corresponder al mismo período seleccionado en pantalla.
![vista para generer reportes](/docs/wireframes/web/reportes.jpg)

**Mi cuenta (perfil del administrador)**
*Objetivo: permitir al administrador revisar sus datos personales, cambiar su contraseña y cerrar sesión.*
**Elementos que mostrará:**
- Identificación del administrador y estado de su cuenta.
- Sección Datos de la cuenta, con nombre y nombre de usuario.
- Botón Guardar cambios.
- Sección Cambiar contraseña, con contraseña actual, nueva contraseña y confirmación.
- Botón Actualizar contraseña.
- Sección Sesión, con botón Cerrar sesión.
Acciones esperadas:
1. Consultar el nombre y usuario registrados.
2. Editar el nombre que aparece en su perfil.
3. Guardar los cambios permitidos.
4. Cambiar la contraseña ingresando la actual y confirmando la nueva.
5. Cerrar la sesión y regresar al inicio de sesión.
Reglas y consideraciones: en el diseño, el usuario aparece como dato no editable; la edición del nombre de usuario no debe habilitarse por defecto. La nueva contraseña deberá validarse según la política adoptada (el wireframe muestra al menos ocho caracteres y al menos un número), verificar la contraseña actual y almacenarse únicamente como hash en el backend. Al cerrar sesión, deberá invalidarse la credencial o token de acceso según el mecanismo de autenticación establecido.
![vista para gestion del perfil admin](/docs/wireframes/web/perfil.jpg)
