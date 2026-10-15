import React from 'react';
import type { Afiliado } from '../../../types';
import { MapPin, Phone, Edit2, Trash2, ChevronLeft, ChevronRight, User } from 'lucide-react';

export interface AdminClienteTableProps {
  afiliados: Afiliado[];
  onEditar?: (afiliado: Afiliado) => void;
  onEliminar?: (afiliado: Afiliado) => void;
  totalAfiliados: number;
  paginaActual: number;
  filasPorPagina: number;
  onPaginaChange: (pagina: number) => void;
  onFilasPorPaginaChange: (filas: number) => void;
}

export const AdminClienteTable: React.FC<AdminClienteTableProps> = ({
  afiliados,
  onEditar,
  onEliminar,
  totalAfiliados,
  paginaActual,
  filasPorPagina,
  onPaginaChange,
  onFilasPorPaginaChange,
}) => {
  const totalPaginas = Math.ceil(totalAfiliados / filasPorPagina) || 1;
  const inicio = Math.min((paginaActual - 1) * filasPorPagina + 1, totalAfiliados);
  const fin = Math.min(paginaActual * filasPorPagina, totalAfiliados);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[700px] xl:min-w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Afiliado / Cliente</th>
              <th className="py-3 px-4">DNI / Documento</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Dirección y Distrito</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right pr-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {(afiliados || []).length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  No se encontraron afiliados para los criterios seleccionados.
                </td>
              </tr>
            ) : (
              (afiliados || []).map((afiliado) => {
                const nombre = afiliado.nombreCompleto || afiliado.nombre || 'Afiliado Sin Nombre';
                const esActivo = afiliado.activo !== false;

                return (
                  <tr
                    key={afiliado.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0 border border-sky-200">
                          {nombre ? nombre.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                        <div className="max-w-[160px] xl:max-w-[200px]">
                          <div className="font-bold text-slate-900 text-xs truncate" title={nombre}>{nombre}</div>
                          {afiliado.numeroCuenta && (
                            <div className="text-[10px] text-slate-400 font-mono truncate">Cta: {afiliado.numeroCuenta}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {afiliado.dni || 'Sin DNI'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{afiliado.telefono || 'Sin teléfono'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-start gap-1.5 max-w-[220px] xl:max-w-[280px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-800 truncate" title={afiliado.direccion}>
                            {afiliado.direccion || 'Sin dirección'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {afiliado.distrito || 'Lima'}
                          </span>
                          {afiliado.referencia && (
                            <span className="text-xs text-slate-400 block truncate" title={afiliado.referencia}>
                              Ref: {afiliado.referencia}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {esActivo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap pr-6">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {onEditar && (
                          <button
                            type="button"
                            onClick={() => onEditar(afiliado)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                            title="Editar afiliado"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onEliminar && (
                          <button
                            type="button"
                            onClick={() => onEliminar(afiliado)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                            title="Dar de baja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
            Mostrando <span className="font-bold text-slate-800">{totalAfiliados === 0 ? 0 : inicio}</span> - <span className="font-bold text-slate-800">{fin}</span> de <span className="font-bold text-slate-800">{totalAfiliados}</span> afiliados
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
