import React, { useState } from 'react';
import type { OrdenDetalleAdmin } from '../../../types';
import { X, RefreshCw } from 'lucide-react';

interface AnularOrdenModalProps {
  isOpen: boolean;
  orden: OrdenDetalleAdmin | null;
  onClose: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
  anulando: boolean;
  error: string | null;
}

export const AnularOrdenModal: React.FC<AnularOrdenModalProps> = ({
  isOpen,
  orden,
  onClose,
  onConfirmar,
  anulando,
  error,
}) => {
  const [motivo, setMotivo] = useState('');

  if (!isOpen || !orden) return null;

  const handleConfirmar = async () => {
    if (motivo.trim().length < 5) return;
    await onConfirmar(motivo.trim());
    setMotivo('');
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-black text-base text-slate-900">
            ¿Deseas anular esta orden de trabajo?
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Esta acción liberará la orden #{orden.codigoOrden} y registrará el motivo en auditoría.
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            Motivo de la anulación (mínimo 5 caracteres) <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe detalladamente el motivo de la anulación..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition-all resize-none"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Mínimo 5 caracteres</span>
            <span className={motivo.trim().length >= 5 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
              {motivo.trim().length}/5
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={anulando}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={anulando || motivo.trim().length < 5}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-1.5"
          >
            {anulando ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Anulando...</span>
              </>
            ) : (
              <span>Confirmar Anulación</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
