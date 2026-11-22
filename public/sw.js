// Kill-Switch Service Worker para limpiar instalaciones antiguas de Workbox/PWA
// sin afectar OneSignalSDKWorker.js
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        // Ignorar errores de CacheStorage
      }
      try {
        await self.registration.unregister();
      } catch {
        // Ignorar errores al desregistrar
      }
      try {
        const clientsList = await self.clients.matchAll({ type: 'window' });
        for (const client of clientsList) {
          if ('navigate' in client) {
            await client.navigate(client.url);
          }
        }
      } catch {
        // Ignorar errores de navegación
      }
    })()
  );
});
