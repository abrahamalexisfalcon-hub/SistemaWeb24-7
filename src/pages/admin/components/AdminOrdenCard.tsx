import React from 'react';
import type { OrdenDetalleAdmin } from '../../../types';
import { MapPin, Clock, Building2 } from 'lucide-react';
import frame26 from '../../../assets/Frame 26.svg';
import { formatearFechaHora, getBadgeConfig } from '../utils';

interface AdminOrdenCardProps {
  orden: OrdenDetalleAdmin;
  onClick: () => void;
  onOpenWaze: (e: React.MouseEvent, orden: OrdenDetalleAdmin) => void;
}

export const AdminOrdenCard: React.FC<AdminOrdenCardProps> = ({
  orden,
  onClick,
  onOpenWaze,
}) => {
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
    orden.fechaPactada || orden.fechaProgramada || orden.fechaAsignacion || orden.fechaCreacion
  );
  const tecnicoNombre =
    orden.tecnico?.nombre ||
    orden.tecnicoNombre ||
    orden.nombreTecnico ||
    orden.tecnico?.nombreCompleto;
  const cuentaNombre = orden.cuentaNombre || orden.cuenta?.nombre;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 active:scale-[0.99] border border-slate-100/60"
    >
      {/* Fila 1: Código correlativo y Badge de estado */}
      <div className="flex items-center justify-between">
        <span className="font-black text-slate-900 text-lg tracking-tight">
          #{orden.codigoOrden}
        </span>
        <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Píldoras de Cuenta, Caso y OT */}
      {(cuentaNombre || orden.numeroCaso || orden.numeroOt) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          {cuentaNombre && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Building2 className="w-3 h-3" />
              <span>{cuentaNombre}</span>
            </span>
          )}
          {orden.numeroCaso && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Caso: {orden.numeroCaso}
            </span>
          )}
          {orden.numeroOt && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
              OT: {orden.numeroOt}
            </span>
          )}
        </div>
      )}

      {/* Fila 2: Nombre del Servicio */}
      <h3 className="font-bold text-slate-900 text-base leading-snug">
        {orden.tipoServicio}
      </h3>

      {/* Fila 3: Ubicación y Botón de Waze */}
      <div className="flex items-center justify-between text-slate-600">
        <div className="flex items-center gap-2 truncate pr-2">
          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-600 truncate">
            {distrito ? `${direccion} - ${distrito}` : direccion}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => onOpenWaze(e, orden)}
          title="Abrir ruta en Waze"
          className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <img src={frame26} alt="Waze" className="w-[26px] h-[26px] object-contain" />
        </button>
      </div>

      {/* Fila 4: Horario Pactado y Técnico */}
      <div className="flex items-center justify-between pt-0.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{fechaTexto}</span>
        </div>
        {tecnicoNombre ? (
          <span className="text-sky-600 font-bold text-xs truncate max-w-[170px]">
            {tecnicoNombre.toLowerCase().startsWith('téc')
              ? tecnicoNombre
              : `Téc. ${tecnicoNombre}`}
          </span>
        ) : (
          <span className="text-slate-400 font-medium text-xs">
            Sin asignar
          </span>
        )}
      </div>
    </div>
  );
};
