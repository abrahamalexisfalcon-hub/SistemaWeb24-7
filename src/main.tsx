import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Asegurar que OneSignalSDKWorker.js esté registrado en "/" con updateViaCache: 'none'
// para todos los roles (incluyendo ADMINISTRADOR), interceptando navegaciones HTML sin caché
if (typeof window !== 'undefined') {
  const setupNavigationWorkerAndPurgeCaches = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          const scriptUrl =
            registration.active?.scriptURL ||
            registration.installing?.scriptURL ||
            registration.waiting?.scriptURL ||
            '';
          if (scriptUrl && !scriptUrl.includes('OneSignalSDKWorker.js')) {
            await registration.unregister();
          }
        }
        const reg = await navigator.serviceWorker.register('/OneSignalSDKWorker.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        await reg.update();
      } catch {
        // Ignorar errores de serviceWorker
      }
    }

    if ('caches' in window) {
      try {
        const keys = await window.caches.keys();
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => window.caches.delete(key)));
        }
      } catch {
        // Ignorar errores de CacheStorage
      }
    }
  };

  void setupNavigationWorkerAndPurgeCaches();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
