import React from 'react';
import type { TecnicoResumen, OrdenDetalleAdmin } from '../../../types';
import { Plus } from 'lucide-react';
import { AdminTecnicoCard } from '../components/AdminTecnicoCard';

interface TecnicosTabProps {
  tecnicos: TecnicoResumen[];
  ordenes: OrdenDetalleAdmin[];
  onNuevoTecnico: () => void;
  onEditarTecnico: (tec: TecnicoResumen) => void;
}

export const TecnicosTab: React.FC<TecnicosTabProps> = ({
  tecnicos,
  ordenes,
  onNuevoTecnico,
  onEditarTecnico,
}) => {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Técnicos Operativos
          </h1>
        </div>
        <button
          type="button"
          onClick={onNuevoTecnico}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl px-2 py-2 text-sm shadow-sm transition-colors flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Técnico</span>
        </button>
      </div>

      <div className="space-y-3">
        {tecnicos.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center shadow-xs">
            <p className="text-sm font-semibold text-slate-700">No hay técnicos registrados</p>
          </div>
        ) : (
          tecnicos.map((tec) => (
            <AdminTecnicoCard
              key={tec.id}
              tecnico={tec}
              ordenes={ordenes}
              onEditar={onEditarTecnico}
            />
          ))
        )}
      </div>
    </div>
  );
};
