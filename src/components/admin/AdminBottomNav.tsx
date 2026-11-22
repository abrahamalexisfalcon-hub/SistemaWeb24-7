import React from 'react';
import { ClipboardList, Wrench, PlusCircle, Users, PieChart } from 'lucide-react';

export type AdminTab = 'ordenes' | 'tecnicos' | 'nuevo' | 'clientes' | 'reportes';

interface AdminBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'ordenes', label: 'Órdenes', icon: ClipboardList },
    { id: 'tecnicos', label: 'Técnicos', icon: Wrench },
    { id: 'nuevo', label: 'Nuevo', icon: PlusCircle },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'reportes', label: 'Reportes', icon: PieChart },
  ];

  return (
    <nav
      aria-label="Navegación inferior de administración"
      className="fixed bottom-0 left-0 right-0 z-40 w-full lg:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] pb-[env(safe-area-inset-bottom,0px)] select-none"
    >
      <div className="max-w-lg sm:max-w-2xl mx-auto grid grid-cols-5 items-center px-2 sm:px-4 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative w-full min-h-[52px] py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none ${
                isActive
                  ? 'text-[#38bdf8]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Indicador superior centrado para pestaña activa */}
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200 ${
                  isActive ? 'w-6 bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'w-0 bg-transparent'
                }`}
              />

              {/* Contenedor píldora uniforme para centrado óptico simétrico */}
              <span
                className={`w-11 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500/15 text-[#38bdf8] shadow-sm shadow-sky-500/10 ring-1 ring-sky-400/20'
                    : 'text-slate-400 group-hover:bg-slate-800/60 group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />
              </span>

              {/* Etiqueta centrada con ancho completo */}
              <span
                className={`w-full text-center text-[11px] leading-none tracking-tight truncate transition-colors duration-200 ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 font-medium group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
