import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'warning';
  isLoading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isLoading = false,
  loadingLabel = 'Procesando...',
  onConfirm,
  onCancel,
}) => {
  // Bloquear scroll del body mientras el modal esté abierto para prevenir desbordes
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
          iconBg: 'bg-rose-100 ring-8 ring-rose-50',
          btnPrimary: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 focus:ring-rose-500',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
          iconBg: 'bg-amber-100 ring-8 ring-amber-50',
          btnPrimary: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 focus:ring-amber-500',
        };
      default:
        return {
          icon: <Info className="w-6 h-6 text-sky-600" />,
          iconBg: 'bg-sky-100 ring-8 ring-sky-50',
          btnPrimary: 'bg-[#0ea5e9] hover:bg-[#0284c7] shadow-sky-500/25 focus:ring-[#0ea5e9]',
        };
    }
  };

  const styles = getVariantStyles();

  const modalElement = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Overlay de fondo desenfocado - Anclado 100% al viewport sin márgenes ni holguras */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Contenedor interactivo del Modal */}
      <div
        className="relative z-[101] w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Botón Secundario: Cancelar */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full min-h-[48px] py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {cancelLabel}
          </button>

          {/* Botón Primario: Confirmar */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full min-h-[48px] py-3 px-4 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${styles.btnPrimary}`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span className="truncate">{loadingLabel}</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};
