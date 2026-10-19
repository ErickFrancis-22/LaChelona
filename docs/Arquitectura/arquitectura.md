
# Arquitectura del sistema

Para el desarrollo de LA CHELONAPP se ha propuesto una arquitectura cliente-servidor basada en una API REST, que permitirá la comunicación entre la aplicación móvil, el panel administrativo y la base de datos.

Esta arquitectura busca mantener separados los componentes principales del sistema, facilitando su desarrollo, mantenimiento y la integración de las funcionalidades que se implementarán durante los diferentes Sprints.

El sistema estará compuesto por una aplicación móvil desarrollada con Ionic y Angular, un panel administrativo web desarrollado con Vue, una API REST construida con Laravel y una base de datos PostgreSQL alojada en Supabase.

**Componentes de la arquitectura**

*Aplicación móvil — Ionic y Angular*
![Ionic](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)


La aplicación móvil estará dirigida a los clientes del negocio. Desde ella podrán iniciar sesión, consultar el catálogo de bebidas, realizar pedidos y revisar su estado.

La aplicación se comunicará con la API REST para obtener la información de los productos y registrar las operaciones realizadas por los usuarios.

**Panel administrativo — Vue 3**
![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)

El panel web estará destinado a los administradores del negocio. Permitirá gestionar la información de los clientes, productos, inventario, pedidos y reportes.

Este panel también consumirá los servicios proporcionados por la API REST para consultar, registrar y actualizar la información del sistema.

**Backend — Laravel REST API**
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)![Laravel Sanctum](https://img.shields.io/badge/Laravel%20Sanctum-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)


Laravel será el encargado de procesar las solicitudes enviadas desde la aplicación móvil y el panel administrativo.

En esta parte se implementarán las validaciones, las reglas de negocio, la autenticación, el control de permisos y las operaciones necesarias para consultar o modificar la información almacenada en la base de datos.

Para la autenticación se utilizará Laravel Sanctum, de acuerdo con la arquitectura propuesta en la guía técnica.

**Base de datos — PostgreSQL y Supabase**
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)


La base de datos almacenará la información de los usuarios, clientes, productos, categorías, pedidos, comprobantes y movimientos de inventario.

Se utilizará PostgreSQL alojado en Supabase, permitiendo centralizar los datos que serán consultados y administrados mediante el backend.

**Comunicación entre los componentes**

La aplicación móvil y el panel administrativo enviarán solicitudes HTTP a la API REST desarrollada en Laravel.

La API procesará las peticiones, realizará las validaciones correspondientes y se comunicará con PostgreSQL para obtener o actualizar la información necesaria.

*Posteriormente, Laravel devolverá las respuestas a las aplicaciones utilizando el formato JSON.*

Una característica importante de esta arquitectura es que las aplicaciones frontend no tendrán acceso directo a la base de datos, ya que todas las operaciones deberán pasar por la API REST.

Esto permitirá mantener un mejor control de operaciones, aplicar validaciones y centralizar las reglas de negocio.

<div align="center">
## Diagrama de arquitectura
![diagrama de tecnologias](/docs/Arquitectura/diagrama_tecnologias.png)
</div>