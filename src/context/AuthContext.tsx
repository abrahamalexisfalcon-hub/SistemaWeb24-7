import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Usuario, LoginRequest, AuthResponse, RolUsuario } from '../types';
import { authApi } from '../api';
import { initOneSignal } from '../services/oneSignalService';
import { toast } from 'sonner';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isTecnico: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  logout: () => void;
  hasRole: (role: RolUsuario) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';
const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
const LAST_ACTIVITY_KEY = 'last_activity_ts';

// Expiración por inactividad diferenciada por rol:
// Administrador: 2 horas (7,200,000 ms)
// Técnico: 12 horas (43,200,000 ms)
export const INACTIVITY_TIMEOUT_ADMIN = 2 * 60 * 60 * 1000;
export const INACTIVITY_TIMEOUT_TECNICO = 12 * 60 * 60 * 1000;

export const getInactivityTimeoutForRole = (rol?: RolUsuario | string | null): number => {
  if (rol === 'ADMINISTRADOR') return INACTIVITY_TIMEOUT_ADMIN;
  if (rol === 'TECNICO') return INACTIVITY_TIMEOUT_TECNICO;
  return INACTIVITY_TIMEOUT_ADMIN;
};

export const getInactivityLabelForRole = (rol?: RolUsuario | string | null): string => {
  return rol === 'TECNICO' ? '12 horas' : '2 horas';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inicializar estado exclusivamente desde sessionStorage al montar (se destruye al cerrar pestaña/app)
  useEffect(() => {
    try {
      // Limpieza defensiva de posibles credenciales antiguas en localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('auth_user');

      const storedToken = sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = sessionStorage.getItem(USER_KEY);
      const lastActivityRaw = sessionStorage.getItem(LAST_ACTIVITY_KEY);

      if (storedToken && storedUser) {
        const parsedUser: Usuario = JSON.parse(storedUser);
        const timeout = getInactivityTimeoutForRole(parsedUser.rol);
        const now = Date.now();
        if (lastActivityRaw && now - Number(lastActivityRaw) >= timeout) {
          // Si ya superó el tiempo de inactividad correspondiente antes de recargar
          sessionStorage.clear();
        } else {
          setToken(storedToken);
          setUser(parsedUser);
          sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));
          if (parsedUser.usuarioId && parsedUser.rol === 'TECNICO') {
            initOneSignal(parsedUser.usuarioId);
          }
        }
      }
    } catch (error) {
      console.error('Error restaurando sesión almacenada:', error);
      sessionStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (user?.usuarioId) {
      localStorage.removeItem(`tecnico_${user.usuarioId}_firma_url`);
      localStorage.removeItem(`ordenes_finalizadas_ids_${user.usuarioId}`);
    }

    sessionStorage.clear();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('tecnico_firma_url');
    localStorage.removeItem('ordenes_finalizadas_ids');

    setToken(null);
    setUser(null);
  }, [user?.usuarioId]);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    const data = await authApi.login(credentials);
    const authenticatedUser: Usuario = {
      usuarioId: data.usuarioId,
      nombreCompleto: data.nombreCompleto,
      correo: data.correo,
      rol: data.rol,
    };

    // Si cambia de usuario o inicia sesión fresca, limpiar datos residuales
    const previousUserRaw = sessionStorage.getItem(USER_KEY);
    if (previousUserRaw) {
      try {
        const prevUser = JSON.parse(previousUserRaw);
        if (prevUser.usuarioId !== data.usuarioId) {
          localStorage.removeItem('tecnico_firma_url');
          localStorage.removeItem('ordenes_finalizadas_ids');
        }
      } catch {}
    }

    // Limpieza defensiva en localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('auth_user');

    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

    setToken(data.token);
    setUser(authenticatedUser);

    if (authenticatedUser.usuarioId && authenticatedUser.rol === 'TECNICO') {
      initOneSignal(authenticatedUser.usuarioId);
    }

    return data;
  };

  const isAuthenticated = !!token && !!user;

  // Control automático de expiración por inactividad diferenciada por roles:
  // Administrador: 2 horas | Técnico: 12 horas
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    const currentTimeout = getInactivityTimeoutForRole(user.rol);
    const timeoutLabel = getInactivityLabelForRole(user.rol);

    const handleInactivityExpire = () => {
      logout();
      toast.info(`Tu sesión ha expirado por inactividad (${timeoutLabel}).`, {
        id: 'session-expired',
        duration: 4500,
      });
      if (window.location.pathname !== '/login') {
        window.location.replace(`/login?motivo=inactividad&tiempo=${encodeURIComponent(timeoutLabel)}`);
      }
    };

    let lastRecordedActivity = Date.now();

    const resetTimer = () => {
      const now = Date.now();
      const lastActivityRaw = sessionStorage.getItem(LAST_ACTIVITY_KEY);

      // Si el dispositivo estuvo suspendido en segundo plano por más del tiempo permitido
      if (lastActivityRaw && now - Number(lastActivityRaw) >= currentTimeout) {
        handleInactivityExpire();
        return;
      }

      // Throttle: evitar escrituras y setTimeout continuos en ráfagas de mouse/touch menores a 5 segundos
      if (now - lastRecordedActivity < 5000 && inactivityTimerRef.current) {
        return;
      }
      lastRecordedActivity = now;

      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(handleInactivityExpire, currentTimeout);
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };

    // Iniciar el temporizador al autenticarse
    resetTimer();

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetTimer, { passive: true });
    });
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetTimer);
      });
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [isAuthenticated, user?.rol, logout]);

  const isAdmin = user?.rol === 'ADMINISTRADOR';
  const isTecnico = user?.rol === 'TECNICO';

  const hasRole = (role: RolUsuario): boolean => {
    return user?.rol === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isAdmin,
        isTecnico,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

