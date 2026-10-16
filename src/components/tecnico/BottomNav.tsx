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
  const isHistorial = activeTab === 'historial' || location.pathname.includes('/historial');
  const isPerfil = activeTab === 'perfil' || location.pathname.includes('/perfil');

  const currentTab = isHistorial ? 'historial' : isPerfil ? 'perfil' : 'ordenes';

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-[#111827] border-t border-slate-800/80 shadow-2xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-3 h-16 items-center px-3">
        {/* Pestaña Órdenes */}
        <button
          type="button"
          onClick={() => navigate('/tecnico/ordenes')}
          className={`min-h-[48px] py-1 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-95 focus:outline-none ${
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
          type="button"
          onClick={() => navigate('/tecnico/historial')}
          className={`min-h-[48px] py-1 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-95 focus:outline-none ${
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
          type="button"
          onClick={() => navigate('/tecnico/perfil')}
          className={`min-h-[48px] py-1 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-95 focus:outline-none ${
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
