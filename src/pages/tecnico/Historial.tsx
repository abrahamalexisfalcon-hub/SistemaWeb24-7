import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrdenes } from '../../context/OrdenesContext';
import { TecnicoLayout } from '../../components/tecnico';
import {
  Clock,
  MapPin,
  CheckCircle,
  RefreshCw,
  CheckCircle2,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatearFechaOrden } from '../../utils/dateFormatter';

const ITEMS_POR_PAGINA = 5;

export const Historial: React.FC = () => {
  const navigate = useNavigate();
  const { ordenes, perfil, loading, isFetching, refrescar, cargarOrdenes } = useOrdenes();
  const [paginaActual, setPaginaActual] = useState(1);

  // Revalida de forma silenciosa en segundo plano solo si los datos están obsoletos
  useEffect(() => {
    cargarOrdenes(false);
  }, [cargarOrdenes]);

  const ordenesFinalizadas = (ordenes || []).filter((o) => o && o.estado === 'FINALIZADA');

  const totalPaginas = Math.ceil(ordenesFinalizadas.length / ITEMS_POR_PAGINA) || 1;
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const indiceInicio = (paginaSegura - 1) * ITEMS_POR_PAGINA;
  const ordenesVisibles = ordenesFinalizadas.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  const irAPagina = (nuevaPagina: number) => {
    const destino = Math.max(1, Math.min(nuevaPagina, totalPaginas));
    setPaginaActual(destino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <TecnicoLayout activeTab="historial">
      <div className="px-5 pt-5 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Historial de Servicios
              </h1>
              {isFetching && (
                <span title="Sincronizando en segundo plano...">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0ea5e9]" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro de atenciones técnicas completadas
            </p>
          </div>
          <button
            onClick={() => refrescar()}
            disabled={isFetching}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-600 transition-all focus:outline-none"
            title="Recargar historial"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#0ea5e9]' : ''}`} />
          </button>
        </div>

        {/* Resumen Operativo (KPIs visuales en grid) */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Resumen Operativo
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* KPI 1: Órdenes Completadas */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0ea5e9] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900 leading-none">
                  {perfil?.ordenesCompletadasHoy ?? ordenesFinalizadas.length}
                </span>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Completadas
                </p>
              </div>
            </div>

            {/* KPI 2: Calificación Promedio */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 fill-amber-400 stroke-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-lg font-black text-slate-900">
                    {perfil?.calificacionPromedio
                      ? perfil.calificacionPromedio.toFixed(1)
                      : '5.0'}
                  </span>
                  <span className="text-amber-400 text-xs">★</span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Calificación
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Listado de Servicios Finalizados */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Servicios Finalizados
          </h3>
          <div className="space-y-3 pb-6">
            {loading && ordenesFinalizadas.length === 0 && (!ordenes || ordenes.length === 0) ? (
              /* Skeletons pulsantes en primera carga */
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-slate-200 rounded-md" />
                      <div className="h-5 w-20 bg-slate-200 rounded-full" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded-md pt-1" />
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
                      <div className="h-3.5 w-28 bg-slate-200 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : ordenesFinalizadas.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No hay servicios finalizados</p>
                <p className="text-xs text-slate-400 mt-1">Los servicios completados se mostrarán aquí.</p>
              </div>
            ) : (
              <>
                {ordenesVisibles.map((orden) => (
                  <div
                    key={orden.id}
                    onClick={() =>
                      navigate(`/tecnico/ordenes/${orden.id}/exito`, {
                        state: {
                          orden,
                          hojaServicio: {
                            evaluacionAveria: orden.evaluacionAveria || '',
                            detalleSolucion: orden.detalleSolucion || '',
                            sugerencias: orden.sugerencias || '',
                            materiales: orden.materiales || [],
                            firmaDigitalUrl:
                              orden.firmaDigitalUrl ||
                              orden.firmaAfiliadoUrl ||
                              localStorage.getItem(`orden_${orden.id}_firma_cliente`) ||
                              '',
                            firmaAfiliadoUrl:
                              orden.firmaDigitalUrl ||
                              orden.firmaAfiliadoUrl ||
                              localStorage.getItem(`orden_${orden.id}_firma_cliente`) ||
                              '',
                          },
                        },
                      })
                    }
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2.5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-base">
                        #{orden.codigoOrden}
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                        Finalizada
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{orden.tipoServicio}</h3>
                    <div className="flex items-start gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-700">
                          {orden.direccion} - {orden.distrito}
                        </p>
                        {orden.referencia && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5" title={orden.referencia}>
                            Ref: {orden.referencia}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatearFechaOrden(orden.fechaProgramada || orden.fechaCreacion || orden.fechaAsignacion)}</span>
                      </div>
                      <span className="font-semibold text-emerald-600">Completada (100%)</span>
                    </div>
                  </div>
                ))}

                {/* Control de Paginación Inferior */}
                {ordenesFinalizadas.length > ITEMS_POR_PAGINA && (
                  <div className="pt-2">
                    <div className="bg-white rounded-2xl border border-slate-200/80 px-3.5 py-3 shadow-sm flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => irAPagina(paginaSegura - 1)}
                        disabled={paginaSegura <= 1}
                        className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-700 flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </button>

                      <div className="text-center">
                        <p className="text-xs font-extrabold text-slate-800">
                          Página {paginaSegura} de {totalPaginas}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400">
                          Mostrando {indiceInicio + 1}–{Math.min(indiceInicio + ITEMS_POR_PAGINA, ordenesFinalizadas.length)} de {ordenesFinalizadas.length}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => irAPagina(paginaSegura + 1)}
                        disabled={paginaSegura >= totalPaginas}
                        className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 text-xs font-bold text-slate-700 flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </TecnicoLayout>
  );
};
