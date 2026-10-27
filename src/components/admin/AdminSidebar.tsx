import React from 'react';
import { ClipboardList, Wrench, PlusCircle, Users, PieChart, LogOut, User, RefreshCw } from 'lucide-react';
import type { AdminTab } from './AdminBottomNav';
import logoBlanco from '../../assets/Logo_blanco.png';

export interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user?: any;
  onLogout: () => void;
  onOpenPerfil: () => void;
  ordenesPendientesCount?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  user,
  onLogout,
  onOpenPerfil,
  ordenesPendientesCount = 0,
  onRefresh,
  isRefreshing = false,
}) => {
  const navItems = [
    {
      id: 'ordenes' as AdminTab,
      label: 'Órdenes de Trabajo',
      icon: ClipboardList,
      badge: ordenesPendientesCount > 0 ? ordenesPendientesCount : null,
    },
    {
      id: 'tecnicos' as AdminTab,
      label: 'Técnicos Operativos',
      icon: Wrench,
    },
    {
      id: 'nuevo' as AdminTab,
      label: 'Registrar Nueva Orden',
      icon: PlusCircle,
    },
    {
      id: 'clientes' as AdminTab,
      label: 'Clientes Afiliados',
      icon: Users,
    },
    {
      id: 'reportes' as AdminTab,
      label: 'Métricas y Reportes',
      icon: PieChart,
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 min-h-screen bg-slate-900 border-r border-slate-800/80 flex-col justify-between shrink-0 sticky top-0 h-screen select-none">
      {/* 1. Header con Logotipo */}
      <div>
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center justify-center gap-3">
            <img
              src={logoBlanco}
              alt="24/7 Asistencias"
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Panel Administrador
            </span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Actualizar datos en tiempo real"
                aria-label="Actualizar datos en tiempo real"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* 2. Menú de Navegación */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const activo = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activo
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${activo ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      activo ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Footer con Perfil y Logout */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* Tarjeta de Usuario */}
        <div
          onClick={onOpenPerfil}
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer group shadow-sm"
          title="Ver perfil de administrador"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate leading-snug">
              {user?.nombreCompleto || 'Administrador'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.correo || 'admin@asistencias247.com'}
            </p>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
