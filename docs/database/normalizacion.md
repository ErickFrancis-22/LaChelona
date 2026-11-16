# Normalización de la base de datos — LA CHELONAPP

## Introducción

Para el diseño de la base de datos de **LA CHELONAPP** se han considerado los principios de normalización, con el propósito de mantener la información organizada, evitar la duplicación innecesaria de datos y facilitar su mantenimiento.

La normalización consiste en organizar los datos en diferentes tablas relacionadas, de manera que cada una almacene información correspondiente a una entidad específica.

El modelo propuesto busca cumplir con las tres primeras formas normales: **Primera Forma Normal (1FN)**, **Segunda Forma Normal (2FN)** y **Tercera Forma Normal (3FN)**.

## Primera Forma Normal (1FN)

La Primera Forma Normal establece que cada registro debe identificarse de manera única y que los atributos deben almacenar valores individuales o atómicos, sin grupos repetitivos dentro de una misma fila.

En **LA CHELONAPP**, por ejemplo, los productos de un pedido no se almacenan en columnas como `producto1`, `producto2` o `producto3`. En su lugar, se utiliza la tabla `order_details`, que permite registrar cada producto solicitado mediante una fila independiente y relacionarlo con su pedido mediante `order_id`.

Esto facilita que un pedido pueda contener distintos productos sin necesidad de modificar la estructura de la tabla `orders`.

## Segunda Forma Normal (2FN)

La Segunda Forma Normal establece que una tabla debe cumplir con la Primera Forma Normal y que todos sus atributos no clave dependan de la clave primaria completa, evitando dependencias parciales.

En el modelo de **LA CHELONAPP**, las tablas utilizan identificadores únicos, como `id`, como claves primarias simples. Por ello, los atributos no pueden depender solo de una parte de esas claves.

Por ejemplo, la tabla `products` cuenta con un identificador para cada producto y almacena sus características, como nombre, presentación, precio de venta y existencias.

Por otra parte, los datos específicos de cada producto solicitado, como cantidad, precio histórico y subtotal, se almacenan en `order_details`, separándolos de la información general del pedido que se registra en `orders`.

## Tercera Forma Normal (3FN)

La Tercera Forma Normal establece que una tabla debe cumplir con las dos primeras formas normales y evitar dependencias transitivas innecesarias entre atributos que no forman parte de la clave.

En **LA CHELONAPP**, la información se ha organizado en tablas independientes según su función:

| Tabla | Información principal |
| --- | --- |
| `users` | Datos de acceso y rol de los usuarios. |
| `clients` | Información de los negocios clientes y sus direcciones. |
| `categories` | Categorías de productos. |
| `products` | Características, precios y existencias de productos. |
| `orders` | Información general de los pedidos. |
| `order_details` | Productos, cantidades y precios registrados en cada pedido. |

Por ejemplo, cuando se registra un pedido, no es necesario duplicar todos los datos del cliente ni las características de los productos dentro de `orders`. En su lugar, se utilizan claves foráneas como `client_id`, `order_id` y `product_id` para establecer las relaciones entre las tablas correspondientes.

## Consideraciones especiales del modelo

Aunque el diseño busca cumplir con la **Tercera Forma Normal**, se han considerado algunas **excepciones intencionales de desnormalización histórica** para conservar los datos tal como estaban al momento de realizar una operación.

### Precio histórico del producto

La tabla `order_details` conserva el precio del producto en `unit_price` al momento de la compra, mientras que `products.sale_price` representa el precio actual del catálogo. Así, un cambio posterior en el precio de venta no modifica el registro de un pedido anterior.

### Dirección y ubicación de entrega

La tabla `orders` guarda una copia de la dirección, referencia y, cuando están disponibles, coordenadas de entrega utilizadas al crear el pedido, mediante los campos `delivery_address`, `delivery_reference`, `delivery_latitude` y `delivery_longitude`.

Esto permite conservar la ubicación original del pedido aunque el cliente cambie posteriormente la dirección registrada en `clients`.

### Total del comprobante

La tabla `invoices` almacena en `total` una copia del importe de `orders.total` al momento de emitir el comprobante interno, con el propósito de conservar el valor original del documento.

Estas decisiones buscan mantener un historial confiable de las operaciones del negocio y no representan una duplicación accidental de información.

## Conclusión

La organización propuesta para la base de datos de **LA CHELONAPP** busca reducir la redundancia, mejorar la integridad de la información y facilitar las consultas y actualizaciones que realizará el sistema.

La separación de los datos en diferentes entidades también permitirá desarrollar de manera más organizada los módulos de clientes, productos, pedidos e inventario, conservando al mismo tiempo los datos históricos necesarios para el funcionamiento del negocio.




