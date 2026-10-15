import React from 'react';
import type { CrearOrdenRequest, Afiliado, TecnicoResumen } from '../../../types';
import { Plus, RefreshCw, AlertCircle, CheckCircle, Package, Layers } from 'lucide-react';

interface NuevaOrdenTabProps {
  nuevaOrden: CrearOrdenRequest;
  onNuevaOrdenChange: (val: CrearOrdenRequest) => void;
  especialidades: string[];
  cargandoEspecialidades: boolean;
  afiliados: Afiliado[];
  tecnicos: TecnicoResumen[];
  submitting: boolean;
  formError: string | null;
  formExito: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onAbrirNuevoAfiliado: () => void;
  onAbrirMateriales: () => void;
  onAbrirEspecialidades: () => void;
}

export const NuevaOrdenTab: React.FC<NuevaOrdenTabProps> = ({
  nuevaOrden,
  onNuevaOrdenChange,
  especialidades,
  cargandoEspecialidades,
  afiliados,
  tecnicos,
  submitting,
  formError,
  formExito,
  onSubmit,
  onAbrirNuevoAfiliado,
  onAbrirMateriales,
  onAbrirEspecialidades,
}) => {
  return (
    <div className="p-5 space-y-4 lg:p-0 lg:space-y-6">
      <div className="pb-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">
          Registrar Nueva Orden
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Crea y asigna una asistencia técnica de emergencia
        </p>
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formExito && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{formExito}</span>
        </div>
      )}

      {/* Grid de 2 columnas en Desktop (Formulario a la izquierda, Accesos Rápidos a la derecha) */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        <div className="lg:col-span-2">
          <form onSubmit={onSubmit} className="bg-white rounded-3xl p-5 shadow-xs space-y-4 border border-slate-100 lg:p-7">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Especialidad / Servicio
          </label>
          <select
            value={nuevaOrden.tipoServicio}
            onChange={(e) => {
              if (e.target.value === '__NEW__' || e.target.value === '__NUEVA__') {
                onAbrirEspecialidades();
              } else {
                onNuevaOrdenChange({ ...nuevaOrden, tipoServicio: e.target.value });
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
          >
            {cargandoEspecialidades ? (
              <option value="" disabled>Cargando especialidades...</option>
            ) : (especialidades || []).length === 0 ? (
              <option value="" disabled>No hay especialidades registradas</option>
            ) : (
              (especialidades || []).map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))
            )}
            <option value="__NEW__" className="text-sky-600 font-bold">
              + Agregar nueva especialidad...
            </option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Afiliado / Cliente
            </label>
            <button
              type="button"
              onClick={onAbrirNuevoAfiliado}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />Registrar Nuevo
            </button>
          </div>
          <select
            value={nuevaOrden.afiliadoId}
            onChange={(e) => onNuevaOrdenChange({ ...nuevaOrden, afiliadoId: Number(e.target.value) })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
          >
            <option value={0} disabled>Selecciona un afiliado...</option>
            {(afiliados || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombreCompleto || a.nombre} (DNI: {a.dni}) - {a.distrito}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Técnico Asignado
          </label>
          <select
            value={nuevaOrden.tecnicoId}
            onChange={(e) => onNuevaOrdenChange({ ...nuevaOrden, tecnicoId: Number(e.target.value) })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
          >
            <option value={0} disabled>Selecciona un técnico...</option>
            {(tecnicos || [])
              .filter((t) => t && t.activo !== false)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombreCompleto} ({t.especialidad || 'General'}) - {t.disponible ? 'Disponible' : 'En atención'}
                </option>
              ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] active:scale-[0.99] text-white font-bold text-sm rounded-2xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <span>Crear y Asignar Orden</span>
          )}
        </button>
      </form>
        </div>

        {/* Columna Derecha: Accesos Rápidos (Gestión del Servicio) */}
        <div className="mt-5 lg:mt-0 lg:col-span-1">
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-2 px-1">
            Gestión del Servicio
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
            {/* Card 1: Catálogo de Materiales */}
            <div
              onClick={onAbrirMateriales}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md hover:border-sky-200 transition-all cursor-pointer flex flex-col justify-between text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                  Materiales
                </h4>
                <p className="text-xs text-slate-400 leading-snug mt-0.5">
                  Repuestos por especialidad
                </p>
              </div>
            </div>

            {/* Card 2: Especialidades / Rubros */}
            <div
              onClick={onAbrirEspecialidades}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  Especialidades
                </h4>
                <p className="text-xs text-slate-400 leading-snug mt-0.5">
                  Rubros y servicios activos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
