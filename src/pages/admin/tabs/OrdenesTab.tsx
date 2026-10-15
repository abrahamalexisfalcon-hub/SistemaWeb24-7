import React, { useMemo, useState } from 'react';
import type { OrdenDetalleAdmin } from '../../../types';
import { Search, RefreshCw, User, CheckCircle, Calendar } from 'lucide-react';
import { AdminOrdenCard, AdminOrdenTable } from '../components';

export type FiltroOrdenes = 'Todas' | 'En proceso' | 'Pendientes' | 'Finalizadas' | 'Canceladas';
export type FiltroPeriodo = 'todas' | 'hoy' | 'mes' | 'anio' | 'personalizado';

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
  paginaActual?: number;
  onPaginaChange?: (pagina: number) => void;
  tamanioPagina?: number;
  onTamanioPaginaChange?: (tamanio: number) => void;
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
  paginaActual: propsPaginaActual,
  onPaginaChange,
  tamanioPagina: propsTamanioPagina,
  onTamanioPaginaChange,
}) => {
  // Estados para filtro por fecha/rango temporal (Escritorio)
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('todas');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  // Estados de paginación compartida (Móvil y Escritorio)
  const [localPaginaActual, setLocalPaginaActual] = useState<number>(1);
  const [localTamanioPagina, setLocalTamanioPagina] = useState<number>(10);

  const paginaActual = propsPaginaActual !== undefined ? propsPaginaActual : localPaginaActual;
  const setPaginaActual = onPaginaChange || setLocalPaginaActual;

  const tamanioPagina = propsTamanioPagina !== undefined ? propsTamanioPagina : localTamanioPagina;
  const setTamanioPagina = onTamanioPaginaChange || setLocalTamanioPagina;

  // Filtrado reactivo en memoria (0 ms de delay)
  const ordenesFiltradas = useMemo(() => {
    const listado = ordenes || [];
    const hoy = new Date();

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

      // 2. Filtro por píldora de estado seleccionada
      if (filtroActivo === 'En proceso' && orden.estado !== 'EN_DOMICILIO') return false;
      if (filtroActivo === 'Pendientes' && orden.estado !== 'PENDIENTE') return false;
      if (filtroActivo === 'Finalizadas' && orden.estado !== 'FINALIZADA') return false;
      if (filtroActivo === 'Canceladas' && orden.estado !== 'CANCELADA') return false;

      // 3. Filtro por período / rango de fecha
      if (filtroPeriodo !== 'todas') {
        const fechaStr = orden.fechaProgramada || orden.fechaAsignacion || orden.fechaCreacion;
        if (!fechaStr) return false;
        const d = new Date(fechaStr);
        if (isNaN(d.getTime())) return false;

        if (filtroPeriodo === 'hoy') {
          const coincideHoy =
            d.getFullYear() === hoy.getFullYear() &&
            d.getMonth() === hoy.getMonth() &&
            d.getDate() === hoy.getDate();
          if (!coincideHoy) return false;
        } else if (filtroPeriodo === 'mes') {
          const coincideMes =
            d.getFullYear() === hoy.getFullYear() &&
            d.getMonth() === hoy.getMonth();
          if (!coincideMes) return false;
        } else if (filtroPeriodo === 'anio') {
          const coincideAnio = d.getFullYear() === hoy.getFullYear();
          if (!coincideAnio) return false;
        } else if (filtroPeriodo === 'personalizado') {
          if (fechaInicio) {
            const dInicio = new Date(`${fechaInicio}T00:00:00`);
            if (d < dInicio) return false;
          }
          if (fechaFin) {
            const dFin = new Date(`${fechaFin}T23:59:59.999`);
            if (d > dFin) return false;
          }
        }
      }

      return true;
    });
  }, [ordenes, busqueda, filtroActivo, filtroPeriodo, fechaInicio, fechaFin]);

  // Cálculo de paginación compartida (Móvil y Escritorio)
  const totalItems = ordenesFiltradas.length;
  const totalPaginas = Math.ceil(totalItems / tamanioPagina) || 1;
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas);

  const indiceInicio = (paginaValida - 1) * tamanioPagina;
  const indiceFin = Math.min(indiceInicio + tamanioPagina, totalItems);

  const ordenesPaginadas = useMemo(() => {
    return ordenesFiltradas.slice(indiceInicio, indiceFin);
  }, [ordenesFiltradas, indiceInicio, indiceFin]);

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
      <div className="flex items-center justify-between px-5 pt-6 pb-2 lg:px-0 lg:pt-0 lg:pb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">
            Órdenes de trabajo
          </h1>
          {isFetching && (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0ea5e9]" />
          )}
        </div>
        <button
          onClick={onOpenPerfil}
          className="w-10 h-10 rounded-full bg-slate-200/90 flex items-center justify-center text-slate-800 hover:bg-slate-300 transition-colors shadow-xs active:scale-95 lg:hidden"
          title="Perfil Administrador"
        >
          <User className="w-5 h-5 fill-slate-800 stroke-none" />
        </button>
      </div>

      {/* Toolbar en Desktop (>= lg): Segmented control de estados, Buscador y Filtro de fechas */}
      <div className="hidden lg:flex flex-col gap-3 mb-6">
        {/* Fila 1: Segmented Control de Estados y Buscador */}
        <div className="flex items-center justify-between gap-4">
          {/* Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-2xl border border-slate-300/40">
            {(['Todas', 'En proceso', 'Pendientes', 'Finalizadas', 'Canceladas'] as const).map((filtro) => {
              const activo = filtroActivo === filtro;
              return (
                <button
                  key={filtro}
                  onClick={() => {
                    onFiltroChange(filtro);
                    setPaginaActual(1);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activo
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {filtro}
                </button>
              );
            })}
          </div>

          {/* Buscador Desktop */}
          <div className="w-80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  onBusquedaChange(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar por código, cliente, servicio..."
                className="w-full bg-white rounded-2xl py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs border border-slate-200 focus:border-sky-400 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Fila 2: Filtro por Período / Fecha */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>Período:</span>
          </div>

          {/* Selector de Período Predefinido */}
          <select
            value={filtroPeriodo}
            onChange={(e) => {
              setFiltroPeriodo(e.target.value as FiltroPeriodo);
              setPaginaActual(1);
            }}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="todas">Todas las fechas</option>
            <option value="hoy">Hoy</option>
            <option value="mes">Este mes</option>
            <option value="anio">Este año</option>
            <option value="personalizado">Personalizado</option>
          </select>

          {/* Rango de Fechas Personalizado */}
          {filtroPeriodo === 'personalizado' && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <span className="text-xs text-slate-400 font-medium">Desde:</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPaginaActual(1);
                }}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:border-sky-500 focus:outline-none shadow-2xs"
              />
              <span className="text-xs text-slate-400 font-medium">Hasta:</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPaginaActual(1);
                }}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:border-sky-500 focus:outline-none shadow-2xs"
              />
              {(fechaInicio || fechaFin) && (
                <button
                  type="button"
                  onClick={() => {
                    setFechaInicio('');
                    setFechaFin('');
                    setPaginaActual(1);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Limpiar fechas"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {/* Indicador de resultados */}
          <div className="ml-auto text-xs text-slate-400 font-medium">
            Total filtradas: <span className="font-bold text-slate-700">{totalItems}</span>
          </div>
        </div>
      </div>

      {/* Toolbar en Móvil (< lg) */}
      <div className="block lg:hidden">
        {/* Barra de Búsqueda */}
        <div className="px-5 my-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                onBusquedaChange(e.target.value);
                setPaginaActual(1);
              }}
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
                onClick={() => {
                  onFiltroChange(filtro);
                  setPaginaActual(1);
                }}
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
      </div>

      {/* Contenedor Principal: Tarjetas en móvil, Tabla Operativa Paginada en escritorio */}
      <div className="px-5 flex-1 lg:px-0">
        {loading && (ordenes || []).length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0ea5e9]" />
            <span className="text-xs font-semibold">Cargando órdenes de trabajo...</span>
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-xs border border-slate-100 my-4 space-y-2">
            <CheckCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No se encontraron órdenes</p>
            <p className="text-xs text-slate-400">
              {busqueda || filtroPeriodo !== 'todas'
                ? 'No hay órdenes coincidentes con los filtros aplicados.'
                : 'No hay órdenes registradas con este filtro.'}
            </p>
          </div>
        ) : (
          <>
            {/* 1. Versión Móvil: Listado de Tarjetas Paginadas (< lg) */}
            <div className="block lg:hidden space-y-4">
              <div className="space-y-4">
                {(ordenesPaginadas || []).map((orden) => (
                  <AdminOrdenCard
                    key={orden.id}
                    orden={orden}
                    onClick={() => onSelectOrden(orden)}
                    onOpenWaze={handleOpenWaze}
                  />
                ))}
              </div>

              {/* Componente de Paginación Móvil */}
              <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs mt-4 mb-20 lg:mb-0">
                <button
                  type="button"
                  onClick={() => {
                    setPaginaActual(Math.max(1, paginaValida - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={paginaValida === 1}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  ← Anterior
                </button>
                <span className="text-xs font-semibold text-slate-600">
                  Página <span className="font-bold text-slate-900">{paginaValida}</span> de {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPaginaActual(Math.min(totalPaginas, paginaValida + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={paginaValida === totalPaginas || totalPaginas === 0}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  Siguiente →
                </button>
              </div>
            </div>

            {/* 2. Versión Escritorio: Tabla de Datos Operativa Paginada (>= lg) */}
            <div className="hidden lg:block">
              <AdminOrdenTable
                ordenes={ordenesPaginadas}
                onSelectOrden={onSelectOrden}
                onOpenWaze={handleOpenWaze}
                totalOrdenes={totalItems}
                paginaActual={paginaValida}
                filasPorPagina={tamanioPagina}
                onPaginaChange={setPaginaActual}
                onFilasPorPaginaChange={(filas: number) => {
                  setTamanioPagina(filas);
                  setPaginaActual(1);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
