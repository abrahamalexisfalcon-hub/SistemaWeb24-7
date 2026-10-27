import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  /** Intervalo de refresco en milisegundos (por defecto 20000ms = 20s) */
  intervalMs?: number;
  /** Si el polling está habilitado */
  enabled?: boolean;
}

/**
 * Hook de Polling Inteligente con soporte de Page Visibility API.
 * Pausa las consultas cuando la pestaña está oculta y ejecuta un refresco
 * silencioso inmediato cuando el administrador vuelve a enfocar la ventana.
 */
export function useAutoRefresh(
  onRefresh: () => void | Promise<void>,
  options: UseAutoRefreshOptions = {}
) {
  const { intervalMs = 20000, enabled = true } = options;
  const callbackRef = useRef(onRefresh);

  useEffect(() => {
    callbackRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    let timerId: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        if (!document.hidden) {
          void callbackRef.current();
        }
      }, intervalMs);
    };

    const stopTimer = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        void callbackRef.current();
        startTimer();
      }
    };

    startTimer();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
