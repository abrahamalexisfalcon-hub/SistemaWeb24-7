import React, { useState, useMemo } from 'react';
import type { TecnicoResumen, OrdenDetalleAdmin } from '../../../types';
import { Plus, Search, X, Users } from 'lucide-react';
import { AdminTecnicoCard, AdminTecnicoTable } from '../components';

interface TecnicosTabProps {
  tecnicos: TecnicoResumen[];
  ordenes: OrdenDetalleAdmin[];
  onNuevoTecnico: () => void;
  onEditarTecnico: (tec: TecnicoResumen) => void;
}

export const TecnicosTab: React.FC<TecnicosTabProps> = ({
  tecnicos,
  ordenes,
  onNuevoTecnico,
  onEditarTecnico,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [tamanioPagina, setTamanioPagina] = useState(10);

  // Filtrado reactivo en tiempo real por nombre, correo, teléfono o especialidad
  const tecnicosFiltrados = useMemo(() => {
    const listado = tecnicos || [];
    if (!busqueda.trim()) return listado;
    const q = busqueda.toLowerCase().trim();
    return listado.filter(
      (t) =>
        t.nombreCompleto?.toLowerCase().includes(q) ||
        t.correo?.toLowerCase().includes(q) ||
        t.telefono?.toLowerCase().includes(q) ||
        t.especialidad?.toLowerCase().includes(q)
    );
  }, [tecnicos, busqueda]);

  // Cálculo de paginación compartida (Móvil y Escritorio)
  const totalTecnicos = tecnicosFiltrados.length;
  const totalPaginas = Math.ceil(totalTecnicos / tamanioPagina) || 1;
  const paginaValida = Math.min(Math.max(1, paginaActual), totalPaginas);

  const indiceInicio = (paginaValida - 1) * tamanioPagina;
  const indiceFin = Math.min(indiceInicio + tamanioPagina, totalTecnicos);

  const tecnicosPaginados = useMemo(() => {
    return tecnicosFiltrados.slice(indiceInicio, indiceFin);
  }, [tecnicosFiltrados, indiceInicio, indiceFin]);

  return (
    <div className="p-5 space-y-4 lg:p-0 lg:space-y-6">
      {/* Cabecera y Controles */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-1 lg:pb-2">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">
              Técnicos Operativos
            </h1>
            {/* Botón Nuevo Técnico en móvil */}
            <button
              type="button"
              onClick={onNuevoTecnico}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl px-3 py-2 text-xs shadow-sm transition-colors flex items-center gap-1.5 active:scale-95 lg:hidden cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y disponibilidad de la fuerza técnica en tiempo real ({(tecnicos || []).length})
          </p>
        </div>

        {/* Buscador y Botón en Desktop */}
        <div className="flex items-center gap-3">
          {/* Barra de Búsqueda */}
          <div className="relative flex-1 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, especialidad, correo..."
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

          {/* Botón Nuevo Técnico en Desktop */}
          <button
            type="button"
            onClick={onNuevoTecnico}
            className="hidden lg:flex bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl px-4 py-2.5 text-xs shadow-sm transition-colors items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Técnico</span>
          </button>
        </div>
      </div>

      {/* Contenedor Principal: Tarjetas en móvil, Tabla de Datos en escritorio */}
      {tecnicosFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center shadow-xs border border-slate-100 my-4 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">No se encontraron técnicos</p>
          <p className="text-xs text-slate-400">
            {busqueda
              ? 'No hay técnicos que coincidan con los términos de búsqueda.'
              : 'No hay técnicos registrados. Haz clic en "Nuevo Técnico" para registrar uno.'}
          </p>
        </div>
      ) : (
        <>
          {/* 1. Vista Móvil: Cards con Paginación Táctil (< lg) */}
          <div className="block lg:hidden space-y-3">
            <div className="space-y-3">
              {(tecnicosPaginados || []).map((tec) => (
                <AdminTecnicoCard
                  key={tec.id}
                  tecnico={tec}
                  ordenes={ordenes}
                  onEditar={onEditarTecnico}
                />
              ))}
            </div>

            {/* Paginación Móvil */}
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

          {/* 2. Vista Escritorio: Tabla de Datos Operativa Paginada (>= lg) */}
          <div className="hidden lg:block">
            <AdminTecnicoTable
              tecnicos={tecnicosPaginados}
              ordenes={ordenes}
              onEditar={onEditarTecnico}
              totalTecnicos={totalTecnicos}
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
  );
};
