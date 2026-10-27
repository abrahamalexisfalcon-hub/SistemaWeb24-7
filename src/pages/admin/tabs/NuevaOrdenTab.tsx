import React, { useState, useEffect, useMemo } from 'react';
import type { CrearOrdenRequest, Afiliado, TecnicoResumen, Cuenta } from '../../../types';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Package,
  Layers,
  Building2,
  Calendar,
  Clock,
  Hash,
  MapPin,
  UserCheck,
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

const HORAS_12 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTOS_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

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

  // Descomponer nuevaOrden.fechaPactada ("YYYY-MM-DDTHH:mm") en Fecha + Hora 12h + Minutos + AM/PM
  const { fechaPart, hora12, minutoPart, periodo } = useMemo(() => {
    const fallback = obtenerFechaHoraActualLocal();
    const raw = nuevaOrden.fechaPactada && nuevaOrden.fechaPactada.includes('T')
      ? nuevaOrden.fechaPactada
      : fallback;

    const [fechaStr, timeStr = '09:00'] = raw.split('T');
    const [hhStr = '09', mmStr = '00'] = timeStr.slice(0, 5).split(':');
    const hh24 = Number.isNaN(parseInt(hhStr, 10)) ? 9 : parseInt(hhStr, 10);
    const mm = MINUTOS_60.includes(mmStr) ? mmStr : '00';

    const per: 'AM' | 'PM' = hh24 >= 12 ? 'PM' : 'AM';
    const h12Num = hh24 % 12 === 0 ? 12 : hh24 % 12;
    const h12 = String(h12Num).padStart(2, '0');

    return {
      fechaPart: fechaStr,
      hora12: h12,
      minutoPart: mm,
      periodo: per,
    };
  }, [nuevaOrden.fechaPactada]);

  const minDateOnly = useMemo(() => minDateTime.split('T')[0], [minDateTime]);

  const actualizarFechaHora12 = (
    nuevaFecha: string,
    nuevaHora12: string,
    nuevoMinuto: string,
    nuevoPeriodo: 'AM' | 'PM'
  ) => {
    const h12 = parseInt(nuevaHora12, 10) || 12;
    let h24 = h12;
    if (nuevoPeriodo === 'AM') {
      h24 = h12 === 12 ? 0 : h12;
    } else {
      h24 = h12 === 12 ? 12 : h12 + 12;
    }
    const hh24Str = String(h24).padStart(2, '0');
    const fechaFinal = nuevaFecha || minDateOnly;
    onNuevaOrdenChange({
      ...nuevaOrden,
      fechaPactada: `${fechaFinal}T${hh24Str}:${nuevoMinuto}`,
    });
  };

  const aplicarAtajoTiempo = (minutosAdicionales: number) => {
    const fecha = new Date();
    fecha.setMinutes(fecha.getMinutes() + minutosAdicionales);
    const pad = (n: number) => String(n).padStart(2, '0');
    const isoLocal = `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
    setMinDateTime(obtenerFechaHoraActualLocal());
    onNuevaOrdenChange({
      ...nuevaOrden,
      fechaPactada: isoLocal,
    });
  };

  const aplicarManana9AM = () => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const isoLocal = `${manana.getFullYear()}-${pad(manana.getMonth() + 1)}-${pad(manana.getDate())}T09:00`;
    onNuevaOrdenChange({
      ...nuevaOrden,
      fechaPactada: isoLocal,
    });
  };

  // Vista previa legible de la fecha y hora pactada con AM / PM
  const resumenFechaPactada = useMemo(() => {
    if (!fechaPart) return '';
    const [anio, mes, dia] = fechaPart.split('-').map(Number);
    if (!anio || !mes || !dia) return `${hora12}:${minutoPart} ${periodo}`;
    const fechaObj = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    const esHoy =
      fechaObj.getFullYear() === hoy.getFullYear() &&
      fechaObj.getMonth() === hoy.getMonth() &&
      fechaObj.getDate() === hoy.getDate();

    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);
    const esManana =
      fechaObj.getFullYear() === manana.getFullYear() &&
      fechaObj.getMonth() === manana.getMonth() &&
      fechaObj.getDate() === manana.getDate();

    const fechaCorta = fechaObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const prefijoDia = esHoy ? 'Hoy, ' : esManana ? 'Mañana, ' : '';
    return `${prefijoDia}${fechaCorta} • ${hora12}:${minutoPart} ${periodo}`;
  }, [fechaPart, hora12, minutoPart, periodo]);

  // Verificar si la fecha/hora seleccionada quedó en el pasado
  const esHorarioPasado = useMemo(() => {
    if (!nuevaOrden.fechaPactada) return false;
    const seleccionada = new Date(nuevaOrden.fechaPactada);
    const ahora = new Date();
    ahora.setSeconds(0, 0);
    return !isNaN(seleccionada.getTime()) && seleccionada < ahora;
  }, [nuevaOrden.fechaPactada, minDateTime]);

  const afiliadoSeleccionado = useMemo(
    () => (afiliados || []).find((a) => a.id === Number(nuevaOrden.afiliadoId)) || null,
    [afiliados, nuevaOrden.afiliadoId]
  );

  const tecnicoSeleccionado = useMemo(
    () => (tecnicos || []).find((t) => t.id === Number(nuevaOrden.tecnicoId)) || null,
    [tecnicos, nuevaOrden.tecnicoId]
  );

  const esConflictoCaso = Boolean(
    formError && formError.toLowerCase().includes('número de caso')
  );
  const esConflictoOt = Boolean(
    formError && formError.toLowerCase().includes('número de ot')
  );

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">
            Registrar Nueva Orden
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Crea y asigna una asistencia técnica vinculada a su cuenta, caso, OT y horario pactado (AM / PM)
          </p>
        </div>
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
            className="bg-white rounded-3xl p-5 shadow-xs space-y-5 border border-slate-100 lg:p-7"
          >
            {/* SECCIÓN 1: DATOS DE CUENTA, SERVICIO Y EXPEDIENTE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Datos de Cuenta y Expediente
                </h2>
              </div>

              {/* Fila 1: Cuenta / Aseguradora y Especialidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Cuenta / Aseguradora <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={onAbrirCuentas}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Gestionar
                    </button>
                  </div>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Especialidad / Servicio <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={onAbrirEspecialidades}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Nueva
                    </button>
                  </div>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
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
                      className={`w-full bg-slate-50 border rounded-2xl py-3 pl-9 pr-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        esConflictoCaso
                          ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 focus:border-sky-500 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
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
                      className={`w-full bg-slate-50 border rounded-2xl py-3 pl-9 pr-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        esConflictoOt
                          ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 focus:border-sky-500 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: PROGRAMACIÓN DE FECHA Y HORA PACTADA (FORMATO 12H AM / PM) */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-black flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Fecha y Hora Pactada del Servicio <span className="text-rose-500">*</span>
                  </h2>
                </div>

                {/* Badge resumen en vivo con AM / PM */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  {resumenFechaPactada}
                </span>
              </div>

              {/* Atajos rápidos de programación */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">
                  Programación rápida:
                </span>
                <button
                  type="button"
                  onClick={() => aplicarAtajoTiempo(5)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Ahora
                </button>
                <button
                  type="button"
                  onClick={() => aplicarAtajoTiempo(30)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  +30 min
                </button>
                <button
                  type="button"
                  onClick={() => aplicarAtajoTiempo(60)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  +1 hora
                </button>
                <button
                  type="button"
                  onClick={() => aplicarAtajoTiempo(120)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  +2 horas
                </button>
                <button
                  type="button"
                  onClick={aplicarManana9AM}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Mañana 09:00 AM
                </button>
              </div>

              {/* Controles de Fecha + Hora (12h) + Selector explícito AM / PM */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                {/* Selector de Fecha */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Fecha del Servicio
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={minDateOnly}
                      value={fechaPart}
                      onFocus={() => setMinDateTime(obtenerFechaHoraActualLocal())}
                      onChange={(e) =>
                        actualizarFechaHora12(e.target.value, hora12, minutoPart, periodo)
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Selector de Hora (01-12) y Minutos (00-59) */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Hora
                  </label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500">
                    <Clock className="w-4 h-4 text-slate-400 mr-1.5 flex-shrink-0" />
                    <select
                      aria-label="Hora"
                      value={hora12}
                      onChange={(e) =>
                        actualizarFechaHora12(fechaPart, e.target.value, minutoPart, periodo)
                      }
                      className="w-full bg-transparent text-center text-sm font-extrabold text-slate-800 focus:outline-none cursor-pointer py-1"
                    >
                      {HORAS_12.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 font-black px-1">:</span>
                    <select
                      aria-label="Minutos"
                      value={minutoPart}
                      onChange={(e) =>
                        actualizarFechaHora12(fechaPart, hora12, e.target.value, periodo)
                      }
                      className="w-full bg-transparent text-center text-sm font-extrabold text-slate-800 focus:outline-none cursor-pointer py-1"
                    >
                      {MINUTOS_60.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botones segmentados AM / PM */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Turno
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-200/80 p-1 rounded-xl h-[42px]">
                    <button
                      type="button"
                      onClick={() => actualizarFechaHora12(fechaPart, hora12, minutoPart, 'AM')}
                      className={`rounded-lg text-xs font-black tracking-wide transition-all cursor-pointer ${
                        periodo === 'AM'
                          ? 'bg-[#0284c7] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => actualizarFechaHora12(fechaPart, hora12, minutoPart, 'PM')}
                      className={`rounded-lg text-xs font-black tracking-wide transition-all cursor-pointer ${
                        periodo === 'PM'
                          ? 'bg-[#0284c7] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {esHorarioPasado && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  <span>
                    La hora seleccionada ({hora12}:{minutoPart} {periodo}) está en el pasado.
                  </span>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoTiempo(5)}
                    className="font-bold underline hover:text-amber-950 flex-shrink-0 cursor-pointer"
                  >
                    Ajustar a hora actual
                  </button>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: ASIGNACIÓN DE AFILIADO Y TÉCNICO */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-black flex items-center justify-center">
                  3
                </span>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Asignación de Afiliado y Técnico
                </h2>
              </div>

              {/* Afiliado / Cliente */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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

                {afiliadoSeleccionado && (
                  <div className="mt-2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      <span>
                        {afiliadoSeleccionado.direccion}
                        {afiliadoSeleccionado.distrito ? `, ${afiliadoSeleccionado.distrito}` : ''}
                      </span>
                    </div>
                    {afiliadoSeleccionado.telefono && (
                      <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        Tel: {afiliadoSeleccionado.telefono}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Técnico Asignado */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Técnico Asignado <span className="text-rose-500">*</span>
                  </label>
                  {tecnicoSeleccionado && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        tecnicoSeleccionado.disponible
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <UserCheck className="w-3 h-3" />
                      {tecnicoSeleccionado.disponible ? 'Disponible ahora' : 'En atención'}
                    </span>
                  )}
                </div>
                <select
                  required
                  value={nuevaOrden.tecnicoId}
                  onChange={(e) =>
                    onNuevaOrdenChange({ ...nuevaOrden, tecnicoId: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] active:scale-[0.99] text-white font-bold text-sm rounded-2xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
