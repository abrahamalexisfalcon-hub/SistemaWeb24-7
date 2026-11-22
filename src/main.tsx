import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Desregistrar cualquier Service Worker antiguo (sw.js de Workbox) y purgar CacheStorage residual
// sin tocar OneSignalSDKWorker.js
if (typeof window !== 'undefined') {
  const purgeLegacySwAndCaches = async () => {
    let cleaned = false;

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
            const ok = await registration.unregister();
            if (ok) cleaned = true;
          }
        }
      } catch {
        // Ignorar errores de acceso a serviceWorker
      }
    }

    if ('caches' in window) {
      try {
        const keys = await window.caches.keys();
        if (keys.length > 0) {
          await Promise.all(keys.map((key) => window.caches.delete(key)));
          cleaned = true;
        }
      } catch {
        // Ignorar errores de CacheStorage
      }
    }

    if (cleaned && !sessionStorage.getItem('sw_cache_purged_v1')) {
      sessionStorage.setItem('sw_cache_purged_v1', '1');
      window.location.reload();
    }
  };

  void purgeLegacySwAndCaches();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
