import React from 'react';
import type { OrdenDetalleAdmin } from '../../../types';
import { X, Phone, Clock, AlertCircle, FileText } from 'lucide-react';
import { formatearFechaHora, getBadgeConfig } from '../utils';

interface OrdenDetalleModalProps {
  orden: OrdenDetalleAdmin | null;
  onClose: () => void;
  onVerHojaServicio: () => void;
  onAnularOrden: () => void;
}

export const OrdenDetalleModal: React.FC<OrdenDetalleModalProps> = ({
  orden,
  onClose,
  onVerHojaServicio,
  onAnularOrden,
}) => {
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
  const fechaTexto = formatearFechaHora(
    orden.fechaProgramada || orden.fechaAsignacion || orden.fechaCreacion
  );
  const tecnicoNombre =
    orden.tecnico?.nombre ||
    orden.tecnicoNombre ||
    orden.nombreTecnico ||
    orden.tecnico?.nombreCompleto;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-100">
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
                {badge.label}
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
        </div>

        {/* Información si la orden está Cancelada */}
        {orden.estado === 'CANCELADA' && (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <span>Orden Anulada</span>
            </div>
            <p className="text-[11px] text-slate-600">
              <span className="font-semibold">Motivo:</span> {orden.motivoCancelacion || 'Anulada por administración'}
            </p>
            {orden.fechaCancelacion && (
              <p className="text-[10px] text-slate-400">
                Fecha: {new Date(orden.fechaCancelacion).toLocaleString('es-PE')}
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
