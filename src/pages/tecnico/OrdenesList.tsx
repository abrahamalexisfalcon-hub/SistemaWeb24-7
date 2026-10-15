import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrdenes } from '../../context/OrdenesContext';
import { TecnicoLayout } from '../../components/tecnico';
import frame26 from '../../assets/Frame 26.svg';
import type { OrdenResumenTecnico, EstadoOrden } from '../../types';
import { Search, MapPin, Clock, User, RefreshCw } from 'lucide-react';

export const OrdenesList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    ordenes,
    loading,
    isFetching,
    cargarOrdenes,
    refrescar,
    actualizarOrdenLocal,
  } = useOrdenes();

  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState<'Todas' | 'En proceso' | 'Pendientes' | 'Finalizadas'>('Todas');

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

  // Filtrado reactivo 100% tolerante a nulos
  const ordenesFiltradas = (ordenes || []).filter((orden) => {
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

    // Filtro por pestaña
    if (filtroActivo === 'Todas') return true;
    if (filtroActivo === 'En proceso') return orden.estado === 'EN_DOMICILIO';
    if (filtroActivo === 'Pendientes') return orden.estado === 'PENDIENTE';
    if (filtroActivo === 'Finalizadas') return orden.estado === 'FINALIZADA';
    return true;
  });

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
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-600 transition-all"
              title="Recargar órdenes"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#0ea5e9]' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/tecnico/perfil')}
              className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-800 hover:bg-slate-300 transition-colors"
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
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
          />
        </div>

        {/* Filtros horizontales en pastillas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['Todas', 'En proceso', 'Pendientes', 'Finalizadas'] as const).map((filtro) => {
            const activo = filtroActivo === filtro;
            return (
              <button
                key={filtro}
                onClick={() => setFiltroActivo(filtro)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shadow-sm ${
                  activo
                    ? 'bg-[#0ea5e9] text-white shadow-sky-500/20'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {filtro}
              </button>
            );
          })}
        </div>

        {/* Contenedor de Órdenes */}
        <div className="space-y-3 pb-6">
          {loading ? (
            /* Solo se muestra en la primera carga inicial cuando no hay datos en memoria */
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#0ea5e9]" />
              <p className="text-xs font-semibold">Cargando órdenes de trabajo...</p>
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
                      className="flex-shrink-0 rounded-full hover:scale-110 active:scale-90 transition-transform focus:outline-none"
                    >
                      <img src={frame26} alt="Waze" className="w-[26px] h-[26px] object-contain" />
                    </button>
                  </div>

                  {/* Fecha y Cliente */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{orden.fechaProgramada || 'Hoy, 10:30 AM'}</span>
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
