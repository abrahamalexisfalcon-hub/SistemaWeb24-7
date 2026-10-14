import React from 'react';
import { BottomNav } from './BottomNav';

interface TecnicoLayoutProps {
  children: React.ReactNode;
  activeTab?: 'ordenes' | 'historial' | 'perfil';
  hideBottomNav?: boolean;
}

export const TecnicoLayout: React.FC<TecnicoLayoutProps> = ({
  children,
  activeTab,
  hideBottomNav = false,
}) => {
  return (
    <div className="min-h-screen bg-slate-200/60 flex justify-center">
      {/* Contenedor móvil con ancho máximo estándar iPhone/Android (max-w-md) */}
      <div className="w-full max-w-md min-h-screen bg-[#f8fafc] flex flex-col relative shadow-2xl border-x border-slate-100 overflow-x-hidden">
        {/* Contenido principal con padding inferior para no solaparse con el BottomNav */}
        <div className={`flex-1 flex flex-col ${hideBottomNav ? 'pb-6' : 'pb-20'}`}>
          {children}
        </div>

        {/* Barra de navegación inferior fija */}
        {!hideBottomNav && <BottomNav activeTab={activeTab} />}
      </div>
    </div>
  );
};
