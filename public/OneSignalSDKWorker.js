self.addEventListener('message', () => {});

// Forzar actualización inmediata del worker y limpiar cualquier CacheStorage residual
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // Ignorar errores de CacheStorage
      }
      await self.clients.claim();
    })()
  );
});

// Interceptar todas las navegaciones HTML (start_url "/", "/admin", "/tecnico/ordenes", etc.)
// para que SIEMPRE descarguen el index.html fresco de red (bypass total del HTTP disk cache móvil)
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => fetch(event.request))
    );
  }
});

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
