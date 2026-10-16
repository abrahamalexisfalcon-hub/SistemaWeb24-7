import { useState, useEffect, useCallback } from 'react';
import { notificacionesApi } from '../api';
import { toast } from 'sonner';

/**
 * Convierte una clave VAPID en Base64 URL-safe a un Uint8Array compatible con PushManager.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [soportado, setSoportado] = useState<boolean>(false);
  const [permiso, setPermiso] = useState<NotificationPermission>('default');
  const [suscrito, setSuscrito] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setSoportado(isSupported);

    if (isSupported) {
      setPermiso(Notification.permission);
      navigator.serviceWorker.ready
        .then(async (registration) => {
          try {
            const existingSub = await registration.pushManager.getSubscription();
            setSuscrito(Boolean(existingSub));
          } catch {
            setSuscrito(false);
          }
        })
        .catch(() => {
          setSuscrito(false);
        });
    }
  }, []);

  const solicitarPermisoYSuscribir = useCallback(
    async (usuarioId?: number): Promise<boolean> => {
      // 1. Verificación de entorno seguro (HTTPS o localhost)
      if (
        typeof window !== 'undefined' &&
        !window.isSecureContext &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        toast.error(
          'Web Push requiere conexión HTTPS o localhost. En móvil debes usar HTTPS o instalar la PWA.',
          { duration: 5000 }
        );
        return false;
      }

      // 2. Verificación de compatibilidad con Push API (ej. Safari en iOS sin instalar en Home Screen)
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
          toast.info(
            'En iOS debes añadir la app a la Pantalla de Inicio (Compartir > Añadir a pantalla de inicio) para activar notificaciones.',
            { duration: 6500 }
          );
        } else {
          toast.error('Tu navegador no soporta Web Push Notifications.');
        }
        return false;
      }

      setCargando(true);
      try {
        // 3. Solicitud de permisos (compatible con Promesas y Callbacks antiguos)
        let nuevoPermiso: NotificationPermission = 'default';
        try {
          const req = Notification.requestPermission();
          if (req && typeof (req as Promise<NotificationPermission>).then === 'function') {
            nuevoPermiso = await req;
          } else {
            nuevoPermiso = await new Promise<NotificationPermission>((resolve) => {
              Notification.requestPermission(resolve);
            });
          }
        } catch {
          nuevoPermiso = Notification.permission;
        }

        setPermiso(nuevoPermiso);

        if (nuevoPermiso !== 'granted') {
          toast.warning('Permiso de notificaciones denegado en el dispositivo.');
          return false;
        }

        // 4. Asegurar que el Service Worker esté registrado y activo
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration || !registration.active) {
          registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        }
        await navigator.serviceWorker.ready;

        // 5. Obtener clave pública VAPID
        const vapidPublicKey = await notificacionesApi.getVapidPublicKey();
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // 6. Suscribir a PushManager
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as any,
          });
        }

        const subJson = subscription.toJSON();
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
          throw new Error('El navegador no generó las claves de cifrado push.');
        }

        // 7. Persistir suscripción en el backend
        await notificacionesApi.registrarSuscripcion({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          usuarioId,
        });

        setSuscrito(true);
        toast.success('¡Notificaciones con pantalla bloqueada activadas con éxito!');
        return true;
      } catch (err: any) {
        console.error('Error al suscribir a notificaciones push:', err);
        const serverMsg = err?.response?.data?.message || err?.message;
        toast.error(
          serverMsg
            ? `No se pudo activar: ${serverMsg}`
            : 'No se pudo activar la suscripción a notificaciones push.'
        );
        return false;
      } finally {
        setCargando(false);
      }
    },
    [soportado]
  );

  return {
    soportado,
    permiso,
    suscrito,
    cargando,
    solicitarPermisoYSuscribir,
  };
}
