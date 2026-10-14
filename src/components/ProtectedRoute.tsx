import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { RolUsuario } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RolUsuario[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-600">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    // Redirige al dashboard correspondiente según el rol que sí posee
    if (user.rol === 'ADMINISTRADOR') {
      return <Navigate to="/admin" replace />;
    }
    if (user.rol === 'TECNICO') {
      return <Navigate to="/tecnico" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
