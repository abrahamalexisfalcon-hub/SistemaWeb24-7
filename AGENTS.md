# AGENTS.md — 24/7 Asistencias

Proyecto integral para gestión de asistencias técnicas domiciliarias (Backend REST Spring Boot + Frontend React PWA).

## Stack y Estructura
- **Backend:** Java 21, Spring Boot 3.x, Spring Data JPA, Hibernate, PostgreSQL (Neon Serverless), Spring Security 6 + JJWT.
  * Entidades en `Backend/src/main/java/com/asistencias247/api/entity`.
  * Repositorios en `Backend/src/main/java/com/asistencias247/api/repository`.
  * Servicios en `Backend/src/main/java/com/asistencias247/api/service`.
  * Controladores en `Backend/src/main/java/com/asistencias247/api/controller`.
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v3, `vite-plugin-pwa`, `react-router-dom`, `lucide-react`, `axios`.
  * Cliente API y servicios en `frontend/src/api`.
  * Estado y sesión JWT en `frontend/src/context/AuthContext.tsx`.
  * Vistas en `frontend/src/pages` (`Login`, `AdminDashboard`, `TecnicoView`).
  * Componentes reutilizables en `frontend/src/components` (`Navbar`, `Card`, `Modal`, `ProtectedRoute`).
  * Modelos de datos en `frontend/src/types`.

## Reglas de Dominio y Negocio
- **Seguridad / Privacidad:** Los técnicos NUNCA deben tener acceso al número de teléfono del afiliado. El contacto directo y envío de PDF lo gestiona administración.
- **Correlativo:** El código de orden (`codigoOrden`) se genera automáticamente en formato `ORD-YYYY-XXX` usando `EXTRACT(YEAR FROM fechaAsignacion)`.
- **Precios:** Los técnicos NO registran ni ven precios ni dinero. Solo reportan `material` (o `descripcion` si es personalizado) y `cantidad`.
- **Materiales (Opción B):** Si el material existe en el catálogo, se asocia `material_id`. Si es nuevo/imprevisto ("Otro"), `material` es null, `esPersonalizado = true` y se guarda la descripción escrita.

## Convenciones y Límites
- Usar anotaciones Lombok en backend (`@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`).
- TypeScript con tipado estricto e interfaces sincronizadas con los DTOs de backend en frontend.
- ✅ Siempre: mantener las entidades y modelos consistentes y actualizar `MEMORY.md` al terminar cada tarea.
- ✅ Siempre: Verificar que no exista código muerto que no se esté usando, si lo hay eliminarlo para tener un proyecto limpio
- ⚠️ Pregunta antes: agregar dependencias pesadas no solicitadas o modificar la estructura de base de datos ya conectada.
- 🚫 Nunca: almacenar contraseñas en texto plano (usar BCrypt) ni exponer teléfonos al rol técnico.



## Flujo de Validación y Cero Errores (Obligatorio)
Antes de finalizar cualquier tarea o responder al usuario:
1. **Compilación automática:**
   - Backend: `./mvnw clean compile` en `Backend/`
   - Frontend: `npm run build` en `frontend/`
2. **Auto-corrección:** Si la compilación arroja errores o warnings de tipos/sintaxis, analízalos y corrígelos de inmediato de forma autónoma hasta lograr compilación 100% exitosa.
3. **Persistencia:** Solo cuando el código compile limpio, actualiza el estado en `MEMORY.md`.
## Impeccable Design & Frontend Skills (UI/UX Guidelines)

Al generar o modificar componentes en el frontend (`React + Tailwind CSS`), debes seguir estrictamente los principios de diseño de Impeccable:

1. **Anti-Generismo (Cero AI-Slop):**
   - No inventes paletas aleatorias ni sombras moradas/gradientes genéricos.
   - Usa los colores institucionales definidos (#0EA5E9 primario, #111827 carbón, #F8FAFC fondo).

2. **Tipografía y Jerarquía:**
   - Usa un contraste claro de pesos: títulos en `font-bold` o `font-semibold`, subtítulos en `font-medium text-gray-500`, textos de apoyo en `text-xs text-gray-400`.
   - Evita textos pegados a los bordes; asegura espaciados de lectura cómodos (`leading-relaxed`).

3. **Ritmo de Espaciado (Sistema de 8pt):**
   - Usa exclusivamente múltiplos de Tailwind: `p-3`, `p-4`, `p-6`, `gap-3`, `gap-4`.
   - Las tarjetas móviles deben tener esquinas consistentes: `rounded-2xl` para contenedores y `rounded-xl` para inputs y botones.

4. **Bordes y Superficies:**
   - Prefiere bordes finos de alto contraste (`border border-gray-100` o `border-gray-200/80`) combinados con sombras difusas muy suaves (`shadow-sm`) en lugar de sombras oscuras pesadas.

5. **Interactividad Táctil (Mobile-First):**
   - Altura mínima de toques: botones e inputs interactivos deben medir al menos 44px de alto (`py-3` o `py-3.5`).
   - Feedback táctil: agrega `active:scale-[0.98] transition-transform duration-100` en botones principales.
   - Form controls: inputs con estados de foco nítidos (`focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none`).

6. **Manejo de Estados:**
   - Siempre contempla: estado cargando (`loading spinner` o `skeleton`), estado vacío (`EmptyState` ilustrado/icono con mensaje claro) y estado de error contextual.
