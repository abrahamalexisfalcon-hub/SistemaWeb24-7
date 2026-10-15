import React from 'react';
import type { Afiliado } from '../../../types';
import { Plus, MapPin, Phone } from 'lucide-react';

interface ClientesTabProps {
  afiliados: Afiliado[];
  onNuevoAfiliado: () => void;
}

export const ClientesTab: React.FC<ClientesTabProps> = ({
  afiliados,
  onNuevoAfiliado,
}) => {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Clientes Afiliados
          </h1>
          <p className="text-xs text-slate-500">
            Padrón de afiliados activos en 24/7 Asistencias
          </p>
        </div>
        <button
          onClick={onNuevoAfiliado}
          className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 flex items-center justify-center transition-colors"
          title="Registrar afiliado"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {afiliados.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center shadow-xs">
            <p className="text-sm font-semibold text-slate-700">No hay afiliados registrados</p>
          </div>
        ) : (
          afiliados.map((a) => (
            <div key={a.id} className="bg-white rounded-3xl p-5 shadow-xs space-y-1.5 border border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{a.nombreCompleto}</h4>
                <span className="text-xs font-semibold text-slate-500">DNI: {a.dni}</span>
              </div>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {a.direccion} - {a.distrito}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {a.telefono || 'Sin teléfono'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
