import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Wrench, Shield, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title = '24/7 Asistencias' }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Nombre del Sistema */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900 tracking-tight">{title}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                  PWA
                </span>
              </div>
              <p className="text-xs text-gray-500">Gestión de Asistencias Domiciliarias</p>
            </div>
          </div>

          {/* Información del Usuario y Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-3 pr-2 border-r border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.nombreCompleto}</div>
                  <div className="flex items-center justify-end gap-1.5">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700">
                        <Shield className="w-3 h-3" /> Administrador
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <Wrench className="w-3 h-3" /> Técnico de Campo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              title="Cerrar sesión"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
