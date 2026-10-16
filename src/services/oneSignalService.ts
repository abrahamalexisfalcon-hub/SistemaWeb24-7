declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || "32237258-b02d-470e-a80c-9c57fadf03c2";
let isInitialized = false;

export const initOneSignal = (usuarioId?: number | string) => {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false }
      });

      if (usuarioId && OneSignal.Notifications?.permission) {
        await OneSignal.login(String(usuarioId));
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
            await OneSignal.login(String(usuarioId));
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
      if (OneSignal.logout) {
        await OneSignal.logout();
      }
    } catch (err) {
      console.error("[OneSignal] Error al cerrar sesión:", err);
    }
  });
};