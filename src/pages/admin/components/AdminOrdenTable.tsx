import React from 'react';
import type { OrdenDetalleAdmin } from '../../../types';
import { MapPin, Eye, ChevronLeft, ChevronRight, User, Building2, CalendarClock } from 'lucide-react';
import frame26 from '../../../assets/Frame 26.svg';
import { formatearFechaHora, getBadgeConfig } from '../utils';

export interface AdminOrdenTableProps {
  ordenes: OrdenDetalleAdmin[];
  onSelectOrden: (orden: OrdenDetalleAdmin) => void;
  onOpenWaze: (e: React.MouseEvent, orden: OrdenDetalleAdmin) => void;
  totalOrdenes: number;
  paginaActual: number;
  filasPorPagina: number;
  onPaginaChange: (pagina: number) => void;
  onFilasPorPaginaChange: (filas: number) => void;
}

export const AdminOrdenTable: React.FC<AdminOrdenTableProps> = ({
  ordenes,
  onSelectOrden,
  onOpenWaze,
  totalOrdenes,
  paginaActual,
  filasPorPagina,
  onPaginaChange,
  onFilasPorPaginaChange,
}) => {
  const totalPaginas = Math.ceil(totalOrdenes / filasPorPagina) || 1;
  const inicio = Math.min((paginaActual - 1) * filasPorPagina + 1, totalOrdenes);
  const fin = Math.min(paginaActual * filasPorPagina, totalOrdenes);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[920px] xl:min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Código / Caso / OT</th>
              <th className="py-3 px-4">Cuenta</th>
              <th className="py-3 px-4">Afiliado</th>
              <th className="py-3 px-4">Especialidad</th>
              <th className="py-3 px-4">Fecha Pactada</th>
              <th className="py-3 px-4">Técnico Asignado</th>
              <th className="py-3 px-4">Ubicación</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right pr-6">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {(ordenes || []).length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                  No hay órdenes disponibles para mostrar en este criterio.
                </td>
              </tr>
            ) : (
              (ordenes || []).map((orden) => {
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
                const fechaPactadaTexto = formatearFechaHora(
                  orden.fechaPactada || orden.fechaProgramada || orden.fechaAsignacion || orden.fechaCreacion
                );
                const tecnicoNombre =
                  orden.tecnico?.nombre ||
                  orden.tecnicoNombre ||
                  orden.nombreTecnico ||
                  orden.tecnico?.nombreCompleto;
                const afiliadoNombre =
                  orden.afiliadoNombre ||
                  orden.nombreAfiliado ||
                  (orden.cliente as any)?.nombreCompleto ||
                  orden.cliente?.nombre ||
                  'Afiliado';
                const cuentaNombre =
                  orden.cuentaNombre || orden.cuenta?.nombre || null;

                return (
                  <tr
                    key={orden.id}
                    onClick={() => onSelectOrden(orden)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-bold text-slate-900">
                          #{orden.codigoOrden}
                        </span>
                        {(orden.numeroCaso || orden.numeroOt) && (
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                            {orden.numeroCaso && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                                Caso: {orden.numeroCaso}
                              </span>
                            )}
                            {orden.numeroOt && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                                OT: {orden.numeroOt}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {cuentaNombre ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span>{cuentaNombre}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">General</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div className="flex flex-col max-w-[160px] xl:max-w-[200px]">
                        <span className="truncate" title={afiliadoNombre}>
                          {afiliadoNombre}
                        </span>
                        {orden.dniAfiliado && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            DNI: {orden.dniAfiliado}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100/80 whitespace-nowrap">
                        {orden.tipoServicio}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{fechaPactadaTexto}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {tecnicoNombre ? (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="w-3 h-3" />
                          </div>
                          <span className="truncate max-w-[140px]" title={tecnicoNombre}>
                            {tecnicoNombre.toLowerCase().startsWith('téc')
                              ? tecnicoNombre
                              : `Téc. ${tecnicoNombre}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sin asignar</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 max-w-[180px] xl:max-w-[220px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span
                          className="truncate text-slate-600 font-medium"
                          title={`${direccion} - ${distrito}`}
                        >
                          {distrito ? `${direccion} - ${distrito}` : direccion}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => onOpenWaze(e, orden)}
                          title="Abrir en Waze"
                          className="shrink-0 p-1 hover:bg-sky-50 rounded-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <img src={frame26} alt="Waze" className="w-4 h-4 object-contain" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap pr-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrden(orden);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-sky-600 hover:bg-sky-50 border border-sky-200/80 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver detalle</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <span>
            Mostrando <span className="font-bold text-slate-800">{totalOrdenes === 0 ? 0 : inicio}</span> -{' '}
            <span className="font-bold text-slate-800">{fin}</span> de{' '}
            <span className="font-bold text-slate-800">{totalOrdenes}</span> órdenes
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Filas:</span>
            <select
              value={filasPorPagina}
              onChange={(e) => onFilasPorPaginaChange(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPaginaChange(Math.max(1, paginaActual - 1))}
            disabled={paginaActual <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white active:scale-95 transition-all cursor-pointer"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-semibold text-slate-700">
            {paginaActual} / {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => onPaginaChange(Math.min(totalPaginas, paginaActual + 1))}
            disabled={paginaActual >= totalPaginas}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white active:scale-95 transition-all cursor-pointer"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
