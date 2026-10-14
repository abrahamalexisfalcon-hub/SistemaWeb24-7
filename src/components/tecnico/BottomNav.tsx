import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, Clock, User } from 'lucide-react';

interface BottomNavProps {
  activeTab?: 'ordenes' | 'historial' | 'perfil';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determinar pestaña activa si no se pasa explícitamente
  const currentTab =
    activeTab ||
    (location.pathname.includes('/historial')
      ? 'historial'
      : location.pathname.includes('/perfil')
      ? 'perfil'
      : 'ordenes');

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-[#111827] border-t border-slate-800 shadow-2xl">
      <div className="grid grid-cols-3 h-16 items-center px-4">
        {/* Pestaña Órdenes */}
        <button
          onClick={() => navigate('/tecnico/ordenes')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'ordenes'
              ? 'text-[#0ea5e9]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight">Órdenes</span>
        </button>

        {/* Pestaña Historial */}
        <button
          onClick={() => navigate('/tecnico/historial')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'historial'
              ? 'text-[#0ea5e9]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight">Historial</span>
        </button>

        {/* Pestaña Mi Perfil */}
        <button
          onClick={() => navigate('/tecnico/perfil')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            currentTab === 'perfil'
              ? 'text-[#0ea5e9]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight">Mi Perfil</span>
        </button>
      </div>
    </nav>
  );
};
