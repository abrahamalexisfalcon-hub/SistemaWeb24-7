import React, { useMemo } from 'react';
import type { OrdenDetalleAdmin } from '../../../types';
import { Search, RefreshCw, User, CheckCircle } from 'lucide-react';
import { AdminOrdenCard } from '../components/AdminOrdenCard';
import { MOCK_ORDENES_FIGMA } from '../utils';

export type FiltroOrdenes = 'Todas' | 'En proceso' | 'Pendientes' | 'Finalizadas' | 'Canceladas';

interface OrdenesTabProps {
  ordenes: OrdenDetalleAdmin[];
  loading: boolean;
  isFetching: boolean;
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  filtroActivo: FiltroOrdenes;
  onFiltroChange: (filtro: FiltroOrdenes) => void;
  onSelectOrden: (orden: OrdenDetalleAdmin) => void;
  onOpenPerfil: () => void;
}

export const OrdenesTab: React.FC<OrdenesTabProps> = ({
  ordenes,
  loading,
  isFetching,
  busqueda,
  onBusquedaChange,
  filtroActivo,
  onFiltroChange,
  onSelectOrden,
  onOpenPerfil,
}) => {
  // Filtrado reactivo en memoria (0 ms de delay)
  const ordenesFiltradas = useMemo(() => {
    const listado = ordenes.length > 0 ? ordenes : MOCK_ORDENES_FIGMA;

    return listado.filter((orden) => {
      // 1. Filtro por texto
      const termino = busqueda.toLowerCase().trim();
      const coincideTexto =
        !termino ||
        orden.codigoOrden?.toLowerCase().includes(termino) ||
        orden.afiliadoNombre?.toLowerCase().includes(termino) ||
        (orden as any).nombreAfiliado?.toLowerCase().includes(termino) ||
        orden.tipoServicio?.toLowerCase().includes(termino) ||
        orden.afiliadoDireccion?.toLowerCase().includes(termino) ||
        (orden as any).direccion?.toLowerCase().includes(termino) ||
        orden.afiliadoDistrito?.toLowerCase().includes(termino) ||
        (orden as any).distrito?.toLowerCase().includes(termino);

      if (!coincideTexto) return false;

      // 2. Filtro por píldora seleccionada
      if (filtroActivo === 'Todas') return true;
      if (filtroActivo === 'En proceso') return orden.estado === 'EN_DOMICILIO';
      if (filtroActivo === 'Pendientes') return orden.estado === 'PENDIENTE';
      if (filtroActivo === 'Finalizadas') return orden.estado === 'FINALIZADA';
      if (filtroActivo === 'Canceladas') return orden.estado === 'CANCELADA';
      return true;
    });
  }, [ordenes, busqueda, filtroActivo]);

  const handleOpenWaze = (e: React.MouseEvent, orden: OrdenDetalleAdmin) => {
    e.stopPropagation();
    const dir = orden.afiliadoDireccion || (orden as any).direccion || 'Av. Central 120';
    const dis = orden.afiliadoDistrito || (orden as any).distrito || 'Villa El Salvador';
    const destino = encodeURIComponent(`${dir}, ${dis}, Lima`);
    window.open(`https://www.waze.com/ul?q=${destino}&navigate=yes`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header Superior */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Órdenes de trabajo
          </h1>
          {isFetching && (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0ea5e9]" />
          )}
        </div>
        <button
          onClick={onOpenPerfil}
          className="w-10 h-10 rounded-full bg-slate-200/90 flex items-center justify-center text-slate-800 hover:bg-slate-300 transition-colors shadow-xs active:scale-95"
          title="Perfil Administrador"
        >
          <User className="w-5 h-5 fill-slate-800 stroke-none" />
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="px-5 my-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar órden, cliente..."
            className="w-full bg-white rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-xs border border-transparent focus:border-sky-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Píldoras de Filtro (Tabs Horizontales) */}
      <div className="px-5 mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {(['Todas', 'En proceso', 'Pendientes', 'Finalizadas', 'Canceladas'] as const).map((filtro) => {
          const activo = filtroActivo === filtro;
          return (
            <button
              key={filtro}
              onClick={() => onFiltroChange(filtro)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activo
                  ? 'bg-[#0284c7] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 shadow-xs'
              }`}
            >
              {filtro}
            </button>
          );
        })}
      </div>

      {/* Listado de Tarjetas de Órdenes */}
      <div className="px-5 space-y-4 flex-1">
        {loading && ordenes.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0ea5e9]" />
            <span className="text-xs font-semibold">Cargando órdenes de trabajo...</span>
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xs border border-slate-100 my-4 space-y-2">
            <CheckCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No se encontraron órdenes</p>
            <p className="text-xs text-slate-400">
              {busqueda
                ? `No hay coincidencias para "${busqueda}".`
                : 'No hay órdenes registradas con este filtro.'}
            </p>
          </div>
        ) : (
          ordenesFiltradas.map((orden) => (
            <AdminOrdenCard
              key={orden.id}
              orden={orden}
              onClick={() => onSelectOrden(orden)}
              onOpenWaze={handleOpenWaze}
            />
          ))
        )}
      </div>
    </div>
  );
};
