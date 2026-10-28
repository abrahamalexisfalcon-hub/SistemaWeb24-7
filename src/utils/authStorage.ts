import type { Usuario } from '../types';

/**
 * Almacenamiento de sesión persistente de la PWA.
 *
 * La sesión se guarda EXCLUSIVAMENTE en localStorage para sobrevivir al cierre
 * de pestañas, la suspensión de la app móvil/PWA y la apertura desde una
 * notificación push. sessionStorage solo se lee para migrar sesiones antiguas.
 *
 * Para el rol TÉCNICO no se aplica expiración por inactividad: la sesión solo
 * se destruye mediante el botón “Cerrar Sesión” o ante un 401 real del backend.
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

const clearSessionStorageAuth = (): void => {
  removeItem(window.sessionStorage, TOKEN_KEY);
  removeItem(window.sessionStorage, AUTH_TOKEN_KEY);
  removeItem(window.sessionStorage, USER_KEY);
  removeItem(window.sessionStorage, AUTH_USER_KEY);
  removeItem(window.sessionStorage, LAST_ACTIVITY_KEY);
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  // localStorage es la fuente principal. sessionStorage se consulta solo para
  // migrar sesiones creadas por versiones anteriores de la aplicación.
  return (
    getItem(window.localStorage, TOKEN_KEY) ||
    getItem(window.localStorage, AUTH_TOKEN_KEY) ||
    getItem(window.sessionStorage, TOKEN_KEY) ||
    getItem(window.sessionStorage, AUTH_TOKEN_KEY)
  );
};

export const getStoredUser = (): Usuario | null => {
  if (typeof window === 'undefined') return null;

  const raw =
    getItem(window.localStorage, USER_KEY) ||
    getItem(window.localStorage, AUTH_USER_KEY) ||
    getItem(window.sessionStorage, USER_KEY) ||
    getItem(window.sessionStorage, AUTH_USER_KEY);

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
    getItem(window.localStorage, LAST_ACTIVITY_KEY) ||
    getItem(window.sessionStorage, LAST_ACTIVITY_KEY);

  if (!raw) return null;
  const timestamp = Number(raw);
  return Number.isFinite(timestamp) ? timestamp : null;
};

/**
 * Persiste la sesión únicamente en localStorage y elimina cualquier copia
 * heredada de sessionStorage.
 */
export const saveAuthSession = (
  token: string,
  user: Usuario,
  lastActivity: number = Date.now()
): void => {
  if (typeof window === 'undefined') return;

  const serializedUser = JSON.stringify(user);
  const activity = String(lastActivity);

  setItem(window.localStorage, TOKEN_KEY, token);
  setItem(window.localStorage, AUTH_TOKEN_KEY, token);
  setItem(window.localStorage, USER_KEY, serializedUser);
  setItem(window.localStorage, AUTH_USER_KEY, serializedUser);
  setItem(window.localStorage, LAST_ACTIVITY_KEY, activity);

  clearSessionStorageAuth();
};

export const updateLastActivity = (timestamp: number = Date.now()): void => {
  if (typeof window === 'undefined') return;
  const value = String(timestamp);
  setItem(window.localStorage, LAST_ACTIVITY_KEY, value);
  removeItem(window.sessionStorage, LAST_ACTIVITY_KEY);
};

export const clearAuthSession = (): void => {
  if (typeof window === 'undefined') return;

  removeItem(window.localStorage, TOKEN_KEY);
  removeItem(window.localStorage, AUTH_TOKEN_KEY);
  removeItem(window.localStorage, USER_KEY);
  removeItem(window.localStorage, AUTH_USER_KEY);
  removeItem(window.localStorage, LAST_ACTIVITY_KEY);
  clearSessionStorageAuth();
};
