import React from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, LogOut } from 'lucide-react';

interface PerfilAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

export const PerfilAdminModal: React.FC<PerfilAdminModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  if (!isOpen) return null;

  const modalElement = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop anclado al viewport */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-[101] bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-black text-lg text-slate-900">Perfil Administrador</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 py-2">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
            <Shield className="w-7 h-7 text-[#0284c7]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{user?.nombreCompleto || 'Administrador'}</h3>
            <p className="text-xs text-slate-500">{user?.correo || 'admin@asistencias247.com'}</p>
            <span className="inline-block px-2 py-0.5 mt-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
              ADMINISTRADOR
            </span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <p>24/7 Asistencias Generales S.A.C.</p>
          <p className="text-[11px] text-slate-400">Versión 1.0.0 (PWA)</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};
