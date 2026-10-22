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

// Expiración automática tras 30 minutos de inactividad
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

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
        const now = Date.now();
        if (lastActivityRaw && now - Number(lastActivityRaw) >= INACTIVITY_TIMEOUT) {
          // Si ya superó los 30 minutos de inactividad antes de recargar
          sessionStorage.clear();
        } else {
          const parsedUser: Usuario = JSON.parse(storedUser);
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

  // Control automático de expiración por inactividad (30 minutos)
  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    const handleInactivityExpire = () => {
      logout();
      toast.info('Tu sesión ha expirado por inactividad (30 min).', {
        id: 'session-expired',
        duration: 4500,
      });
      if (window.location.pathname !== '/login') {
        window.location.replace('/login?motivo=inactividad');
      }
    };

    const resetTimer = () => {
      const now = Date.now();
      const lastActivityRaw = sessionStorage.getItem(LAST_ACTIVITY_KEY);

      // Si el dispositivo estuvo suspendido en segundo plano por más de 30 minutos
      if (lastActivityRaw && now - Number(lastActivityRaw) >= INACTIVITY_TIMEOUT) {
        handleInactivityExpire();
        return;
      }

      sessionStorage.setItem(LAST_ACTIVITY_KEY, String(now));

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(handleInactivityExpire, INACTIVITY_TIMEOUT);
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown',
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
  }, [isAuthenticated, logout]);

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

