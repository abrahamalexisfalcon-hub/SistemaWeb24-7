import { useState, useEffect, useCallback } from 'react';
import { notificacionesApi } from '../api';
import { toast } from 'sonner';

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
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          const existingSub = await registration.pushManager.getSubscription();
          setSuscrito(Boolean(existingSub));
        } catch {
          setSuscrito(false);
        }
      });
    }
  }, []);

  const solicitarPermisoYSuscribir = useCallback(
    async (usuarioId?: number): Promise<boolean> => {
      if (!soportado) {
        toast.error('Tu navegador o dispositivo no soporta notificaciones Web Push.');
        return false;
      }

      setCargando(true);
      try {
        const nuevoPermiso = await Notification.requestPermission();
        setPermiso(nuevoPermiso);

        if (nuevoPermiso !== 'granted') {
          toast.warning('Permiso de notificaciones no concedido.');
          return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = await notificacionesApi.getVapidPublicKey();
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as any,
          });
        }

        const subJson = subscription.toJSON();
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
          throw new Error('No se pudo generar la clave de suscripción');
        }

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
      } catch (err: unknown) {
        console.error('Error al suscribir a notificaciones push:', err);
        toast.error('No se pudo activar la suscripción a notificaciones push.');
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
