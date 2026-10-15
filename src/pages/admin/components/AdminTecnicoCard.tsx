import React from 'react';
import type { TecnicoResumen, OrdenDetalleAdmin } from '../../../types';
import { Mail, Phone, Edit2 } from 'lucide-react';

interface AdminTecnicoCardProps {
  tecnico: TecnicoResumen;
  ordenes: OrdenDetalleAdmin[];
  onEditar: (tec: TecnicoResumen) => void;
}

export const AdminTecnicoCard: React.FC<AdminTecnicoCardProps> = ({
  tecnico,
  ordenes,
  onEditar,
}) => {
  const esActivo = tecnico.activo !== false;
  const switchDisponible = tecnico.disponible !== false;
  const tieneOrdenEnCurso = ordenes.some(
    (o) => o.tecnicoId === tecnico.id && (o.estado === 'EN_DOMICILIO' || o.estado === 'PENDIENTE')
  );

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3 space-y-3 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                !esActivo || !switchDisponible
                  ? 'bg-slate-400'
                  : tieneOrdenEnCurso
                  ? 'bg-amber-500'
                  : 'bg-emerald-500 animate-pulse'
              }`}
              title={
                !esActivo
                  ? 'Inactivo'
                  : tieneOrdenEnCurso
                  ? 'En atención'
                  : switchDisponible
                  ? 'Disponible'
                  : 'No disponible'
              }
            />
            <span className="font-bold text-slate-900 text-sm truncate shrink">
              {tecnico.nombreCompleto}
            </span>
            <span
              title={tecnico.especialidad || 'General'}
              className="shrink-0 inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 whitespace-nowrap max-w-[140px] truncate border border-sky-100/80"
            >
              {tecnico.especialidad === 'Climatización y Aire Acondicionado'
                ? 'Climatización'
                : (tecnico.especialidad || 'General')}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 text-xs text-slate-500 pt-0.5">
            <span className="flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{tecnico.correo}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{tecnico.telefono || 'Sin teléfono'}</span>
            </span>
          </div>
        </div>

        {/* Botón Editar */}
        <button
          type="button"
          onClick={() => onEditar(tecnico)}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
          title="Editar técnico"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Indicador de Disponibilidad (Solo Lectura) */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500">
          Disponibilidad:
        </span>
        {tieneOrdenEnCurso && esActivo ? (
          <div className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>En atención</span>
          </div>
        ) : switchDisponible && esActivo ? (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Disponible</span>
          </div>
        ) : (
          <div className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>No disponible</span>
          </div>
        )}
      </div>
    </div>
  );
};
