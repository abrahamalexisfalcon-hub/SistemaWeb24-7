import React from 'react';
import type { TecnicoResumen, OrdenDetalleAdmin } from '../../../types';
import { Mail, Phone, Edit2, Power, RefreshCw } from 'lucide-react';
import { obtenerEspecialidadesTecnico } from '../../../utils/tecnicoEspecialidades';

interface AdminTecnicoCardProps {
  tecnico: TecnicoResumen;
  ordenes: OrdenDetalleAdmin[];
  onEditar: (tec: TecnicoResumen) => void;
  onToggleEstado?: (tec: TecnicoResumen) => Promise<boolean | void> | void;
  togglingId?: number | null;
}

export const AdminTecnicoCard: React.FC<AdminTecnicoCardProps> = ({
  tecnico,
  ordenes,
  onEditar,
  onToggleEstado,
  togglingId,
}) => {
  const esActivo = tecnico.activo !== false;
  const switchDisponible = tecnico.disponible !== false;
  const tieneOrdenEnCurso = ordenes.some(
    (o) => o.tecnicoId === tecnico.id && (o.estado === 'EN_DOMICILIO' || o.estado === 'PENDIENTE')
  );
  const listaEspecialidades = obtenerEspecialidadesTecnico(tecnico);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3 transition-all flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
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
            <span className="font-bold text-slate-900 text-sm truncate">
              {tecnico.nombreCompleto}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {listaEspecialidades.map((esp) => (
              <span
                key={esp}
                title={esp}
                className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100/80 max-w-full truncate"
              >
                {esp === 'Climatización y Aire Acondicionado' ? 'Climatización' : esp}
              </span>
            ))}
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

        {/* Estado de cuenta rápido */}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
            esActivo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}
        >
          {esActivo ? 'Activo' : 'Inactivo'}
        </span>
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

      {/* Acciones directas */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
        {onToggleEstado && (
          <button
            type="button"
            onClick={() => onToggleEstado(tecnico)}
            disabled={togglingId === tecnico.id}
            title={esActivo ? 'Desactivar cuenta del técnico' : 'Activar cuenta del técnico'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50 cursor-pointer ${
              esActivo
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {togglingId === tecnico.id ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Power className="w-3.5 h-3.5" />
            )}
            <span>{esActivo ? 'Desactivar' : 'Activar'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onEditar(tecnico)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          title="Editar técnico"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Editar</span>
        </button>
      </div>
    </div>
  );
};
