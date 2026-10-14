import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Registro automático de Service Worker para capacidades PWA Offline / Cache
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[PWA] Nueva versión disponible');
  },
  onOfflineReady() {
    console.info('[PWA] Aplicación lista para funcionar sin conexión');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
