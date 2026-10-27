import React, { useState, useEffect } from 'react';
import type { CrearOrdenRequest, Afiliado, TecnicoResumen, Cuenta } from '../../../types';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Package,
  Layers,
  Building2,
  CalendarClock,
  Hash,
} from 'lucide-react';
import { obtenerFechaHoraActualLocal } from '../useAdminDashboard';

interface NuevaOrdenTabProps {
  nuevaOrden: CrearOrdenRequest;
  onNuevaOrdenChange: (val: CrearOrdenRequest) => void;
  especialidades: string[];
  cargandoEspecialidades: boolean;
  cuentas: Cuenta[];
  cargandoCuentas: boolean;
  afiliados: Afiliado[];
  tecnicos: TecnicoResumen[];
  submitting: boolean;
  formError: string | null;
  formExito: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onAbrirNuevoAfiliado: () => void;
  onAbrirMateriales: () => void;
  onAbrirEspecialidades: () => void;
  onAbrirCuentas: () => void;
}

export const NuevaOrdenTab: React.FC<NuevaOrdenTabProps> = ({
  nuevaOrden,
  onNuevaOrdenChange,
  especialidades,
  cargandoEspecialidades,
  cuentas,
  cargandoCuentas,
  afiliados,
  tecnicos,
  submitting,
  formError,
  formExito,
  onSubmit,
  onAbrirNuevoAfiliado,
  onAbrirMateriales,
  onAbrirEspecialidades,
  onAbrirCuentas,
}) => {
  const [minDateTime, setMinDateTime] = useState<string>(() => obtenerFechaHoraActualLocal());

  useEffect(() => {
    const interval = setInterval(() => {
      setMinDateTime(obtenerFechaHoraActualLocal());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const esConflictoCaso = Boolean(
    formError && formError.toLowerCase().includes('número de caso')
  );
  const esConflictoOt = Boolean(
    formError && formError.toLowerCase().includes('número de ot')
  );

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      <div className="pb-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">
          Registrar Nueva Orden
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Crea y asigna una asistencia técnica vinculada a su cuenta, caso, OT y horario pactado
        </p>
      </div>

      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-2xl flex items-center gap-2.5 shadow-2xs animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {formExito && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-2xl flex items-center gap-2.5 shadow-2xs animate-in fade-in duration-150">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{formExito}</span>
        </div>
      )}

      {/* Grid de 2 columnas en Desktop (Formulario a la izquierda, Accesos Rápidos a la derecha) */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
        <div className="lg:col-span-2">
          <form
            onSubmit={onSubmit}
            className="bg-white rounded-3xl p-5 shadow-xs space-y-4 border border-slate-100 lg:p-7"
          >
            {/* Fila 1: Cuenta / Aseguradora y Especialidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cuenta / Aseguradora <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={nuevaOrden.cuentaId || 0}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_CUENTA__') {
                      onAbrirCuentas();
                    } else {
                      onNuevaOrdenChange({ ...nuevaOrden, cuentaId: Number(e.target.value) });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value={0} disabled>
                    {cargandoCuentas ? 'Cargando cuentas...' : 'Selecciona una cuenta...'}
                  </option>
                  {(cuentas || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                  <option value="__NEW_CUENTA__" className="text-emerald-600 font-bold">
                    + Gestionar / Agregar cuenta...
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Especialidad / Servicio <span className="text-rose-500">*</span>
                </label>
                <select
                  required
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
                    <option value="" disabled>
                      Cargando especialidades...
                    </option>
                  ) : (especialidades || []).length === 0 ? (
                    <option value="" disabled>
                      No hay especialidades registradas
                    </option>
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
            </div>

            {/* Fila 2: Número de Caso y Número de OT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Número de Caso <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="Ej: CASO-8942"
                    value={nuevaOrden.numeroCaso || ''}
                    onChange={(e) =>
                      onNuevaOrdenChange({ ...nuevaOrden, numeroCaso: e.target.value })
                    }
                    className={`w-full bg-slate-50 border rounded-2xl py-3 pl-9 pr-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                      esConflictoCaso
                        ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                        : 'border-slate-200 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Número de OT <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="Ej: OT-1045"
                    value={nuevaOrden.numeroOt || ''}
                    onChange={(e) =>
                      onNuevaOrdenChange({ ...nuevaOrden, numeroOt: e.target.value })
                    }
                    className={`w-full bg-slate-50 border rounded-2xl py-3 pl-9 pr-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                      esConflictoOt
                        ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500'
                        : 'border-slate-200 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Fila 3: Fecha y Hora Pactada del Servicio */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Fecha y Hora Pactada del Servicio <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CalendarClock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="datetime-local"
                  required
                  min={minDateTime}
                  value={nuevaOrden.fechaPactada || ''}
                  onFocus={() => setMinDateTime(obtenerFechaHoraActualLocal())}
                  onChange={(e) =>
                    onNuevaOrdenChange({ ...nuevaOrden, fechaPactada: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Horario acordado con la aseguradora/afiliado (no se permiten fechas ni horas pasadas).
              </p>
            </div>

            {/* Fila 4: Afiliado / Cliente */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Afiliado / Cliente <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onAbrirNuevoAfiliado}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Nuevo
                </button>
              </div>
              <select
                required
                value={nuevaOrden.afiliadoId}
                onChange={(e) =>
                  onNuevaOrdenChange({ ...nuevaOrden, afiliadoId: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              >
                <option value={0} disabled>
                  Selecciona un afiliado...
                </option>
                {(afiliados || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombreCompleto || a.nombre} (DNI: {a.dni}) - {a.distrito}
                  </option>
                ))}
              </select>
            </div>

            {/* Fila 5: Técnico Asignado */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Técnico Asignado <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={nuevaOrden.tecnicoId}
                onChange={(e) =>
                  onNuevaOrdenChange({ ...nuevaOrden, tecnicoId: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              >
                <option value={0} disabled>
                  Selecciona un técnico...
                </option>
                {(tecnicos || [])
                  .filter((t) => t && t.activo !== false)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombreCompleto} ({t.especialidad || 'General'}) -{' '}
                      {t.disponible ? 'Disponible' : 'En atención'}
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] active:scale-[0.99] text-white font-bold text-sm rounded-2xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-4">
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

            {/* Card 3: Cuentas / Aseguradoras */}
            <div
              onClick={onAbrirCuentas}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer flex flex-col justify-between text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Cuentas
                </h4>
                <p className="text-xs text-slate-400 leading-snug mt-0.5">
                  Aseguradoras y convenios
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
