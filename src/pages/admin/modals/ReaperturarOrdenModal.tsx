import React, { useState, useEffect, useMemo } from 'react';
import type { OrdenDetalleAdmin, TecnicoResumen, ReaperturarOrdenRequest } from '../../../types';
import { X, RotateCcw, CalendarClock, UserCheck, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { formatearFechaOrden } from '../../../utils/dateFormatter';

interface ReaperturarOrdenModalProps {
  isOpen: boolean;
  orden: OrdenDetalleAdmin | null;
  tecnicos: TecnicoResumen[];
  onClose: () => void;
  onConfirmar: (ordenId: number, data: ReaperturarOrdenRequest) => Promise<void>;
  reaperturando: boolean;
  error: string | null;
}

const formatearDateTimeLocal = (fecha: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
};

export const ReaperturarOrdenModal: React.FC<ReaperturarOrdenModalProps> = ({
  isOpen,
  orden,
  tecnicos,
  onClose,
  onConfirmar,
  reaperturando,
  error,
}) => {
  const [nuevaFechaPactada, setNuevaFechaPactada] = useState<string>('');
  const [tecnicoId, setTecnicoId] = useState<number>(0);
  const [observacion, setObservacion] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const tecnicosActivos = useMemo(
    () => (tecnicos || []).filter((t) => t.activo !== false),
    [tecnicos]
  );

  const minDateTime = useMemo(() => formatearDateTimeLocal(new Date()), [isOpen]);

  useEffect(() => {
    if (isOpen && orden) {
      // Pre-poblar con +30 minutos desde ahora para facilitar una reprogramación inmediata válida
      const sugerida = new Date(Date.now() + 30 * 60 * 1000);
      setNuevaFechaPactada(formatearDateTimeLocal(sugerida));

      // Preseleccionar al técnico anterior o al primer técnico activo disponible
      const tecnicoPrevioId = orden.tecnicoId || orden.tecnico?.id || 0;
      if (tecnicoPrevioId && tecnicosActivos.some((t) => t.id === tecnicoPrevioId)) {
        setTecnicoId(tecnicoPrevioId);
      } else if (tecnicosActivos.length > 0) {
        setTecnicoId(tecnicosActivos[0].id);
      } else {
        setTecnicoId(0);
      }

      setObservacion(orden.motivoCancelacion || '');
      setLocalError(null);
    }
  }, [isOpen, orden, tecnicosActivos]);

  if (!isOpen || !orden) return null;

  const aplicarAtajo = (minutosAdicionales?: number, mananaNueveAm = false) => {
    const base = new Date();
    if (mananaNueveAm) {
      base.setDate(base.getDate() + 1);
      base.setHours(9, 0, 0, 0);
    } else if (minutosAdicionales !== undefined) {
      base.setMinutes(base.getMinutes() + minutosAdicionales);
    }
    setNuevaFechaPactada(formatearDateTimeLocal(base));
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!nuevaFechaPactada) {
      setLocalError('Debes indicar la nueva fecha y hora pactada.');
      return;
    }

    const fechaSeleccionada = new Date(nuevaFechaPactada);
    const ahoraMinuto = new Date();
    ahoraMinuto.setSeconds(0, 0);

    if (isNaN(fechaSeleccionada.getTime()) || fechaSeleccionada < ahoraMinuto) {
      setLocalError('La nueva fecha y hora pactada no puede estar en el pasado.');
      return;
    }

    if (!tecnicoId) {
      setLocalError('Debes seleccionar un técnico asignado para reaperturar el servicio.');
      return;
    }

    const fechaPayload =
      nuevaFechaPactada.length === 16 ? `${nuevaFechaPactada}:59` : nuevaFechaPactada;

    await onConfirmar(orden.id, {
      nuevaFechaPactada: fechaPayload,
      tecnicoId,
      observacion: observacion.trim() ? observacion.trim() : undefined,
    });
  };

  const afiliadoNombre =
    orden.afiliadoNombre ||
    orden.nombreAfiliado ||
    orden.cliente?.nombre ||
    'Cliente Afiliado';

  const errorEfectivo = localError || error;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 leading-tight">
                Reaperturar Servicio
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                #{orden.codigoOrden} {orden.numeroOt ? `• OT: ${orden.numeroOt}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={reaperturando}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen rápido de la orden */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">{orden.tipoServicio}</span>
            {orden.numeroCaso && (
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-600 text-[11px]">
                Caso: {orden.numeroCaso}
              </span>
            )}
          </div>
          <p className="text-slate-600">
            <span className="font-semibold text-slate-800">Afiliado:</span> {afiliadoNombre}
          </p>
          {orden.motivoCancelacion && (
            <p className="text-amber-800 bg-amber-50/90 border border-amber-200/70 rounded-xl px-2.5 py-1.5 text-[11px]">
              <span className="font-bold">Motivo previo:</span> {orden.motivoCancelacion}
            </p>
          )}
        </div>

        {errorEfectivo && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorEfectivo}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Nueva Fecha y Hora Pactada */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <CalendarClock className="w-3.5 h-3.5 text-sky-600" />
              <span>Nueva Fecha y Hora Pactada *</span>
            </label>
            <input
              type="datetime-local"
              required
              min={minDateTime}
              value={nuevaFechaPactada}
              onChange={(e) => {
                setNuevaFechaPactada(e.target.value);
                setLocalError(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition-all"
            />

            {/* Atajos rápidos y vista previa 12h AM/PM */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => aplicarAtajo(0)}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                >
                  Ahora
                </button>
                <button
                  type="button"
                  onClick={() => aplicarAtajo(30)}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                >
                  +30 min
                </button>
                <button
                  type="button"
                  onClick={() => aplicarAtajo(60)}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                >
                  +1 hora
                </button>
                <button
                  type="button"
                  onClick={() => aplicarAtajo(undefined, true)}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                >
                  Mañana 09:00 AM
                </button>
              </div>
              {nuevaFechaPactada && (
                <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-lg">
                  {formatearFechaOrden(nuevaFechaPactada)}
                </span>
              )}
            </div>
          </div>

          {/* 2. Técnico Asignado */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Técnico Asignado *</span>
            </label>
            <select
              required
              value={tecnicoId}
              onChange={(e) => {
                setTecnicoId(Number(e.target.value));
                setLocalError(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value={0} disabled>
                Selecciona un técnico operativo...
              </option>
              {tecnicosActivos.map((tec) => (
                <option key={tec.id} value={tec.id}>
                  {tec.nombreCompleto}
                  {tec.especialidad ? ` — ${tec.especialidad}` : ''}
                  {tec.disponible === false ? ' (En atención)' : ' (Disponible)'}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Nota u observación de reapertura (Opcional) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Nota u Observación de Reapertura (Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej: Reprogramado a solicitud del afiliado en nuevo horario..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none resize-none transition-all"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={reaperturando}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={reaperturando}
              className="flex-1 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {reaperturando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reaperturando...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Reaperturar Servicio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
