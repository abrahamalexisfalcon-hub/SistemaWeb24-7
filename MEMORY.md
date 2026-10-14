# MEMORY.md — Estado del Proyecto

## Estado Actual
- Conexión a PostgreSQL (Neon.tech Serverless) verificada y operativa.
- Entidades base creadas y verificadas: `Usuario`, `Afiliado`, `EstadoOrden`, `RolUsuario`.
- Entidades de cierre creadas y sincronizadas con Hibernate en Neon: `MaterialCatalogo`, `MaterialServicio`, `HojaServicio`, `OrdenServicio`.
- Tablas creadas exitosamente en Neon (`afiliados`, `catalogo_materiales`, `hojas_servicio`, `materiales_servicio`, `ordenes_servicio`, `usuarios`) con sus llaves foráneas y restricciones únicas.
- DTOs implementados en `com.asistencias247.api.dto`:
  * `OrdenResumenTecnicoDto` (id, codigoOrden, tipoServicio, estado, nombreAfiliado, direccion, referencia, distrito; sin teléfono).
  * `MaterialConsumidoDto` (materialId, descripcion, cantidad).
  * `CierreHojaServicioRequest` (evaluacionAveria, detalleSolucion, sugerencias, calificacion, URLs, materiales).
  * `MaterialCatalogoDto` (id, nombre).
- Servicios y repositorios implementados en `service` y `repository`:
  * `OrdenTecnicoService`, `HojaServicioService`, `CatalogoMaterialService`.
  * `MaterialCatalogoRepository` (búsqueda de activos ordenados por nombre).
- Controladores REST implementados en `com.asistencias247.api.controller`:
  * Autenticación (`/api/auth`):
    - `POST /login`: Autenticación con BCrypt y emisión de tokens JWT stateless.
  * Módulo Técnico (`/api/tecnico`):
    - `GET /ordenes/{tecnicoId}`: Listado de órdenes asignadas al técnico (sin teléfono).
    - `PATCH /ordenes/{ordenId}/llegada`: Actualiza estado a `EN_DOMICILIO` y marca `fechaLlegada`.
    - `POST /ordenes/{ordenId}/cerrar`: Registra `HojaServicio`, asocia materiales (catálogo u "Otro" imprevisto), marca orden como `FINALIZADA` y registra `fechaFinalizacion`.
  * Catálogo Público / Técnico (`/api/catalogo`):
    - `GET /materiales`: Lista materiales activos ordenados por nombre para autocompletado.
  * Módulo de Administración (`/api/admin` - Protegido por rol `ADMINISTRADOR`):
    - `POST /ordenes`: Crear y asignar nueva orden con correlativo anual automático `ORD-YYYY-XXX`.
    - `GET /ordenes`: Listar órdenes con filtro opcional por `EstadoOrden`.
    - `GET /ordenes/{id}`: Detalle completo de orden (incluye datos de contacto del afiliado con teléfono, técnico y hoja de servicio con materiales detallando catálogo o personalizado).
    - `POST /afiliados`: Registrar nuevo afiliado.
    - `GET /afiliados`: Listar afiliados.
    - `GET /afiliados/{id}`: Detalle de afiliado.
    - `POST /catalogo/materiales`: Registrar nuevo material en el catálogo.
    - `PATCH /catalogo/materiales/{id}/toggle`: Activar o desactivar material del catálogo.
    - `GET /catalogo/materiales`: Listar todos los materiales del catálogo.
    - `GET /tecnicos`: Listar técnicos activos para desplegables de asignación.
- Capa de Seguridad (Spring Security 6 + JJWT 0.12.5 stateless):
  * `JwtService`: Generación y validación de tokens HMAC-SHA256 (24h de expiración), extracción de claims (correo, usuarioId, rol).
  * `CustomUserDetailsService`: Carga de usuario por correo contra Neon PostgreSQL y asignación de prefijo `ROLE_`.
  * `JwtAuthenticationFilter`: Filtro por petición interceptando encabezado `Authorization: Bearer <token>`.
  * `SecurityConfig`: CSRF deshabilitado, sesión STATELESS, BCryptPasswordEncoder, DaoAuthenticationProvider, reglas de acceso `/api/auth/**` público, `/api/admin/**` (ADMINISTRADOR), `/api/tecnico/**` (TECNICO, ADMINISTRADOR).
  * Configuración Global de CORS (`CorsConfigurationSource` en `SecurityConfig`):
    - Habilitado en el filtro de seguridad (`.cors(cors -> cors.configurationSource(corsConfigurationSource()))`) sobre el patrón `/**`.
    - Orígenes permitidos: entornos de desarrollo frontend (`http://localhost:3000`, `http://localhost:5173`, `http://localhost:4200`, `http://localhost:8081`) y orígenes móviles (`capacitor://localhost`, `ionic://localhost`, `http://10.0.2.2:*`, `http://localhost:*`, `http://127.0.0.1:*`, `http://192.168.*.*:*`).
    - Métodos permitidos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
    - Headers permitidos: `Authorization`, `Content-Type`, `Accept`, `X-Requested-With`.
    - `allowCredentials` habilitado (`true`).
- Manejo Global de Excepciones (`com.asistencias247.api.exception`):
  * Auditoría previa: se verificó que no existía un `@RestControllerAdvice` previo ni configuración de `CorsConfigurationSource` en `SecurityConfig`.
  * `ErrorResponseDto` (`com.asistencias247.api.dto`): estructura estandarizada con `timestamp`, `status`, `error`, `message`, `path` y lista opcional `validaciones` (`@JsonInclude(NON_NULL)`).
  * `RecursoNoEncontradoException`: excepción personalizada de negocio para recursos inexistentes (HTTP 404).
  * `GlobalExceptionHandler` (`@RestControllerAdvice`):
    - `MethodArgumentNotValidException` -> HTTP 400 (Bad Request) con detalle de campos inválidos en `validaciones`.
    - `BadCredentialsException` -> HTTP 401 (Unauthorized) con mensaje `"Credenciales inválidas"`.
    - `AccessDeniedException` -> HTTP 403 (Forbidden) con mensaje `"Acceso denegado: permisos insuficientes"`.
    - `RecursoNoEncontradoException`, `EntityNotFoundException`, `UsernameNotFoundException` -> HTTP 404 (Not Found).
    - `ResponseStatusException` -> preserva el código HTTP y motivo emitido por la capa de servicio.
    - `Exception` genérico -> HTTP 500 (Internal Server Error) con mensaje seguro sin exponer stack traces al cliente.
- Poblado Inicial de Datos (`DataSeeder` en `com.asistencias247.api.config`):
  * Implementa `CommandLineRunner` de forma idempotente validando registros existentes.
  * Usuarios precargados con contraseñas en BCrypt: `admin@asistencias247.com` (ADMINISTRADOR) y `tecnico@asistencias247.com` (TECNICO).
  * 6 materiales de catálogo iniciales para autocompletado móvil.
  * Afiliado de prueba ("Juan Pérez", DNI "12345678", Villa El Salvador).
  * Orden de servicio de prueba (`ORD-2026-001`, estado PENDIENTE, asignada al técnico y asociada al afiliado).
- Documentación Interactiva (Swagger UI / OpenAPI 3):
  * Configurado mediante `springdoc-openapi-starter-webmvc-ui` (v2.8.5) y `OpenApiConfig` en `com.asistencias247.api.config`.
  * Interfaz visual disponible en `http://localhost:8080/swagger-ui.html` (y especificación JSON en `/v3/api-docs`).
  * Soporte global para autenticación Bearer JWT mediante el botón "Authorize".
  * Rutas de documentación públicas configuradas en `SecurityConfig`.

---

## Estructura del Frontend (`frontend/`)
- Inicializado con **React 19 + TypeScript + Vite 8**.
- **Tailwind CSS v3**:
  * `tailwind.config.js` con paleta institucional corporativa `brand` (`#1e40af`).
  * `postcss.config.js` con soporte para Tailwind y Autoprefixer.
  * `src/index.css` con directivas `@tailwind base; @tailwind components; @tailwind utilities;`.
- **Soporte PWA (`vite-plugin-pwa`)**:
  * Service Worker con registro automático (`registerType: 'autoUpdate'`).
  * Web App Manifest configurado con:
    - `name: "24/7 Asistencias"`
    - `short_name: "Asistencias 24/7"`
    - `display: "standalone"`
    - `theme_color: "#1e40af"`
    - `background_color: "#ffffff"`
  * Íconos SVG para PWA generados en `public/pwa-192x192.svg` y `public/pwa-512x512.svg`.
  * Tipado PWA en `tsconfig.app.json` (`vite-plugin-pwa/client`) y `src/vite-env.d.ts`.
- **Librerías Core**:
  * `react-router-dom`: navegación SPA y guardias de ruta protegidas por rol.
  * `lucide-react`: iconos para interfaces de escritorio y móvil.
  * `axios`: cliente HTTP configurado en `src/api/client.ts` con `baseURL: 'http://localhost:8080/api'`, interceptor de petición inyectando `Authorization: Bearer <token>` e interceptor de respuesta manejando errores 401.
- **Estructura modular en `src/`**:
  * `src/types/index.ts`: Modelos TypeScript espejo de las entidades y DTOs del backend (`Usuario`, `RolUsuario`, `EstadoOrden`, `AuthResponse`, `OrdenResumenTecnico`, `OrdenDetalleAdmin`, `CierreHojaServicioRequest`, `MaterialConsumido`, etc.).
  * `src/api/`:
    - `client.ts`: Instancia Axios configurada con interceptores.
    - `authApi.ts`: Endpoint de autenticación `/api/auth/login`.
    - `tecnicoApi.ts`: Endpoints `/api/tecnico/ordenes/{tecnicoId}`, `/api/tecnico/ordenes/{ordenId}/llegada`, `/api/tecnico/ordenes/{ordenId}/cerrar`.
    - `adminApi.ts`: Endpoints de administración para órdenes, afiliados, técnicos y catálogo de materiales.
    - `catalogoApi.ts`: Endpoint `/api/catalogo/materiales` para autocompletado en campo.
    - `index.ts`: Exportación unificada de módulos API.
  * `src/context/`:
    - `AuthContext.tsx`: Contexto y hook `useAuth` para manejo del token JWT, rol (`ADMINISTRADOR` / `TECNICO`), usuario autenticado, inicio/cierre de sesión y persistencia en `localStorage`.
  * `src/components/`:
    - `Navbar.tsx`: Barra de navegación responsive con identidad de marca, rol del usuario, badges y botón de logout.
    - `Card.tsx`: Contenedor modular con header, título, acciones y pie.
    - `Modal.tsx`: Diálogo modal accesible con backdrop, animación, soporte de tecla `Escape` y scroll interno.
    - `ProtectedRoute.tsx`: Guardia de rutas que valida autenticación y roles autorizados.
    - `index.ts`: Exportación centralizada.
  * `src/pages/`:
    - `Login.tsx`: Formulario de acceso con autenticación JWT, validación, feedback de errores y botones rápidos de prueba para Admin y Técnico.
    - `AdminDashboard.tsx`: Panel administrativo con métricas por estado, tabla de órdenes con visualización de teléfono del afiliado, filtro de estado, modal de detalle completo y modal de creación de nueva orden con correlativo anual automático.
    - `TecnicoView.tsx`: Vista móvil optimizada para técnicos en campo. Cumple estrictamente las reglas de negocio:
      * NO expone el teléfono del afiliado (privacidad).
      * Botón de marcación de llegada (`PATCH /llegada`).
      * Modal de cierre de hoja de servicio (`POST /cerrar`) con evaluación, solución, calificación y selección de insumos desde catálogo o ítems imprevistos ("Otro").
      * No muestra precios ni montos de dinero al técnico.
    - `index.ts`: Exportación centralizada de páginas.
  * `src/App.tsx`: Enrutamiento con redirección inteligente basada en rol y protección de rutas.
  * `src/main.tsx`: Montaje con `registerSW` de PWA habilitado.
- **Validación de Compilación**:
  * Ejecución exitosa de `npm run build`:
    - TypeScript verificado con `tsc -b`.
    - Build de Vite exitoso en ~7s.
    - Generación de `dist/sw.js`, `dist/manifest.webmanifest` y assets optimizados (PWA precache de 12 entradas).

---

## Decisiones Clave
- Modelo de cobro centralizado: técnicos reportan consumo de insumos sin ver precios ni dinero.
- Privacidad estricta: `OrdenResumenTecnicoDto` omite el teléfono del afiliado; solo `OrdenDetalleAdminDto` (administración) tiene acceso al teléfono.
- Soporte para materiales de catálogo y materiales personalizados imprevistos (`esPersonalizado`).
- Generación de código correlativo anual administrado en `OrdenServicioService` (`ORD-YYYY-XXX`).
- Autenticación Stateless basada en JWT (sin sesiones de servidor en memoria).
- Almacenamiento seguro de contraseñas garantizado con `BCryptPasswordEncoder`.
- Respuestas de error centralizadas y seguras mediante `GlobalExceptionHandler` y `ErrorResponseDto`.
- Soporte PWA en frontend para operatividad móvil fluida de los técnicos de campo.

---

## Próximos Pasos
- Conexión y pruebas E2E integradas entre frontend y backend en ejecución simultánea.
- Implementar generación de PDF para acta de servicio y cierre de orden.
- Añadir sincronización offline / IndexedDB para cachear órdenes del técnico en caso de cortes de red en campo.
