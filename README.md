# 24/7 Asistencias Generales — Frontend (PWA / Mobile-First)

![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![OneSignal](https://img.shields.io/badge/OneSignal-Web%20Push-E72B47?style=for-the-badge&logo=onesignal&logoColor=white)

> Aplicación web progresiva (PWA) responsiva y orientada a dispositivos móviles para técnicos en campo y panel administrativo de control en tiempo real.

---

## 📌 Destacados Técnicos y de Ingeniería

- **Code-Splitting y Reducción del Bundle en 44%:** Implementación de `React.lazy` y `<Suspense>` para dividir las rutas pesadas de Administrador y Técnico. El bundle inicial se redujo de **525 kB** a **293 kB** (88 kB gzip), permitiendo cargas instantáneas en conexiones móviles 3G/4G.
- **Carga de Evidencias Fotográficas Flexible:** Selector de fotos individual (`multiple={false}`) compatible con Android e iOS que permite al técnico elegir entre **Cámara en vivo** o **Galería / Archivos**, con compresión previa en cliente.
- **Firma Táctil Digital:** Integración de canvas táctil con persistencia en memoria y backend para la firma de conformidad del afiliado.
- **Jerarquía Estricta de Capas (`z-index`):** Arquitectura de capas no colisionantes con `createPortal` para visores de evidencia en pantalla completa (`z-[120]`), modales operativos (`z-[80]`), navegación fija inferior (`z-40`) y steppers de estado (`z-0`).
- **Control de Estado y Modo Offline Parcial:** `OrdenesContext` con persistencia en `localStorage` para evitar pérdida de reportes técnicos si se pierde la conexión en domicilio.
- **Notificaciones Push con OneSignal:** Integración con Service Workers nativos para recepción de alertas de nuevas órdenes en segundo plano.

---

## 🚀 Puesta en Marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilación de producción optimizada
npm run build
```

---

## 👤 Autor

**Abraham Alexis Falcon**  
*Full-Stack Software Engineer (Java / React)*  
- GitHub: [github.com/abrahamalexisfalcon-hub](https://github.com/abrahamalexisfalcon-hub)
