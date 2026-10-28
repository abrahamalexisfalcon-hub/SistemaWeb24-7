import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrdenesProvider } from './context/OrdenesContext';
import { ProtectedRoute } from './components';
import { Login } from './pages/Login';
import { Toaster } from 'sonner';
import './App.css';

const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const OrdenesList = lazy(() =>
  import('./pages/tecnico/OrdenesList').then((m) => ({ default: m.OrdenesList }))
);
const OrdenDetalle = lazy(() =>
  import('./pages/tecnico/OrdenDetalle').then((m) => ({ default: m.OrdenDetalle }))
);
const AtencionTecnica = lazy(() =>
  import('./pages/tecnico/AtencionTecnica').then((m) => ({ default: m.AtencionTecnica }))
);
const ValidacionCierre = lazy(() =>
  import('./pages/tecnico/ValidacionCierre').then((m) => ({ default: m.ValidacionCierre }))
);
const ExitoOrden = lazy(() =>
  import('./pages/tecnico/ExitoOrden').then((m) => ({ default: m.ExitoOrden }))
);
const Historial = lazy(() =>
  import('./pages/tecnico/Historial').then((m) => ({ default: m.Historial }))
);
const Perfil = lazy(() =>
  import('./pages/tecnico/Perfil').then((m) => ({ default: m.Perfil }))
);

const RouteFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-10 h-10 border-4 border-[#0ea5e9] border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * Escucha los clics de notificaciones OneSignal resueltos por oneSignalService
 * y navega dentro del router. No recarga la página ni toca el estado de sesión.
 */
const NotificationNavigationHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path;
      if (!path || !path.startsWith('/')) return;
      navigate(path);
    };

    window.addEventListener('asistencias247:navigate', handleNavigate);
    return () => window.removeEventListener('asistencias247:navigate', handleNavigate);
  }, [navigate]);

  return null;
};

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <RouteFallback />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.rol === 'ADMINISTRADOR') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/tecnico/ordenes" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <OrdenesProvider>
        <BrowserRouter>
          <NotificationNavigationHandler />
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3500}
            toastOptions={{
              className: 'font-sans text-xs shadow-lg rounded-xl',
            }}
          />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Ruta pública de Login con diseño Figma */}
              <Route path="/login" element={<Login />} />

              {/* Rutas protegidas para Administrador */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ordenes"
                element={
                  <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Rutas protegidas para Técnico Móvil */}
              <Route
                path="/tecnico"
                element={<Navigate to="/tecnico/ordenes" replace />}
              />

              {/* Pantalla 2: Listado de Órdenes */}
              <Route
                path="/tecnico/ordenes"
                element={
                  <ProtectedRoute allowedRoles={['TECNICO', 'ADMINISTRADOR']}>
                    <OrdenesList />
                  </ProtectedRoute>
                }
              />

              {/* Pantalla 3: Detalle de Orden - En Camino */}
              <Route
                path="/tecnico/ordenes/:id"
                element={
                  <ProtectedRoute allowedRoles={['TECNICO', 'ADMINISTRADOR']}>
                    <OrdenDetalle />
                  </ProtectedRoute>
                }
              />

              {/* Pantalla 4: Formulario de Atención Técnica */}
              <Route
                path="/tecnico/ordenes/:id/atencion"
                element={
                  <ProtectedRoute allowedRoles={['TECNICO', 'ADMINISTRADOR']}>
                    <AtencionTecnica />
                  </ProtectedRoute>
                }
              />

              {/* Pantalla 5: Validación y Cierre */}
              <Route
                path="/tecnico/ordenes/:id/cierre"
                element={
                  <ProtectedRoute allowedRoles={['TECNICO', 'ADMINISTRADOR']}>
                    <ValidacionCierre />
                  </ProtectedRoute>
                }
              />

              {/* Pantalla 6: Pantalla de Éxito */}
              <Route
                path="/tecnico/ordenes/:id/exito"
                element={
                  <ProtectedRoute allowedRoles={['TECNICO', 'ADMINISTRADOR']}>
                    <ExitoOrden />
                  </ProtectedRoute>
                }
              />

              {/* Pestañas adicionales del Bottom Nav */}
              <Route
                path="/tecnico/historial"
                element={
                  <ProtectedRoute allowedRoles={['TECNICO', 'ADMINISTRADOR']}>
                    <Historial />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tecnico/perfil"
                element={
                  <ProtectedRoute allowedRoles={['TECNICO', 'ADMINISTRADOR']}>
                    <Perfil />
                  </ProtectedRoute>
                }
              />

              {/* Redirección inteligente de raíz */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Ruta de rescate */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </OrdenesProvider>
    </AuthProvider>
  );
};

export default App;

