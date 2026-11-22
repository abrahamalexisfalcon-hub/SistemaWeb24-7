import { useEffect, useRef } from 'react';

interface ModalStackEntry {
  id: number;
  close: () => void;
  closedByPopState: boolean;
  pathnameAtOpen: string;
}

const activeModalStack: ModalStackEntry[] = [];
let modalCounter = 0;
let ignorePopStateCount = 0;
let ignorePopStateResetTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBackSteps = 0;
let pendingBackTimer: ReturnType<typeof setTimeout> | null = null;
let popStateListenerAttached = false;

function handleGlobalPopState() {
  if (ignorePopStateCount > 0) {
    ignorePopStateCount--;
    if (ignorePopStateCount === 0 && ignorePopStateResetTimer !== null) {
      clearTimeout(ignorePopStateResetTimer);
      ignorePopStateResetTimer = null;
    }
    return;
  }

  const topEntry = activeModalStack.pop();
  if (topEntry) {
    topEntry.closedByPopState = true;
    topEntry.close();
  }
}

function ensurePopStateListener() {
  if (typeof window === 'undefined' || popStateListenerAttached) return;
  window.addEventListener('popstate', handleGlobalPopState);
  popStateListenerAttached = true;
}

/**
 * Intercepta el gesto o botón físico "Atrás" en dispositivos móviles cuando un modal
 * o popup está abierto, cerrando únicamente el modal activo superior (LIFO) en lugar
 * de salir de la ruta o cerrar la aplicación PWA.
 */
export function useModalBackButton(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    ensurePopStateListener();

    // Si había un retroceso pendiente del mismo ciclo (ej. StrictMode o reemplazo inmediato de modal),
    // consumir un paso pendiente en lugar de empujar y retroceder simultáneamente.
    if (pendingBackSteps > 0) {
      pendingBackSteps--;
      if (pendingBackSteps === 0 && pendingBackTimer !== null) {
        clearTimeout(pendingBackTimer);
        pendingBackTimer = null;
      }
    } else {
      const nextId = ++modalCounter;
      const currentState =
        window.history.state && typeof window.history.state === 'object'
          ? window.history.state
          : {};
      window.history.pushState(
        {
          ...currentState,
          __modalDepth: activeModalStack.length + 1,
          __modalId: nextId,
        },
        ''
      );
    }

    const entry: ModalStackEntry = {
      id: modalCounter,
      close: () => onCloseRef.current(),
      closedByPopState: false,
      pathnameAtOpen: window.location.pathname,
    };

    activeModalStack.push(entry);

    return () => {
      const idx = activeModalStack.indexOf(entry);
      if (idx !== -1) {
        activeModalStack.splice(idx, 1);
      }

      if (entry.closedByPopState) {
        return;
      }

      pendingBackSteps++;
      const expectedPathname = entry.pathnameAtOpen;

      if (pendingBackTimer !== null) {
        clearTimeout(pendingBackTimer);
      }

      pendingBackTimer = setTimeout(() => {
        pendingBackTimer = null;
        const stepsToRevert = pendingBackSteps;
        pendingBackSteps = 0;

        if (stepsToRevert <= 0) return;

        // Solo revertir la entrada virtual si seguimos en la misma ruta y el estado
        // actual del historial corresponde a una capa de modal abierta.
        const currentState = window.history.state;
        const hasModalHistoryState =
          currentState &&
          typeof currentState === 'object' &&
          '__modalDepth' in currentState;

        if (window.location.pathname === expectedPathname && hasModalHistoryState) {
          ignorePopStateCount = 1;
          window.history.go(-stepsToRevert);
          if (ignorePopStateResetTimer !== null) {
            clearTimeout(ignorePopStateResetTimer);
          }
          ignorePopStateResetTimer = setTimeout(() => {
            ignorePopStateResetTimer = null;
            ignorePopStateCount = 0;
          }, 200);
        }
      }, 40);
    };
  }, [isOpen]);
}
