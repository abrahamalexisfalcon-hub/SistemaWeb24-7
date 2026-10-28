import type { Usuario } from '../types';

/**
 * Almacenamiento de sesión compartido entre pestañas y ventanas de la PWA.
 *
 * La sesión se mantiene en localStorage para que, cuando el usuario abra la
 * aplicación desde una notificación push (lo que puede crear una nueva
 * pestaña/ventana), el contexto de autenticación pueda restaurarse sin exigir
 * un nuevo login. sessionStorage se conserva como respaldo de compatibilidad y
 * para los componentes que ya leen directamente desde allí.
 *
 * La expiración por inactividad se sigue validando con `last_activity_ts`:
 * una sesión antigua nunca se restaura solo por existir en localStorage.
 */
export const TOKEN_KEY = 'token';
export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user';
export const AUTH_USER_KEY = 'auth_user';
export const LAST_ACTIVITY_KEY = 'last_activity_ts';

const getItem = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const setItem = (storage: Storage, key: string, value: string): void => {
  try {
    storage.setItem(key, value);
  } catch {
    // El navegador puede bloquear el almacenamiento (modo privado, cuota, etc.)
  }
};

const removeItem = (storage: Storage, key: string): void => {
  try {
    storage.removeItem(key);
  } catch {
    // Ignorar almacenamiento restringido
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // Prioridad a la sesión de la pestaña actual; localStorage se usa como
  // respaldo para pestañas nuevas abiertas desde una notificación.
  return (
    getItem(window.sessionStorage, TOKEN_KEY) ||
    getItem(window.sessionStorage, AUTH_TOKEN_KEY) ||
    getItem(window.localStorage, TOKEN_KEY) ||
    getItem(window.localStorage, AUTH_TOKEN_KEY)
  );
};

export const getStoredUser = (): Usuario | null => {
  if (typeof window === 'undefined') return null;

  const raw =
    getItem(window.sessionStorage, USER_KEY) ||
    getItem(window.sessionStorage, AUTH_USER_KEY) ||
    getItem(window.localStorage, USER_KEY) ||
    getItem(window.localStorage, AUTH_USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
};

export const getStoredLastActivity = (): number | null => {
  if (typeof window === 'undefined') return null;

  const raw =
    getItem(window.sessionStorage, LAST_ACTIVITY_KEY) ||
    getItem(window.localStorage, LAST_ACTIVITY_KEY);

  if (!raw) return null;
  const timestamp = Number(raw);
  return Number.isFinite(timestamp) ? timestamp : null;
};

/**
 * Guarda la sesión en localStorage (compartida entre pestañas) y en
 * sessionStorage (compatibilidad con la sesión de la pestaña actual).
 */
export const saveAuthSession = (
  token: string,
  user: Usuario,
  lastActivity: number = Date.now()
): void => {
  if (typeof window === 'undefined') return;

  const serializedUser = JSON.stringify(user);
  const activity = String(lastActivity);

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    setItem(storage, TOKEN_KEY, token);
    setItem(storage, AUTH_TOKEN_KEY, token);
    setItem(storage, USER_KEY, serializedUser);
    setItem(storage, AUTH_USER_KEY, serializedUser);
    setItem(storage, LAST_ACTIVITY_KEY, activity);
  });
};

export const updateLastActivity = (timestamp: number = Date.now()): void => {
  if (typeof window === 'undefined') return;
  const value = String(timestamp);
  setItem(window.localStorage, LAST_ACTIVITY_KEY, value);
  setItem(window.sessionStorage, LAST_ACTIVITY_KEY, value);
};

export const clearAuthSession = (): void => {
  if (typeof window === 'undefined') return;

  [window.localStorage, window.sessionStorage].forEach((storage) => {
    removeItem(storage, TOKEN_KEY);
    removeItem(storage, AUTH_TOKEN_KEY);
    removeItem(storage, USER_KEY);
    removeItem(storage, AUTH_USER_KEY);
    removeItem(storage, LAST_ACTIVITY_KEY);
  });
};
