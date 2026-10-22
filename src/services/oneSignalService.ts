export interface OneSignalForegroundEvent {
  notification?: {
    title?: string;
    body?: string;
  };
}

export interface OneSignalSDKInstance {
  init: (config: {
    appId: string;
    allowLocalhostAsSecureOrigin?: boolean;
    serviceWorkerPath?: string;
    notifyButton?: { enable: boolean };
  }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  User?: {
    externalId?: string;
    PushSubscription?: {
      optedIn?: boolean;
      optIn?: () => Promise<void>;
      optOut?: () => Promise<void>;
    };
  };
  Notifications: {
    permission?: boolean;
    requestPermission: () => Promise<void>;
    addEventListener?: (
      event: 'foregroundWillDisplay',
      listener: (event: OneSignalForegroundEvent) => void
    ) => void;
  };
}

declare global {
  interface Window {
    OneSignal?: OneSignalSDKInstance;
    OneSignalDeferred?: Array<(OneSignal: OneSignalSDKInstance) => void | Promise<void>>;
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "32237258-b02d-470e-a80c-9c57fadf03c2";
let initPromise: Promise<void> | null = null;
let foregroundListenerAttached = false;
let onPushReceivedCallback: ((data: { title?: string; body?: string }) => void) | null = null;

export const setOnPushReceivedCallback = (cb: ((data: { title?: string; body?: string }) => void) | null) => {
  onPushReceivedCallback = cb;
};

const ensureInitialized = async (OneSignal: OneSignalSDKInstance): Promise<void> => {
  if (!initPromise) {
    initPromise = OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      notifyButton: { enable: false },
    }).catch((err) => {
      // Si ya estaba inicializado por el SDK, ignorar el error de doble init
      console.debug('[OneSignal] Estado de inicialización:', err);
    });
  }
  await initPromise;
};

const safeLogin = async (OneSignal: OneSignalSDKInstance, usuarioId?: number | string) => {
  if (!usuarioId) return;
  const targetId = String(usuarioId).trim();
  if (!targetId) return;
  try {
    await OneSignal.login(targetId);
    console.info(`[OneSignal-TRACE] OneSignal.login("${targetId}") vinculado correctamente.`);
  } catch (err) {
    console.debug("[OneSignal] Vinculación de external_id procesada:", err);
  }
};

export const initOneSignal = (usuarioId?: number | string) => {
  if (typeof window === 'undefined') return;

  const runInit = async (OneSignal: OneSignalSDKInstance) => {
    try {
      await ensureInitialized(OneSignal);

      if (!foregroundListenerAttached && OneSignal.Notifications?.addEventListener) {
        foregroundListenerAttached = true;
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: OneSignalForegroundEvent) => {
          const notif = event?.notification;
          if (onPushReceivedCallback) {
            onPushReceivedCallback({
              title: notif?.title,
              body: notif?.body,
            });
          }
        });
      }

      if (usuarioId) {
        // 1. Vincular el external_id del técnico tras completar OneSignal.init()
        await safeLogin(OneSignal, usuarioId);

        const prefActiva = localStorage.getItem('notificaciones_activas') !== 'false';
        if (prefActiva) {
          if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            try {
              await OneSignal.Notifications?.requestPermission?.();
            } catch {
              // Ignorar si el navegador requiere gesto explícito del usuario
            }
          }

          const tienePermiso =
            Boolean(OneSignal.Notifications?.permission) ||
            (typeof Notification !== 'undefined' && Notification.permission === 'granted');

          if (tienePermiso && OneSignal.User?.PushSubscription?.optIn) {
            await OneSignal.User.PushSubscription.optIn();
            // Re-asegurar vínculo de external_id tras activar la suscripción push
            await safeLogin(OneSignal, usuarioId);
          }
        }
      }
    } catch (err) {
      console.warn("[OneSignal] Advertencia durante init:", err);
    }
  };

  if (window.OneSignal && typeof window.OneSignal.init === 'function') {
    void runInit(window.OneSignal);
    return;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(runInit);
};

export const toggleNotificacionesPush = async (usuarioId: number | string, activar: boolean): Promise<boolean> => {
  if (typeof window === 'undefined') {
    return false;
  }

  // 1. Manejo nativo directo en el contexto del click (User Gesture)
  let permisoNativoConcedido = true;
  if ('Notification' in window) {
    if (activar) {
      if (Notification.permission === 'denied') {
        return false;
      }
      if (Notification.permission !== 'granted') {
        try {
          const resultado = await Notification.requestPermission();
          permisoNativoConcedido = resultado === 'granted';
          if (!permisoNativoConcedido) {
            return false;
          }
        } catch {
          permisoNativoConcedido = false;
          return false;
        }
      }
    }
  }

  // 2. Sincronización con OneSignal con timeout seguro de 5 segundos
  return new Promise((resolve) => {
    let finalizado = false;
    const timeoutId = setTimeout(() => {
      if (!finalizado) {
        finalizado = true;
        resolve(activar ? permisoNativoConcedido : true);
      }
    }, 5000);

    const ejecutarSincronizacion = async (OneSignal: OneSignalSDKInstance) => {
      try {
        await ensureInitialized(OneSignal);

        if (activar) {
          if (OneSignal.User?.PushSubscription?.optIn) {
            await OneSignal.User.PushSubscription.optIn();
          }
          if (usuarioId) {
            await safeLogin(OneSignal, usuarioId);
          }
          const optedIn = OneSignal.User?.PushSubscription?.optedIn;
          if (!finalizado) {
            finalizado = true;
            clearTimeout(timeoutId);
            resolve(Boolean(optedIn ?? permisoNativoConcedido));
          }
        } else {
          if (OneSignal.User?.PushSubscription?.optOut) {
            await OneSignal.User.PushSubscription.optOut();
          }
          if (!finalizado) {
            finalizado = true;
            clearTimeout(timeoutId);
            resolve(true);
          }
        }
      } catch (err) {
        console.warn("[OneSignal] Error al alternar suscripción:", err);
        if (!finalizado) {
          finalizado = true;
          clearTimeout(timeoutId);
          resolve(activar ? permisoNativoConcedido : true);
        }
      }
    };

    if (window.OneSignal && typeof window.OneSignal.init === 'function') {
      void ejecutarSincronizacion(window.OneSignal);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(ejecutarSincronizacion);
  });
};

export const logoutOneSignal = async () => {
  if (typeof window === 'undefined') return;
  try {
    if (window.OneSignal && typeof window.OneSignal.logout === 'function') {
      await window.OneSignal.logout();
      return;
    }
  } catch (err) {
    console.debug("[OneSignal] Error directo al cerrar sesión:", err);
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: OneSignalSDKInstance) => {
    try {
      if (OneSignal && typeof OneSignal.logout === 'function') {
        await OneSignal.logout();
      }
    } catch (err) {
      console.error("[OneSignal] Error al cerrar sesión:", err);
    }
  });
};