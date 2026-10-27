# MEMORY.md — Fuente Única de Verdad del Proyecto (24/7 Asistencias Generales)

## 1. Infraestructura y Despliegue Actual
- **Proveedor VPS:** Hostinger VPS (`179.197.81.227`, usuario `root`, directorio `/app-24-7`).
- **Dominio Oficial y SSL:** `https://app.24-7asistencias.com` con certificados SSL/TLS de **Let's Encrypt** (`fullchain.pem` y `privkey.pem` renovables con Certbot) y redirección forzada HTTP (80) → HTTPS (443).
- **Orquestación con Docker Compose (`/app-24-7/docker-compose.yml`):**
  - `database` (`app_database`): Contenedor `postgres:16-alpine` con volumen persistente `postgres_data`.
  - `backend` (`app_backend`): API REST en Spring Boot 3 + Java 21 LTS (puerto interno/expuesto `8080`).
  - `frontend` (`app_frontend`): Build estático de React + Vite servido por **Nginx (`nginx-proxy`)**, encargado del enrutamiento SPA (`try_files $uri $uri/ /index.html`), terminación SSL con Let's Encrypt y reverse proxy de `/api/` hacia `http://backend:8080/api/`.
- **Pipeline CI/CD (GitHub Actions):**
  - Configurado en `.github/workflows/deploy.yml` tanto en el repositorio de Backend como en el de Frontend.
  - Cada `git push` a la rama `main` se conecta por SSH (`appleboy/ssh-action`) al VPS, sincroniza el código (`git reset --hard origin/main`) y ejecuta `docker compose up -d --build`.

---

## 2. Base de Datos
- **Motor:** PostgreSQL 16 (`asistencias_db`).
- **Administración y Seguridad:** Expuesta únicamente en el interfaz loopback del VPS (`127.0.0.1:5432:5432`) y administrada de forma segura mediante **túnel SSH**.

---

## 3. Stack Tecnológico
- **Backend:** Java 21 (LTS), Spring Boot 3.4.x, Spring Data JPA / Hibernate, Spring Security 6 + JWT (`JJWT`), Maven, Lombok.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, PWA (`vite-plugin-pwa`), React Router DOM, Axios, Lucide React.
- **DevOps y Servicios Externos:** Docker, Docker Compose, Nginx, Let's Encrypt, GitHub Actions, Cloudinary (evidencias fotográficas y firmas digitales), OneSignal (notificaciones push a técnicos).

---

## 4. Modelo de Entidades Actual (`com.asistencias247.api.entity`)
1. **`Cuenta` (`cuentas`):**
   - Representa a las Aseguradoras, Clientes Corporativos o Convenios (ej. *Rímac Seguros*, *Pacífico Seguros*, *Mapfre*, *La Positiva*, *Interseguro*).
   - Campos:
     - `id` (`Long`, PK autogenerado)
     - `nombre` (`String`, único, obligatorio, máx. 120 caracteres)
     - `activo` (`Boolean`, default `true`)
     - `createdAt` / `updatedAt` (`LocalDateTime`, auditoría automática)
   - Endpoints REST: `/api/cuentas` y `/api/admin/cuentas` (listar activas/todas, crear, editar, activar/desactivar).

2. **`OrdenServicio` (`ordenes_servicio`):**
   - Entidad central para la gestión de órdenes de trabajo y despacho técnico.
   - **Campos clave:**
     - `id` (`Long`, PK autogenerado)
     - `codigoOrden` (`String`, único, correlativo anual autogenerado `ORD-YYYY-XXX`)
     - `numeroCaso` (`String`, longitud 50, `@Column(name = "numero_caso", unique = true, nullable = false)`): Identificador alfanumérico único del caso.
     - `numeroOt` (`String`, longitud 50, `@Column(name = "numero_ot", unique = true, nullable = false)`): Número de Orden de Trabajo alfanumérico único.
     - `fechaPactada` (`LocalDateTime`, `@Column(name = "fecha_pactada", nullable = false)`): Fecha y hora pactada obligatoria, validada con `@NotNull` y `@FutureOrPresent`.
     - `cuenta` (`@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "cuenta_id", nullable = false)`): Relación obligatoria con la entidad `Cuenta`.
     - `afiliado` (`@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "afiliado_id", nullable = false)`): Cliente afiliado que recibe la asistencia.
     - `tecnico` (`@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "tecnico_id")`): Técnico operativo asignado.
     - `tipoServicio` (`String`, especialidad/servicio solicitado).
     - `estado` (`EstadoOrden`: `PENDIENTE`, `EN_CAMINO`, `EN_DOMICILIO`, `FINALIZADA`, `CANCELADA`).
     - Tiempos y auditoría: `fechaCreacion`, `fechaAsignacion`, `fechaLlegada`, `fechaFinalizacion`, `fechaCancelacion`, `motivoCancelacion`.
     - `hojaServicio` (`@OneToOne`): Acta de cierre y conformidad del servicio.

3. **`Afiliado` (`afiliados`):**
   - Clientes asegurados registrados en el padrón (`id`, `nombreCompleto`, `dni`, `numeroCuenta`, `telefono` [exclusivo para administración], `direccion`, `referencia`, `distrito`, `activo`).

4. **`Usuario` (`usuarios`):**
   - Usuarios operativos del sistema con roles `ADMINISTRADOR` y `TECNICO` (`id`, `nombreCompleto`, `correo` único, `telefono` único de 9 dígitos, `password` en BCrypt [PIN de 4 dígitos para técnicos], `rol`, `especialidad`, `firmaUrl`, `disponible`, `activo`).
   - **Autenticación Dual (Correo o Celular + PIN):** `CustomUserDetailsService` y `AuthServiceImpl` permiten iniciar sesión ingresando tanto el correo electrónico como el número de celular (`telefono`) junto con el PIN de 4 dígitos (validando que el técnico esté `activo`).
   - **Modal `TecnicoFormModal.tsx`:** Configurado con `autoComplete="off"` y `autoComplete="new-password"` para bloquear el autocompletado del navegador, validación de teléfono de 9 dígitos numéricos y **PIN de acceso de 4 dígitos numéricos** (`inputMode="numeric"`, `maxLength={4}`, `pattern="[0-9]{4}"`).

5. **`Especialidad` (`especialidades`):**
   - Catálogo dinámico de especialidades técnicas (`id`, `nombre` único, `activo`).

6. **`Material` (`materiales`) y `MaterialServicio` (`materiales_servicio`):**
   - Catálogo maestro de materiales e insumos utilizados y reportados en las hojas de servicio (`id`, `nombre`, `activo`, `cantidad`, `esPersonalizado`, `descripcion`).

---

## 5. Reglas Operativas Clave y UI/UX de Registro de Orden
- **Privacidad del Afiliado:** El rol `TECNICO` nunca recibe ni visualiza el teléfono del afiliado (`OrdenResumenTecnicoDto` lo excluye por diseño).
- **Unicidad de Caso y OT:** `OrdenServicioService` y `GlobalExceptionHandler` validan que `numeroCaso` y `numeroOt` sean únicos antes de guardar y ante cualquier violación de restricción en base de datos (`HTTP 400 Bad Request`).
- **Sincronización Backend ↔ Frontend:** Los DTOs (`CrearOrdenRequest`, `OrdenDetalleAdminDto`, `OrdenResumenTecnicoDto`, `CuentaDto`) se mantienen estrictamente sincronizados con las interfaces TypeScript en `frontend/src/types/index.ts`.
- **UI/UX de `NuevaOrdenTab.tsx` (Fecha y Hora Pactada 12h AM/PM):**
  - Estructurado en 3 secciones numeradas (*1. Datos de Cuenta y Expediente*, *2. Fecha y Hora Pactada del Servicio*, *3. Asignación de Afiliado y Técnico*).
  - Selector de programación de servicio con **Fecha** (`<input type="date" min={hoy}>`), **Hora 12h** (`01`–`12`), **Minutos** (`00`–`59`) y selector segmentado explícito **`AM` / `PM`**, garantizando visibilidad de turno en cualquier navegador o sistema operativo.
  - Incluye atajos rápidos de programación (`Ahora`, `+30 min`, `+1 hora`, `+2 horas`, `Mañana 09:00 AM`), vista previa en vivo del horario pactado, alerta preventiva si la hora elegida ya pasó y tarjeta de resumen de dirección/teléfono del afiliado y estado de disponibilidad del técnico.
- **Sincronización Reactiva y Polling Inteligente (`useAutoRefresh.ts` + `AdminSidebar.tsx`):**
  - Hook centralizado `useAutoRefresh` que refresca silenciosamente las órdenes, técnicos, clientes, cuentas y métricas cada **20 segundos** sin recargar el navegador.
  - Integra la API `visibilitychange` (`document.hidden`): pausa las consultas cuando la pestaña está minimizada/oculta y dispara un refresco inmediato al volver a enfocarla.
  - Botón manual de actualización con ícono `RefreshCw` (`animate-spin` mientras sincroniza) en la cabecera de `AdminSidebar.tsx` junto a `PANEL ADMINISTRADOR`.
  - Notificación automática vía `sonner` (`"Orden [OT / Caso] ha sido finalizada por el técnico."`) cuando una orden cambia a estado `FINALIZADA` en segundo plano.
- **Flujo Reactivo del Técnico, Compresión de Imágenes y Hora Local (`America/Lima`):**
  - **Compresión de Evidencias en Cliente (`frontend/src/utils/imageCompression.ts`):** Redimensiona proporcionalmente las fotos de cámara móvil hasta **1280x1280 px** en formato `image/jpeg` con calidad `0.72`, garantizando un peso `< 300 KB` antes de enviarlas al backend.
  - **Límites de Carga (`413 Payload Too Large` prevenido):** `frontend/nginx.conf` define `client_max_body_size 25M;` y Spring Boot (`application.properties` / `ApiAsistenciasApplication.java`) configura `spring.servlet.multipart.max-file-size=20MB`, `spring.servlet.multipart.max-request-size=25MB`, `server.tomcat.max-swallow-size=25MB` y `server.tomcat.max-http-form-post-size=25MB`.
  - **Hora Real de Llegada y Cierre (`America/Lima`):** `OrdenTecnicoService` y `HojaServicioService` registran `fechaLlegada` y `fechaFinalizacion` con `LocalDateTime.now(ZoneId.of("America/Lima"))`, y el frontend (`formatearHoraLocal` y `calcularDuracionServicio` en `dateFormatter.ts`) muestra la hora real y duración exacta en minutos sin valores estáticos.
  - **Reactividad Instantánea (Cero F5):** Al confirmar llegada (`OrdenDetalle.tsx`), avanzar a firma (`AtencionTecnica.tsx`) o cerrar la orden (`ValidacionCierre.tsx`), se actualiza inmediatamente `OrdenesContext` (`actualizarOrdenLocal` + `invalidarCache`) y se avanza automáticamente al siguiente paso del stepper.
- **Reapertura de Órdenes (`ASISTIDO_NO_REALIZADO` / `CANCELADA`):**
  - Endpoint `PATCH /api/ordenes/{id}/reaperturar` (y `/api/admin/ordenes/{id}/reaperturar`) en `OrdenController` / `AdminOrdenController` / `OrdenServicioService.reaperturarOrden`.
  - Recibe `ReaperturarOrdenRequest` (`nuevaFechaPactada` futura, `tecnicoId` y `observacion` opcional), cambia el estado de `CANCELADA` a `PENDIENTE`, actualiza la fecha pactada y el técnico asignado, limpia `fechaLlegada`, `fechaFinalizacion` y `fechaCancelacion` (`null`) y envía notificación push OneSignal al técnico.
  - En el panel de administrador (`AdminOrdenTable.tsx`, `AdminOrdenCard.tsx`, `OrdenDetalleModal.tsx` y `ReaperturarOrdenModal.tsx`), muestra el botón **"Reaperturar Servicio"** (`RotateCcw`) y actualiza reactivamente la tabla de órdenes sin requerir F5.
