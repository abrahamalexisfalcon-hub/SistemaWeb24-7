import React from 'react';
import { ClipboardList, Wrench, PlusCircle, Users, PieChart } from 'lucide-react';

export type AdminTab = 'ordenes' | 'tecnicos' | 'nuevo' | 'clientes' | 'reportes';

interface AdminBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 lg:hidden w-full shadow-2xl">
      <div className="max-w-md sm:max-w-xl mx-auto grid grid-cols-5 h-16 items-center px-2">
        {/* 1. Órdenes */}
        <button
          onClick={() => onTabChange('ordenes')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'ordenes'
              ? 'text-[#38bdf8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className={`text-[10px] tracking-tight ${activeTab === 'ordenes' ? 'font-semibold' : 'font-medium'}`}>
            Órdenes
          </span>
        </button>

        {/* 2. Técnicos */}
        <button
          onClick={() => onTabChange('tecnicos')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'tecnicos'
              ? 'text-[#38bdf8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className={`text-[10px] tracking-tight ${activeTab === 'tecnicos' ? 'font-semibold' : 'font-medium'}`}>
            Técnicos
          </span>
        </button>

        {/* 3. Nuevo (Botón central de acción) */}
        <button
          onClick={() => onTabChange('nuevo')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'nuevo'
              ? 'text-[#38bdf8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className={`text-[10px] tracking-tight ${activeTab === 'nuevo' ? 'font-semibold' : 'font-medium'}`}>
            Nuevo
          </span>
        </button>

        {/* 4. Clientes */}
        <button
          onClick={() => onTabChange('clientes')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'clientes'
              ? 'text-[#38bdf8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className={`text-[10px] tracking-tight ${activeTab === 'clientes' ? 'font-semibold' : 'font-medium'}`}>
            Clientes
          </span>
        </button>

        {/* 5. Reportes */}
        <button
          onClick={() => onTabChange('reportes')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            activeTab === 'reportes'
              ? 'text-[#38bdf8]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className={`text-[10px] tracking-tight ${activeTab === 'reportes' ? 'font-semibold' : 'font-medium'}`}>
            Reportes
          </span>
        </button>
      </div>
    </nav>
  );
};
