import React from 'react';
import type { TecnicoResumen, OrdenDetalleAdmin } from '../../../types';
import { Mail, Phone, Edit2, ChevronLeft, ChevronRight, User } from 'lucide-react';

export interface AdminTecnicoTableProps {
  tecnicos: TecnicoResumen[];
  ordenes: OrdenDetalleAdmin[];
  onEditar: (tec: TecnicoResumen) => void;
  totalTecnicos: number;
  paginaActual: number;
  filasPorPagina: number;
  onPaginaChange: (pagina: number) => void;
  onFilasPorPaginaChange: (filas: number) => void;
}

export const AdminTecnicoTable: React.FC<AdminTecnicoTableProps> = ({
  tecnicos,
  ordenes,
  onEditar,
  totalTecnicos,
  paginaActual,
  filasPorPagina,
  onPaginaChange,
  onFilasPorPaginaChange,
}) => {
  const totalPaginas = Math.ceil(totalTecnicos / filasPorPagina) || 1;
  const inicio = Math.min((paginaActual - 1) * filasPorPagina + 1, totalTecnicos);
  const fin = Math.min(paginaActual * filasPorPagina, totalTecnicos);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[700px] xl:min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Técnico</th>
              <th className="py-3 px-4">Especialidad</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Disponibilidad</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Órdenes Activas</th>
              <th className="py-3 px-4 text-right pr-6">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {(tecnicos || []).length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  No se encontraron técnicos para los criterios seleccionados.
                </td>
              </tr>
            ) : (
              (tecnicos || []).map((tecnico) => {
                const esActivo = tecnico.activo !== false;
                const switchDisponible = tecnico.disponible !== false;
                const ordenesTecnico = (ordenes || []).filter(
                  (o) => o.tecnicoId === tecnico.id && (o.estado === 'EN_DOMICILIO' || o.estado === 'PENDIENTE')
                );
                const tieneOrdenEnCurso = ordenesTecnico.length > 0;

                return (
                  <tr
                    key={tecnico.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 border border-slate-200">
                          {tecnico.nombreCompleto ? tecnico.nombreCompleto.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{tecnico.nombreCompleto}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: #{tecnico.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100/80">
                        {tecnico.especialidad || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={tecnico.correo}>
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{tecnico.correo}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{tecnico.telefono || 'Sin teléfono'}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tieneOrdenEnCurso && esActivo ? (
                        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>En atención</span>
                        </div>
                      ) : switchDisponible && esActivo ? (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Disponible</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          <span>No disponible</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {esActivo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {ordenesTecnico.length}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap pr-6">
                      <button
                        type="button"
                        onClick={() => onEditar(tecnico)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <span>
            Mostrando <span className="font-bold text-slate-800">{totalTecnicos === 0 ? 0 : inicio}</span> - <span className="font-bold text-slate-800">{fin}</span> de <span className="font-bold text-slate-800">{totalTecnicos}</span> técnicos
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
