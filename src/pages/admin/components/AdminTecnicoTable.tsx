import React, { useState } from 'react';
import type { TecnicoResumen, OrdenDetalleAdmin } from '../../../types';
import { Mail, Phone, Edit2, ChevronLeft, ChevronRight, User, Power, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { obtenerEspecialidadesTecnico } from '../../../utils/tecnicoEspecialidades';
import { useModalBackButton } from '../../../hooks';

export interface AdminTecnicoTableProps {
  tecnicos: TecnicoResumen[];
  ordenes: OrdenDetalleAdmin[];
  onEditar: (tec: TecnicoResumen) => void;
  onToggleEstado?: (tec: TecnicoResumen) => Promise<boolean | void> | void;
  togglingId?: number | null;
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
  onToggleEstado,
  togglingId,
  totalTecnicos,
  paginaActual,
  filasPorPagina,
  onPaginaChange,
  onFilasPorPaginaChange,
}) => {
  const [tecnicoAConfirmar, setTecnicoAConfirmar] = useState<TecnicoResumen | null>(null);

  useModalBackButton(Boolean(tecnicoAConfirmar), () => {
    if (!togglingId) setTecnicoAConfirmar(null);
  });

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
              <th className="py-3 px-4">Especialidades</th>
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
                const listaEspecialidades = obtenerEspecialidadesTecnico(tecnico);

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
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="flex flex-wrap gap-1.5">
                        {listaEspecialidades.map((esp) => (
                          <span
                            key={esp}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100/80 whitespace-nowrap"
                          >
                            {esp}
                          </span>
                        ))}
                      </div>
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
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {onToggleEstado && (
                          <button
                            type="button"
                            onClick={() => setTecnicoAConfirmar(tecnico)}
                            disabled={togglingId === tecnico.id}
                            title={esActivo ? 'Desactivar cuenta del técnico' : 'Activar cuenta del técnico'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors disabled:opacity-50 cursor-pointer ${
                              esActivo
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {togglingId === tecnico.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                            <span>{esActivo ? 'Desactivar' : 'Activar'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditar(tecnico)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Editar</span>
                        </button>
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

      {/* Modal de Confirmación de Seguridad para Desactivar / Activar */}
      {tecnicoAConfirmar && onToggleEstado && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    tecnicoAConfirmar.activo !== false
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="font-black text-base text-slate-900">
                  {tecnicoAConfirmar.activo !== false
                    ? '¿Desactivar cuenta?'
                    : '¿Activar cuenta?'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTecnicoAConfirmar(null)}
                disabled={togglingId === tecnicoAConfirmar.id}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {tecnicoAConfirmar.activo !== false ? (
                <>
                  El técnico <span className="font-bold text-slate-900">{tecnicoAConfirmar.nombreCompleto}</span> perderá el acceso a la app de asistencias y no podrá recibir nuevas órdenes de servicio.
                </>
              ) : (
                <>
                  El técnico <span className="font-bold text-slate-900">{tecnicoAConfirmar.nombreCompleto}</span> volverá a tener acceso a la app y podrá recibir nuevas órdenes de servicio.
                </>
              )}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTecnicoAConfirmar(null)}
                disabled={togglingId === tecnicoAConfirmar.id}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onToggleEstado(tecnicoAConfirmar);
                  setTecnicoAConfirmar(null);
                }}
                disabled={togglingId === tecnicoAConfirmar.id}
                className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  tecnicoAConfirmar.activo !== false
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                {togglingId === tecnicoAConfirmar.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : tecnicoAConfirmar.activo !== false ? (
                  <span>Sí, desactivar</span>
                ) : (
                  <span>Sí, activar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
