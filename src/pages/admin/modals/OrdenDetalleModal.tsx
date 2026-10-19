import React, { useState, useEffect } from 'react';
import type { OrdenDetalleAdmin } from '../../../types';
import { X, Phone, Clock, AlertCircle, FileText, Pencil, Check, RefreshCw } from 'lucide-react';
import { formatearFechaHora, getBadgeConfig } from '../utils';
import { EvidenciasGaleria } from '../../../components';
import { adminApi } from '../../../api';
import { toast } from 'sonner';

interface OrdenDetalleModalProps {
  orden: OrdenDetalleAdmin | null;
  onClose: () => void;
  onVerHojaServicio: () => void;
  onAnularOrden: () => void;
  onActualizarObservacion?: (ordenId: number, nuevaObservacion: string) => Promise<void>;
}

export const OrdenDetalleModal: React.FC<OrdenDetalleModalProps> = ({
  orden,
  onClose,
  onVerHojaServicio,
  onAnularOrden,
  onActualizarObservacion,
}) => {
  const [editandoObs, setEditandoObs] = useState(false);
  const [observacionTexto, setObservacionTexto] = useState('');
  const [guardandoObs, setGuardandoObs] = useState(false);

  useEffect(() => {
    setEditandoObs(false);
    setObservacionTexto(orden?.motivoCancelacion || '');
  }, [orden?.id, orden?.motivoCancelacion]);

  if (!orden) return null;

  const badge = getBadgeConfig(orden.estado);
  const direccion =
    orden.direccion ||
    orden.afiliadoDireccion ||
    orden.cliente?.direccion ||
    (orden as any).direccionAfiliado ||
    'Av. Central 120';
  const distrito =
    orden.distrito ||
    orden.afiliadoDistrito ||
    orden.cliente?.distrito ||
    (orden as any).distritoAfiliado ||
    '';
  const referencia =
    (orden as any).referencia ||
    orden.cliente?.referencia ||
    (orden as any).referenciaAfiliado ||
    '';
  const fechaTexto = formatearFechaHora(
    orden.fechaProgramada || orden.fechaAsignacion || orden.fechaCreacion
  );
  const tecnicoNombre =
    orden.tecnico?.nombre ||
    orden.tecnicoNombre ||
    orden.nombreTecnico ||
    orden.tecnico?.nombreCompleto;

  const isMockUrl = (url?: string | null) =>
    !url ||
    url.includes('images.unsplash.com') ||
    url.includes('placeholder');

  const fotosEvidencia: string[] = [
    ...(orden.fotosEvidencia || []),
    ...(orden.hojaServicio?.fotosEvidencia || []),
    orden.fotoInicialUrl,
    orden.fotoFinalUrl,
    orden.hojaServicio?.fotoInicialUrl,
    orden.hojaServicio?.fotoFinalUrl,
    orden.hojaServicio?.fotoAntesUrl,
    orden.hojaServicio?.fotoDespuesUrl,
  ].filter((url, index, arr): url is string => Boolean(url && url.trim() && !isMockUrl(url) && arr.indexOf(url) === index));

  const handleGuardarObservacion = async () => {
    const limpio = observacionTexto.trim();
    if (!limpio) {
      toast.error('La observación no puede estar vacía.');
      return;
    }

    setGuardandoObs(true);
    try {
      if (onActualizarObservacion) {
        await onActualizarObservacion(orden.id, limpio);
      } else {
        await adminApi.actualizarObservacionCancelacion(orden.id, limpio);
      }
      setEditandoObs(false);
      toast.success('Observación de cancelación actualizada correctamente.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar la observación.');
    } finally {
      setGuardandoObs(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-black text-lg text-slate-900">
            #{orden.codigoOrden}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Estado</span>
            <div className="mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                {orden.estado === 'CANCELADA' ? 'Cancelada (Asistido No Realizado)' : badge.label}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Servicio</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{orden.tipoServicio}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente Afiliado</span>
            <p className="font-bold text-slate-900 mt-0.5">
              {orden.afiliadoNombre || (orden as any).nombreAfiliado || 'Carlos Mendoza'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {orden.afiliadoTelefono || '987 654 321'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Dirección de Atención</span>
            <p className="font-medium text-slate-700 text-xs mt-0.5">
              {direccion}
              {distrito ? ` - ${distrito}` : ''}
            </p>
            {referencia && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ref: {referencia}
              </p>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha y Hora</span>
            <p className="font-medium text-slate-700 text-xs mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{fechaTexto}</span>
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Técnico Asignado</span>
            <p className="text-xs mt-0.5">
              {!tecnicoNombre ? (
                <span className="text-slate-400 font-medium">Sin asignar</span>
              ) : (
                <span className="font-bold text-sky-600">
                  {tecnicoNombre.toLowerCase().startsWith('téc') ? tecnicoNombre : `Téc. ${tecnicoNombre}`}
                </span>
              )}
            </p>
          </div>

          {/* Bloque: EVIDENCIAS DEL SERVICIO (FOTOS) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              EVIDENCIAS DEL SERVICIO (FOTOS)
            </span>
            <EvidenciasGaleria fotos={fotosEvidencia} />
          </div>
        </div>

        {/* Bloque destacado si la orden está Cancelada (Asistido No Realizado) */}
        {orden.estado === 'CANCELADA' && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Estado: Cancelada (Asistido No Realizado)</span>
              </div>
              {!editandoObs && (
                <button
                  type="button"
                  onClick={() => {
                    setObservacionTexto(orden.motivoCancelacion || '');
                    setEditandoObs(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-white border border-slate-200 hover:border-sky-300 px-2.5 py-1 rounded-lg shadow-2xs transition-all cursor-pointer"
                  title="Editar observación"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Editar observación</span>
                </button>
              )}
            </div>

            {editandoObs ? (
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-amber-900">
                  Motivo / Observación:
                </label>
                <textarea
                  rows={3}
                  value={observacionTexto}
                  onChange={(e) => setObservacionTexto(e.target.value)}
                  placeholder="Ingresa o corrige la observación de cancelación..."
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={guardandoObs}
                    onClick={() => {
                      setEditandoObs(false);
                      setObservacionTexto(orden.motivoCancelacion || '');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-[11px] rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={guardandoObs || !observacionTexto.trim()}
                    onClick={handleGuardarObservacion}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-[11px] rounded-lg shadow-xs transition-all disabled:opacity-50"
                  >
                    {guardandoObs ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Guardar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Motivo / Observación:</span>{' '}
                {orden.motivoCancelacion || 'Sin observación registrada'}
              </p>
            )}

            {orden.fechaCancelacion && (
              <p className="text-[10px] text-slate-500">
                Fecha de registro: {new Date(orden.fechaCancelacion).toLocaleString('es-PE')}
              </p>
            )}
          </div>
        )}

        {/* Botón Ver Hoja de Servicio Oficial si la orden está finalizada */}
        {orden.estado === 'FINALIZADA' && (
          <button
            type="button"
            onClick={onVerHojaServicio}
            className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Ver Hoja de Servicio</span>
          </button>
        )}

        {/* Botón Anular Orden: disponible si la orden NO está finalizada ni cancelada */}
        {orden.estado !== 'FINALIZADA' && orden.estado !== 'CANCELADA' && (
          <button
            type="button"
            onClick={onAnularOrden}
            className="w-full text-red-600 hover:bg-red-50 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Anular Orden
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

