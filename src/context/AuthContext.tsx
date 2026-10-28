import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Usuario, LoginRequest, AuthResponse, RolUsuario } from '../types';
import { authApi } from '../api';
import { initOneSignal } from '../services/oneSignalService';
import {
  getStoredLastActivity,
  getStoredToken,
  getStoredUser,
  saveAuthSession,
  updateLastActivity,
  clearAuthSession,
} from '../utils/authStorage';
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

  // Restaurar la sesión desde el almacenamiento compartido. Esto es clave para
  // las notificaciones push: al abrir la app en una nueva pestaña/ventana, la
  // sesión activa debe estar disponible sin forzar un nuevo login.
  useEffect(() => {
    try {
      const storedToken = getStoredToken();
      const parsedUser = getStoredUser();
      const lastActivity = getStoredLastActivity();

      if (storedToken && parsedUser) {
        const timeout = getInactivityTimeoutForRole(parsedUser.rol);
        const now = Date.now();

        if (lastActivity === null || now - lastActivity >= timeout) {
          // La sesión existía, pero ya superó el tiempo de inactividad permitido
          // o no tiene una marca de actividad válida.
          clearAuthSession();
        } else {
          // Migra sesiones antiguas de sessionStorage y mantiene sincronizadas
          // todas las pestañas con el mismo usuario autenticado.
          saveAuthSession(storedToken, parsedUser, now);
          setToken(storedToken);
          setUser(parsedUser);
          if (parsedUser.usuarioId && parsedUser.rol === 'TECNICO') {
            initOneSignal(parsedUser.usuarioId);
          }
        }
      } else if (storedToken || parsedUser) {
        // Estado de autenticación incompleto/corrupto: no permitir media sesión.
        clearAuthSession();
      }
    } catch (error) {
      console.error('Error restaurando sesión almacenada:', error);
      clearAuthSession();
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

    // Cierre de sesión explícito: limpiar credenciales y los datos temporales
    // de la pestaña. Nunca se ejecuta desde el manejador de notificaciones.
    clearAuthSession();
    try {
      sessionStorage.clear();
    } catch {
      // Ignorar almacenamiento restringido
    }
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
    const previousUser = getStoredUser();
    if (previousUser && previousUser.usuarioId !== data.usuarioId) {
      localStorage.removeItem('tecnico_firma_url');
      localStorage.removeItem('ordenes_finalizadas_ids');
    }

    // Guardar en localStorage + sessionStorage para que la sesión sobreviva
    // a la apertura de la app desde una notificación push.
    saveAuthSession(data.token, authenticatedUser);

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
      const lastActivity = getStoredLastActivity();

      // Si el dispositivo estuvo suspendido en segundo plano por más del tiempo permitido
      if (lastActivity !== null && now - lastActivity >= currentTimeout) {
        handleInactivityExpire();
        return;
      }

      // Throttle: evitar escrituras y setTimeout continuos en ráfagas de mouse/touch menores a 5 segundos
      if (now - lastRecordedActivity < 5000 && inactivityTimerRef.current) {
        return;
      }
      lastRecordedActivity = now;

      updateLastActivity(now);

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

