import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario, LoginRequest, AuthResponse, RolUsuario } from '../types';
import { authApi } from '../api';
import { logoutOneSignal } from '../services/oneSignalService';

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
const USER_KEY = 'user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar estado desde localStorage al montar
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error restaurando sesión almacenada:', error);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const data = await authApi.login(credentials);
      const authenticatedUser: Usuario = {
        usuarioId: data.usuarioId,
        nombreCompleto: data.nombreCompleto,
        correo: data.correo,
        rol: data.rol,
      };

      // Si cambia de usuario o inicia sesión fresca, limpiar datos residuales
      const previousUserRaw = localStorage.getItem(USER_KEY);
      if (previousUserRaw) {
        try {
          const prevUser = JSON.parse(previousUserRaw);
          if (prevUser.usuarioId !== data.usuarioId) {
            localStorage.removeItem('tecnico_firma_url');
            localStorage.removeItem('ordenes_finalizadas_ids');
          }
        } catch {}
      }

      setToken(data.token);
      setUser(authenticatedUser);

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));

      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    if (user?.usuarioId) {
      localStorage.removeItem(`tecnico_${user.usuarioId}_firma_url`);
      localStorage.removeItem(`ordenes_finalizadas_ids_${user.usuarioId}`);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('tecnico_firma_url');
    localStorage.removeItem('ordenes_finalizadas_ids');
    logoutOneSignal();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
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
