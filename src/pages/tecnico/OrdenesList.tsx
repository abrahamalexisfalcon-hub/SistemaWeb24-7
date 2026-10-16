import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useOrdenes } from '../../context/OrdenesContext';
import { TecnicoLayout } from '../../components/tecnico';
import frame26 from '../../assets/Frame 26.svg';
import type { OrdenResumenTecnico, EstadoOrden } from '../../types';
import { Search, MapPin, Clock, User, RefreshCw, WifiOff } from 'lucide-react';
import { formatearFechaOrden } from '../../utils/dateFormatter';

export type TabTecnico = 'todas' | 'asignadas' | 'en_proceso';

interface TabItem {
  id: TabTecnico;
  label: string;
  count: number;
}

export const OrdenesList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    ordenes,
    loading,
    isFetching,
    hasError,
    errorMessage,
    cargarOrdenes,
    refrescar,
    actualizarOrdenLocal,
  } = useOrdenes();

  const [busqueda, setBusqueda] = useState('');

  // Sincronización instantánea de pestaña vía URL SearchParams (permite compartir y recordar estado)
  const rawTab = (searchParams.get('tab') || 'todas').toLowerCase();
  const tabActiva: TabTecnico = useMemo(() => {
    if (rawTab === 'en_proceso' || rawTab === 'en-proceso' || rawTab === 'proceso') return 'en_proceso';
    if (rawTab === 'asignadas' || rawTab === 'pendientes') return 'asignadas';
    return 'todas';
  }, [rawTab]);

  const cambiarTab = (nuevaTab: TabTecnico) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nuevaTab === 'todas') {
          next.delete('tab');
        } else {
          next.set('tab', nuevaTab);
        }
        return next;
      },
      { replace: true }
    );
  };

  // Cargar órdenes respetando el staleTime en memoria (0 ms si ya está en caché)
  useEffect(() => {
    cargarOrdenes(false);
  }, [cargarOrdenes]);

  // Si se recibe ordenActualizada en location.state, actualizar en memoria inmediatamente
  useEffect(() => {
    const ordenActualizada = (location.state as { ordenActualizada?: OrdenResumenTecnico })?.ordenActualizada;
    if (ordenActualizada) {
      actualizarOrdenLocal({ ...ordenActualizada, estado: 'FINALIZADA' });
    }
  }, [location.state, actualizarOrdenLocal]);

  // Contadores reactivos en memoria para cada pestaña
  const counts = useMemo(() => {
    const list = ordenes || [];
    return {
      todas: list.length,
      asignadas: list.filter((o) => o?.estado === 'PENDIENTE').length,
      en_proceso: list.filter((o) => o?.estado === 'EN_DOMICILIO').length,
    };
  }, [ordenes]);

  const tabs: TabItem[] = useMemo(
    () => [
      { id: 'todas', label: 'Todas', count: counts.todas },
      { id: 'asignadas', label: 'Asignadas', count: counts.asignadas },
      { id: 'en_proceso', label: 'En Proceso', count: counts.en_proceso },
    ],
    [counts]
  );

  // Filtrado reactivo en memoria (0 ms, sin peticiones de red ni desmontado de layout)
  const ordenesFiltradas = useMemo(() => {
    return (ordenes || []).filter((orden) => {
      if (!orden) return false;

      // Filtro por texto
      const termino = busqueda.toLowerCase().trim();
      if (termino) {
        const coincideTexto =
          (orden.codigoOrden || '').toLowerCase().includes(termino) ||
          (orden.nombreAfiliado || '').toLowerCase().includes(termino) ||
          (orden.tipoServicio || '').toLowerCase().includes(termino) ||
          (orden.distrito || '').toLowerCase().includes(termino) ||
          (orden.referencia || '').toLowerCase().includes(termino) ||
          (orden.direccion || '').toLowerCase().includes(termino);

        if (!coincideTexto) return false;
      }

      // Filtro por pestaña activa
      if (tabActiva === 'asignadas') return orden.estado === 'PENDIENTE';
      if (tabActiva === 'en_proceso') return orden.estado === 'EN_DOMICILIO';
      return true;
    });
  }, [ordenes, busqueda, tabActiva]);

  const getBadgeConfig = (estado: EstadoOrden) => {
    switch (estado) {
      case 'EN_DOMICILIO':
        return {
          label: 'En proceso',
          className: 'bg-amber-100/90 text-amber-800 border border-amber-200/60',
        };
      case 'PENDIENTE':
        return {
          label: 'Pendientes',
          className: 'bg-sky-100/90 text-sky-800 border border-sky-200/60',
        };
      case 'FINALIZADA':
        return {
          label: 'Finalizadas',
          className: 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60',
        };
      default:
        return {
          label: estado,
          className: 'bg-slate-100 text-slate-700',
        };
    }
  };

  const handleOpenWaze = (e: React.MouseEvent, orden: OrdenResumenTecnico) => {
    e.stopPropagation();
    const direccionCompleta = [orden.direccion, orden.distrito, 'Lima']
      .filter(Boolean)
      .join(', ');
    const destino = encodeURIComponent(direccionCompleta);
    window.open(`https://www.waze.com/ul?q=${destino}&navigate=yes`, '_blank');
  };

  return (
    <TecnicoLayout activeTab="ordenes">
      <div className="px-5 pt-5 space-y-4">
        {/* Cabecera: Título, Indicador de sincronización en segundo plano y Avatar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Órdenes de trabajo
            </h1>
            {isFetching && (
              <span title="Sincronizando en segundo plano...">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0ea5e9]" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refrescar()}
              disabled={isFetching}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-600 transition-all focus:outline-none"
              title="Recargar órdenes"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#0ea5e9]' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/tecnico/perfil')}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-200/80 flex items-center justify-center text-slate-800 hover:bg-slate-300 transition-colors focus:outline-none"
              title="Mi Perfil"
            >
              <User className="w-5 h-5 fill-slate-800 stroke-none" />
            </button>
          </div>
        </div>

        {/* Buscador superior */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 stroke-[2]" />
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar órden, cliente..."
            className="w-full min-h-[44px] pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
          />
        </div>

        {/* Pestañas de filtrado fijas y responsivas sin scroll horizontal */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {tabs.map((tab) => {
            const activo = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => cambiarTab(tab.id)}
                className={`min-h-[44px] py-2.5 px-2 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                  activo
                    ? 'bg-[#0ea5e9] text-white shadow-sky-500/20'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{tab.label}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    activo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenedor de Órdenes */}
        <div className="space-y-3 pb-6">
          {loading && ordenes.length === 0 ? (
            /* Skeletons pulsantes en primera carga para eliminar parpadeos */
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 bg-slate-200 rounded-md" />
                    <div className="h-5 w-20 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-4 w-1/2 bg-slate-200 rounded-md" />
                    <div className="h-6 w-6 bg-slate-200 rounded-full" />
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
                    <div className="h-3.5 w-32 bg-slate-200 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasError && ordenes.length === 0 ? (
            /* Degradación elegante ante fallos de conexión sin datos en memoria */
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 shadow-sm my-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-500 ring-8 ring-rose-50/50">
                <WifiOff className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-base">
                  No pudimos sincronizar la información
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {errorMessage || 'Verifica tu conexión a internet o cobertura móvil en la zona.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => refrescar()}
                disabled={isFetching}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-95 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                <span>Reintentar conexión</span>
              </button>
            </div>
          ) : ordenesFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 space-y-2">
              <p className="text-sm font-bold text-slate-700">No se encontraron órdenes</p>
              <p className="text-xs">No hay resultados para el filtro o término de búsqueda seleccionado.</p>
            </div>
          ) : (
            ordenesFiltradas.map((orden) => {
              const badge = getBadgeConfig(orden.estado);
              return (
                <div
                  key={orden.id}
                  onClick={() => {
                    // Si ya está finalizada, ir a éxito/detalle; si está en camino, ir a detalle
                    if (orden.estado === 'FINALIZADA') {
                      navigate(`/tecnico/ordenes/${orden.id}/exito`, { state: { orden } });
                    } else if (orden.estado === 'EN_DOMICILIO') {
                      navigate(`/tecnico/ordenes/${orden.id}/atencion`, { state: { orden } });
                    } else {
                      navigate(`/tecnico/ordenes/${orden.id}`, { state: { orden } });
                    }
                  }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2.5 cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
                >
                  {/* Fila superior: Código y Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base tracking-tight">
                      #{orden.codigoOrden}
                    </span>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Nombre del Servicio */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {orden.tipoServicio}
                  </h3>

                  {/* Dirección, Distrito y Referencia */}
                  <div className="flex items-start justify-between text-xs text-slate-500 pt-0.5">
                    <div className="flex items-start gap-1.5 min-w-0 pr-2">
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
                    <button
                      type="button"
                      onClick={(e) => handleOpenWaze(e, orden)}
                      title="Abrir ruta en Waze"
                      aria-label="Abrir ruta en Waze"
                      className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:scale-110 active:scale-90 transition-transform focus:outline-none"
                    >
                      <img src={frame26} alt="Waze" className="w-[26px] h-[26px] object-contain" />
                    </button>
                  </div>

                  {/* Fecha y Cliente */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{formatearFechaOrden(orden.fechaProgramada || orden.fechaCreacion || orden.fechaAsignacion)}</span>
                    </div>
                    <span
                      className="font-semibold text-[#0ea5e9] truncate max-w-[180px] text-right"
                      title={orden.nombreAfiliado}
                    >
                      {orden.nombreAfiliado || 'Cliente'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TecnicoLayout>
  );
};
