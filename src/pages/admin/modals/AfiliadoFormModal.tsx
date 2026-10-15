import React, { useState } from 'react';
import type { CrearAfiliadoRequest } from '../../../types';
import { X, RefreshCw, AlertCircle } from 'lucide-react';

interface AfiliadoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearAfiliadoRequest) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

export const AfiliadoFormModal: React.FC<AfiliadoFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  error,
}) => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [distrito, setDistrito] = useState('Villa El Salvador');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      nombreCompleto: nombreCompleto.trim(),
      dni: dni.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      referencia: '',
      distrito: distrito.trim(),
    });
    setNombreCompleto('');
    setDni('');
    setTelefono('');
    setDireccion('');
    setDistrito('Villa El Salvador');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-black text-base text-slate-900">Registrar Afiliado</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Apellidos y Nombres</label>
            <input
              type="text"
              required
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej. Juan Pérez Ramos"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">DNI N°</label>
              <input
                type="text"
                required
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="12345678"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="987654321"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Dirección</label>
            <input
              type="text"
              required
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. Central 120"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Distrito</label>
            <input
              type="text"
              required
              value={distrito}
              onChange={(e) => setDistrito(e.target.value)}
              placeholder="Villa El Salvador"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl mt-2 flex items-center justify-center gap-2"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Guardar Afiliado</span>}
          </button>
        </form>
      </div>
    </div>
  );
};
