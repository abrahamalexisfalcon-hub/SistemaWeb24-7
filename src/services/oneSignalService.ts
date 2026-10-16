declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "32237258-b02d-470e-a80c-9c57fadf03c2";
let isInitialized = false;
let foregroundListenerAttached = false;
let onPushReceivedCallback: ((data: { title?: string; body?: string }) => void) | null = null;

export const setOnPushReceivedCallback = (cb: ((data: { title?: string; body?: string }) => void) | null) => {
  onPushReceivedCallback = cb;
};

const safeLogin = async (OneSignal: any, usuarioId?: number | string) => {
  if (!usuarioId) return;
  const targetId = String(usuarioId);
  try {
    const currentExternalId = OneSignal.User?.externalId;
    if (currentExternalId !== targetId) {
      await OneSignal.login(targetId);
    }
  } catch (err) {
    // OneSignal SDK v16 puede lanzar o registrar 409 internamente cuando resuelve un external_id existente
    console.debug("[OneSignal] Vinculación de external_id procesada:", err);
  }
};

export const initOneSignal = (usuarioId?: number | string) => {
  if (typeof window === 'undefined') return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (!isInitialized) {
        isInitialized = true;
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: 'OneSignalSDKWorker.js',
          notifyButton: { enable: false }
        });
      }

      if (!foregroundListenerAttached && OneSignal.Notifications?.addEventListener) {
        foregroundListenerAttached = true;
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
          const notif = event?.notification;
          if (onPushReceivedCallback) {
            onPushReceivedCallback({
              title: notif?.title,
              body: notif?.body,
            });
          }
        });
      }

      if (usuarioId && OneSignal.Notifications?.permission) {
        await safeLogin(OneSignal, usuarioId);
      }
    } catch (err) {
      console.error("[OneSignal] Error al inicializar:", err);
    }
  });
};

export const toggleNotificacionesPush = async (usuarioId: number | string, activar: boolean): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        if (!isInitialized) {
          isInitialized = true;
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerPath: 'OneSignalSDKWorker.js',
            notifyButton: { enable: false }
          });
        }

        if (activar) {
          await OneSignal.Notifications.requestPermission();
          const permisoConcedido = OneSignal.Notifications.permission;
          
          if (!permisoConcedido) {
            resolve(false);
            return;
          }

          if (usuarioId) {
            await safeLogin(OneSignal, usuarioId);
          }

          if (OneSignal.User?.PushSubscription?.optIn) {
            await OneSignal.User.PushSubscription.optIn();
          }

          const optedIn = OneSignal.User?.PushSubscription?.optedIn;
          resolve(Boolean(optedIn ?? true));
        } else {
          if (OneSignal.User?.PushSubscription?.optOut) {
            await OneSignal.User.PushSubscription.optOut();
          }
          resolve(false);
        }
      } catch (err) {
        console.error("[OneSignal] Error al alternar suscripción:", err);
        resolve(false);
      }
    });
  });
};

export const logoutOneSignal = () => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (OneSignal.logout && OneSignal.User?.externalId) {
        await OneSignal.logout();
      }
    } catch (err) {
      console.error("[OneSignal] Error al cerrar sesión:", err);
    }
  });
};