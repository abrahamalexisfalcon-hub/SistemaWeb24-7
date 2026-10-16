import api from '../api/client';

/**
 * Convierte una clave pública VAPID en Base64 URL Safe a un arreglo Uint8Array
 * requerido por la API PushManager del navegador.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Determina si el entorno actual (navegador / contexto seguro) soporta Web Push nativo.
 */
export function isPushSoportado(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Obtiene la clave pública VAPID del servidor backend.
 */
export async function obtenerClavePublicaVapid(): Promise<string> {
  const fallbackKey = 'BCpAAMs1UM1ZKxugrSSB2_LhAeL3SbgFnCPF2M1RLdfPqXEKg3p7pk-I5WvIefOoEnsRCUCQB5chIO1r08j0iEA';
  try {
    const res = await api.get<{ publicKey: string }>('/push/public-key');
    if (res.data?.publicKey) {
      return res.data.publicKey;
    }
  } catch (err) {
    console.warn('[PushService] Fallback al consultar /push/public-key:', err);
  }

  try {
    const res = await api.get<{ publicKey: string }>('/notificaciones/public-key');
    if (res.data?.publicKey) {
      return res.data.publicKey;
    }
  } catch (err) {
    console.warn('[PushService] Fallback al consultar /notificaciones/public-key:', err);
  }

  return fallbackKey;
}

/**
 * Registra o renueva la suscripción Web Push nativa con VAPID para el usuario actual.
 */
export async function suscribirDispositivoPush(usuarioId?: number): Promise<boolean> {
  if (!isPushSoportado()) {
    console.warn('[PushService] Web Push no soportado en este dispositivo/contexto.');
    return false;
  }

  try {
    // 1. Solicitar permiso al usuario a nivel de sistema operativo
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[PushService] Permiso de notificaciones no concedido:', permission);
      return false;
    }

    // 2. Obtener registro activo del Service Worker
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }

    const readyRegistration = await navigator.serviceWorker.ready;

    // 3. Obtener clave pública VAPID del backend
    const vapidKey = await obtenerClavePublicaVapid();
    const convertedVapidKey = urlBase64ToUint8Array(vapidKey);

    // 4. Comprobar si ya existe una suscripción previa
    let subscription = await readyRegistration.pushManager.getSubscription();

    // Si ya existe pero pudiera tener una clave anterior, o para asegurar frescura:
    if (!subscription) {
      subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint) {
      console.error('[PushService] No se obtuvo endpoint en la suscripción');
      return false;
    }

    const payload = {
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
      },
      usuarioId: usuarioId || undefined,
    };

    // 5. Enviar la suscripción al Backend para almacenarla en la base de datos
    try {
      await api.post('/push/suscribir', payload);
    } catch {
      // Fallback a ruta alternativa si fuera necesario
      await api.post('/notificaciones/suscripcion-push', payload);
    }

    localStorage.setItem('push_subscription_activa', 'true');
    console.info('[PushService] Dispositivo suscrito a Web Push exitosamente.');
    return true;
  } catch (error) {
    console.error('[PushService] Error al suscribir dispositivo a Web Push:', error);
    return false;
  }
}

/**
 * Desuscribe el dispositivo actual de notificaciones Push VAPID tanto en el navegador como en el Backend.
 */
export async function desuscribirDispositivoPush(usuarioId?: number): Promise<boolean> {
  if (!isPushSoportado()) {
    localStorage.setItem('push_subscription_activa', 'false');
    return true;
  }

  try {
    const readyRegistration = await navigator.serviceWorker.ready;
    const subscription = await readyRegistration.pushManager.getSubscription();

    let endpoint: string | undefined;
    if (subscription) {
      endpoint = subscription.endpoint;
      await subscription.unsubscribe();
    }

    // Notificar al backend para retirar la suscripción
    try {
      await api.post('/push/desuscribir', { endpoint, usuarioId });
    } catch (err) {
      console.warn('[PushService] Advertencia al desuscribir en backend:', err);
    }

    localStorage.setItem('push_subscription_activa', 'false');
    console.info('[PushService] Dispositivo desuscrito de Web Push exitosamente.');
    return true;
  } catch (error) {
    console.error('[PushService] Error al desuscribir dispositivo:', error);
    localStorage.setItem('push_subscription_activa', 'false');
    return false;
  }
}
