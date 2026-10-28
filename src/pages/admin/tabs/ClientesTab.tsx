import React, { useState, useMemo } from 'react';
import type { Afiliado } from '../../../types';
import { Plus, MapPin, Phone, Search, X, Edit2, Trash2, AlertTriangle, Users } from 'lucide-react';
import { AdminClienteTable } from '../components';

interface ClientesTabProps {
  afiliados: Afiliado[];
  onNuevoAfiliado: () => void;
  onEditarAfiliado?: (afiliado: Afiliado) => void;
  onEliminarAfiliado?: (id: number) => Promise<void>;
}

export const ClientesTab: React.FC<ClientesTabProps> = ({
  afiliados,
  onNuevoAfiliado,
  onEditarAfiliado,
  onEliminarAfiliado,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [tamanioPagina, setTamanioPagina] = useState(10);
  const [afiliadoAEliminar, setAfiliadoAEliminar] = useState<Afiliado | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Filtrado instantáneo en tiempo real por nombre, DNI, teléfono o dirección/distrito
  const afiliadosFiltrados = useMemo(() => {
    const listado = afiliados || [];
    if (!busqueda.trim()) return listado;
    const q = busqueda.toLowerCase().trim();
    return listado.filter(
      (a) =>
        (a.nombreCompleto || a.nombre || '').toLowerCase().includes(q) ||
        (a.dni || '').toLowerCase().includes(q) ||
        (a.telefono || '').toLowerCase().includes(q) ||
        (a.direccion || '').toLowerCase().includes(q) ||
        (a.referencia || '').toLowerCase().includes(q) ||
        (a.distrito || '').toLowerCase().includes(q)
    );
  }, [afiliados, busqueda]);

  // Cálculo de paginación compartida (Móvil y Escritorio)
  const totalAfiliados = afiliadosFiltrados.length;
  const totalPaginas = Math.ceil(totalAfiliados / tamanioPagina) || 1;
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas);

  const indiceInicio = (paginaValida - 1) * tamanioPagina;
  const indiceFin = Math.min(indiceInicio + tamanioPagina, totalAfiliados);

  const afiliadosPaginados = useMemo(() => {
    return afiliadosFiltrados.slice(indiceInicio, indiceFin);
  }, [afiliadosFiltrados, indiceInicio, indiceFin]);

  const handleConfirmarEliminar = async () => {
    if (!afiliadoAEliminar) return;
    setEliminando(true);
    try {
      if (onEliminarAfiliado) {
        await onEliminarAfiliado(afiliadoAEliminar.id);
      }
      setAfiliadoAEliminar(null);
    } catch (err) {
      console.error('Error al dar de baja al afiliado:', err);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      {/* Cabecera y Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1 lg:pb-2 w-full">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">
              Clientes Afiliados
            </h1>
            {/* Botón Nuevo Afiliado en móvil */}
            <button
              type="button"
              onClick={onNuevoAfiliado}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl px-3 py-2 text-xs shadow-sm transition-colors flex items-center gap-1.5 active:scale-95 sm:hidden cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Padrón de afiliados activos en 24/7 Asistencias ({(afiliados || []).length})
          </p>
        </div>

        {/* Buscador y Botón */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
          {/* Barra de Búsqueda */}
          <div className="relative flex-1 w-full sm:w-72 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, teléfono o dirección..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setPaginaActual(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón Nuevo Afiliado en Tablet y Desktop */}
          <button
            type="button"
            onClick={onNuevoAfiliado}
            className="hidden sm:flex bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl px-4 py-2.5 text-xs shadow-sm transition-colors items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Afiliado</span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal: Tarjetas en móvil, Tabla de Datos en escritorio */}
      {afiliadosFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-xs border border-slate-100 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">
            {busqueda ? 'No se encontraron afiliados coincidentes' : 'No hay afiliados registrados'}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {busqueda
              ? 'Intenta con otro término de búsqueda por nombre, documento o dirección.'
              : 'Presiona el botón "+ Nuevo Afiliado" para registrar al primer afiliado.'}
          </p>
        </div>
      ) : (
        <>
          {/* 1. Vista Móvil y Tablet: Tarjetas con Paginación Táctil (< lg) */}
          <div className="block lg:hidden space-y-4 pb-28">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {afiliadosPaginados.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:border-slate-200 transition-all space-y-2"
                >
                  {/* Fila superior: Nombre, DNI y Botones de acción */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug truncate">
                        {a.nombreCompleto || a.nombre}
                      </h4>
                      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        DNI: {a.dni?.trim() ? a.dni : 'Sin DNI'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditarAfiliado && onEditarAfiliado(a)}
                        title="Editar afiliado"
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAfiliadoAEliminar(a)}
                        title="Dar de baja afiliado"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fila de detalles: Dirección y Teléfono */}
                  <div className="space-y-1 pt-1.5 border-t border-slate-50 text-xs">
                    <p className="text-slate-600 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {a.direccion}
                        {a.distrito ? ` - ${a.distrito}` : ''}
                      </span>
                    </p>
                    {a.referencia && (
                      <span className="text-xs text-slate-400 block truncate pl-5.5">
                        Ref: {a.referencia}
                      </span>
                    )}
                    <p className="text-slate-500 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{a.telefono || 'Sin teléfono'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación Móvil */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs mt-4">
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

          {/* 2. Vista Escritorio: Tabla de Datos Operativa Paginada (>= lg) */}
          <div className="hidden lg:block">
            <AdminClienteTable
              afiliados={afiliadosPaginados}
              onEditar={onEditarAfiliado}
              onEliminar={(a: Afiliado) => setAfiliadoAEliminar(a)}
              totalAfiliados={totalAfiliados}
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

      {/* Modal de Confirmación para Dar de Baja */}
      {afiliadoAEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">¿Dar de baja al afiliado?</h3>
              <p className="text-xs text-slate-500">
                Se dará de baja a{' '}
                <span className="font-bold text-slate-800">
                  &quot;{afiliadoAEliminar.nombreCompleto || afiliadoAEliminar.nombre}&quot;
                </span>{' '}
                del padrón activo. El historial de órdenes de trabajo anteriores permanecerá intacto.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAfiliadoAEliminar(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminando}
                onClick={handleConfirmarEliminar}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {eliminando ? 'Eliminando...' : 'Sí, dar de baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
