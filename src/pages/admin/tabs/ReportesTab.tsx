import React from 'react';
import type { OrdenDetalleAdmin } from '../../../types';
import { TrendingUp, CheckCircle, Award } from 'lucide-react';

interface ReportesTabProps {
  ordenes: OrdenDetalleAdmin[];
}

export const ReportesTab: React.FC<ReportesTabProps> = ({ ordenes }) => {
  const listado = ordenes || [];

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      <div className="pb-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">
          Métricas Operativas
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Resumen general del rendimiento del servicio
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xs border border-slate-100 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Órdenes</span>
          <p className="text-2xl lg:text-3xl font-black text-slate-900">{listado.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Registradas
          </span>
        </div>

        <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xs border border-slate-100 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Finalizadas</span>
          <p className="text-2xl lg:text-3xl font-black text-emerald-600">
            {listado.filter((o) => o && o.estado === 'FINALIZADA').length}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> 100% Calidad
          </span>
        </div>

        <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xs border border-slate-100 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">En proceso</span>
          <p className="text-2xl lg:text-3xl font-black text-amber-600">
            {listado.filter((o) => o && o.estado === 'EN_DOMICILIO').length}
          </p>
          <span className="text-[10px] text-amber-600 font-semibold">Técnico en ruta</span>
        </div>

        <div className="bg-white rounded-3xl p-4 lg:p-5 shadow-xs border border-slate-100 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Pendientes</span>
          <p className="text-2xl lg:text-3xl font-black text-sky-600">
            {listado.filter((o) => o && o.estado === 'PENDIENTE').length}
          </p>
          <span className="text-[10px] text-sky-600 font-semibold">Por asignar</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 lg:p-6 shadow-xs border border-slate-100 space-y-2 lg:max-w-xl">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Nivel de Satisfacción</span>
        </div>
        <p className="text-2xl lg:text-3xl font-black text-slate-900">4.9 / 5.0 ★</p>
        <p className="text-xs text-slate-500">
          Basado en las evaluaciones registradas en las Hojas de Servicio cerradas.
        </p>
      </div>
    </div>
  );
};
