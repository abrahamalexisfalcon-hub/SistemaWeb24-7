# AGENTS.md — Directrices y Reglas de Ingeniería (24/7 Asistencias Generales)

Proyecto integral para la gestión de asistencias técnicas domiciliarias (Backend REST Spring Boot + Frontend React PWA desplegados en Hostinger VPS con Docker Compose).

---

## Reglas Críticas Obligatorias

- **Regla 1 (Testing y DI):** Cada vez que se agregue o modifique un repositorio/servicio inyectado en un `Service`, actualizar inmediatamente los constructores en los tests unitarios (ej. [`CoreServicesUnitTests.java`](file:///c:/Users/USER/Desktop/asistencias247/Backend/src/test/java/com/asistencias247/api/service/CoreServicesUnitTests.java)).
- **Regla 2 (Docker Build):** En `backend/Dockerfile` siempre usar `RUN mvn clean package -Dmaven.test.skip=true` para empaquetado de producción.
- **Regla 3 (Validación de tipos):** Mantener sincronizados los DTOs de Spring Boot con las interfaces TypeScript del frontend (`frontend/src/types/index.ts`).
- **Regla 4 (CI/CD):** Todo commit a `main` dispara el despliegue automático en el VPS mediante GitHub Actions. No subir cambios sin verificar antes `mvn compile` en backend y `npm run build` en frontend.

---

## Stack y Estructura
- **Backend (`Backend/`):** Java 21 (LTS), Spring Boot 3.4.x, Spring Data JPA, Hibernate, PostgreSQL 16 (`asistencias_db`), Spring Security 6 + JJWT.
  - Entidades en `com.asistencias247.api.entity` (`Afiliado`, `Usuario`, `Especialidad`, `Material`, `MaterialServicio`, `Cuenta`, `OrdenServicio`, `HojaServicio`).
  - Repositorios en `com.asistencias247.api.repository`.
  - Servicios en `com.asistencias247.api.service`.
  - Controladores en `com.asistencias247.api.controller`.
- **Frontend (`frontend/`):** React 19, TypeScript, Vite, Tailwind CSS, `vite-plugin-pwa`, `react-router-dom`, `lucide-react`, `axios`.
  - Cliente HTTP en `src/api/client.ts` (`baseURL: import.meta.env.VITE_API_URL || '/api'`).
  - Modelos TypeScript en `src/types/index.ts`.
  - Vistas y pestañas modulares en `src/pages/admin/` y `src/pages/tecnico/`.

---

## Reglas de Dominio y Negocio
- **Privacidad del Afiliado:** Los técnicos NUNCA deben tener acceso al número de teléfono del afiliado. El contacto directo lo gestiona exclusivamente administración.
- **Correlativo de Orden:** `codigoOrden` se genera automáticamente en formato `ORD-YYYY-XXX`.
- **Campos Obligatorios de `OrdenServicio`:** Toda orden requiere `numeroCaso` (alfanumérico único), `numeroOt` (alfanumérico único), `fechaPactada` (`LocalDateTime` futura/presente obligatoria) y relación `@ManyToOne` con `Cuenta` (`cuenta_id` no nulo).
- **Precios y Materiales:** Los técnicos NO registran ni ven precios ni montos de dinero; solo reportan `material` (catálogo o personalizado) y `cantidad`.
- **Seguridad:** Nunca almacenar contraseñas en texto plano (usar `BCryptPasswordEncoder`) ni versionar secretos en texto plano dentro del repositorio.
