# AGENTS.md — Directrices Técnicas de Frontend
# Ubicación: `frontend/` | Stack: React 19 + TypeScript + Vite + Tailwind CSS + PWA

Esta capa alberga la interfaz de usuario del sistema 24/7 Asistencias, estructurada en dos portales diferenciados: la experiencia Mobile-First para técnicos en campo y el Centro de Control de Escritorio para coordinadores y administradores.

---

## 1. Arquitectura de Componentes y Separación de Capas

```
frontend/src/
├── api/            # Configuración de Axios (client.ts), interceptores de JWT y endpoints organizados por dominio.
├── components/     # Componentes visuales reutilizables (Botones, Modales, Badges, Loaders, SignatureCanvas).
├── context/        # Contextos globales de React (AuthContext, OrdenesContext) para estado compartido.
├── hooks/          # Custom hooks con la lógica de negocio, llamados asíncronos y ciclo de vida (useEspecialidades, useOrdenes).
├── pages/          # Páginas principales del router:
│   ├── admin/      # Vistas de escritorio (Dashboard, Asignaciones, Cuentas, Afiliados, Catálogo de Materiales).
│   └── tecnico/    # Vistas mobile-first (Login PIN, Mis Órdenes, Detalle, Atención Técnica, Cierre y Firma).
├── types/          # Definición canónica de tipos TypeScript (index.ts) sincronizada con el Backend.
└── utils/          # Helpers de formato de fechas, compresión de imágenes y generación de PDF.
```

### Reglas de Diseño de Componentes
- **Separación Lógica/UI:** Los componentes visuales no deben ejecutar consultas HTTP directas. Deben consumir hooks o funciones de servicio de `src/api/`.
- **Pureza de Renderizado:** No invocar funciones con efectos colaterales (ej. `new Date()` sin memoizar o llamadas a `setState`) durante la fase de render. Usar `useMemo`, `useCallback` y `useEffect` adecuadamente.
- **Tipado Fuerte:** Prohibido el uso de `any` en interfaces públicas y props. Mantener `src/types/index.ts` rigurosamente sincronizado con los DTOs de Spring Boot.

---

## 2. Reglas de Diseño UI/UX y Responsividad

### Experiencia Técnico en Campo (Mobile-First Obligatorio)
- **Ergonomía Táctil:** Botones de acción principales con `Touch Target` mínimo de 48px de alto, tipografías legibles y paleta de colores de alto contraste con Tailwind CSS.
- **Flujo de Asistencia Paso a Paso:**
  1. Identificación y llegada: Botones de geolocalización ("Abrir en Waze" / "Google Maps") y confirmación de llegada.
  2. Evidencia fotográfica: Captura directa desde cámara o galería de fotos ("Antes" y "Después").
  3. Compresión obligatoria en cliente (`browser-image-compression`) antes de subir a Cloudinary para garantizar fluidez en conexiones móviles 3G/4G inestables.
  4. Cierre y Firma: Lienzo táctil con `react-signature-canvas`, captura de DNI del recepcionante, generación de Acta/Hoja de Servicio en PDF y opción de envío a WhatsApp.
- **Resiliencia Local:** Persistencia automática de borradores de atención en `localStorage` para prevenir pérdida de datos si la aplicación se recarga o pierde cobertura en ruta.

### Centro de Control Administrativo (Escritorio Limpio)
- Tableros densos en información: Tablas con scroll virtualizado, filtros rápidos por aseguradora/cuenta, estado de orden, fecha pactada y asignación de técnicos en tiempo real.
- Modales sin desbordamiento de pantalla con validaciones visuales inmediatas (`sonner` toasts).

---

## 3. Protocolo de Verificación y Compilación Obligatoria

> [!CRITICAL]
> **Calidad de Compilación, Tipado y Cero Errores en Consola:**
> Ningún componente, hook o estilo debe entregarse sin superar la compilación estricta de TypeScript y el linter.

### Comandos de Verificación Local (desde `frontend/`)
```powershell
# 1. Compilación de tipos TypeScript y empaquetado de producción con Vite:
npm run build

# 2. Análisis estático de código y reglas de calidad:
npm run lint

# 3. Verificación de servidor de desarrollo (si se requiere validar visualmente):
npm run dev
```

### Criterios de Aceptación UI/UX (Inspección Visual y Consola)
- **Cero Desbordamientos:** No debe existir scroll horizontal accidental (*overflow-x*) en resoluciones móviles (360px a 430px de ancho).
- **Manejo de Estados de Carga:** Skeleton loaders o spinners claros durante peticiones asíncronas a la API o subidas a Cloudinary.
- **Alertas y Toasts:** Notificaciones claras al usuario ante errores de red, fallos de autenticación o validaciones de formulario incompletas.
- **Consola Limpia:** Sin advertencias de React (`missing key`, variables no utilizadas o bucles en efectos).

---

## 4. Requisitos para Despliegue en Producción (Hostinger VPS)

- **Dockerfile de Producción:** Ejecuta `npm run build` y empaqueta los estáticos en Nginx Alpine con `nginx.conf` (`try_files $uri $uri/ /index.html`).
- **Compatibilidad con CI/CD:** El empaquetado no debe contener advertencias de tipos fallidas para no romper el paso `docker compose up -d --build` en el pipeline de GitHub Actions `Deploy to Hostinger VPS`.
