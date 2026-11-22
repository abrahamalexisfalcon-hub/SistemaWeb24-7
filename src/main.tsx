import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Desregistrar cualquier Service Worker antiguo (sw.js de Workbox) y actualizar OneSignalSDKWorker.js
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        const scriptUrl =
          registration.active?.scriptURL ||
          registration.installing?.scriptURL ||
          registration.waiting?.scriptURL ||
          '';
        if (scriptUrl && !scriptUrl.includes('OneSignalSDKWorker.js')) {
          registration.unregister().catch(() => {});
        } else {
          registration.update().catch(() => {});
        }
      }
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
