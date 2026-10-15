import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Package,
  Filter,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { materialApi, adminApi } from '../../api';
import type { Material, Especialidad } from '../../types';

interface GestionMaterialesModalProps {
  isOpen: boolean;
  onClose: () => void;
  especialidadPreseleccionada?: string;
}

const UNIDADES_COMUNES = ['Unidad', 'Metros', 'Kilos', 'Litros', 'Global', 'Kit', 'Bolsa', 'Pieza'];

export const GestionMaterialesModal: React.FC<GestionMaterialesModalProps> = ({
  isOpen,
  onClose,
  especialidadPreseleccionada
}) => {
  // Especialidades
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadSeleccionadaId, setEspecialidadSeleccionadaId] = useState<number | null>(null);

  // Materiales
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Modo formulario (Creación / Edición)
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [materialEnEdicion, setMaterialEnEdicion] = useState<Material | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formUnidad, setFormUnidad] = useState<string>('Unidad');
  const [formEspecialidadId, setFormEspecialidadId] = useState<number | ''>('');
  const [guardando, setGuardando] = useState<boolean>(false);

  // Modal de confirmación para eliminar
  const [materialAEliminar, setMaterialAEliminar] = useState<Material | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // 1. Cargar especialidades
  const cargarEspecialidades = useCallback(async () => {
    try {
      const data = await adminApi.getEspecialidades();
      const activas = data.filter((e) => e.activo !== false);
      setEspecialidades(activas);

      if (activas.length > 0) {
        if (especialidadPreseleccionada) {
          const match = activas.find(
            (e) => e.nombre.toLowerCase() === especialidadPreseleccionada.toLowerCase()
          );
          if (match) {
            setEspecialidadSeleccionadaId(match.id);
            return;
          }
        }
        setEspecialidadSeleccionadaId((prev) => prev ?? activas[0].id);
      }
    } catch (err: any) {
      console.error('Error al cargar especialidades:', err);
      setError('No se pudieron cargar las especialidades.');
    }
  }, [especialidadPreseleccionada]);

  // 2. Cargar materiales de la especialidad
  const cargarMateriales = useCallback(async (espId: number | null) => {
    if (!espId) return;
    setCargando(true);
    setError(null);
    try {
      const data = await materialApi.getMaterialesAdmin(espId);
      // Filtrar activos para la vista operativa
      setMateriales(data.filter((m) => m.activo !== false));
    } catch (err: any) {
      console.error('Error al cargar materiales:', err);
      setError('Error al obtener la lista de materiales.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      cargarEspecialidades();
    }
  }, [isOpen, cargarEspecialidades]);

  useEffect(() => {
    if (especialidadSeleccionadaId) {
      cargarMateriales(especialidadSeleccionadaId);
    }
  }, [especialidadSeleccionadaId, cargarMateriales]);

  // Notificaciones auto-cierre
  useEffect(() => {
    if (exito) {
      const timer = setTimeout(() => setExito(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [exito]);

  if (!isOpen) return null;

  // Abrir formulario para nuevo material
  const handleNuevoMaterial = () => {
    setMaterialEnEdicion(null);
    setFormNombre('');
    setFormUnidad('Unidad');
    setFormEspecialidadId(especialidadSeleccionadaId ?? (especialidades[0]?.id || ''));
    setError(null);
    setMostrarFormulario(true);
  };

  // Abrir formulario para editar material
  const handleEditarMaterial = (mat: Material) => {
    setMaterialEnEdicion(mat);
    setFormNombre(mat.nombre);
    setFormUnidad(mat.unidad || 'Unidad');
    setFormEspecialidadId(mat.especialidadId);
    setError(null);
    setMostrarFormulario(true);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setMaterialEnEdicion(null);
    setFormNombre('');
    setFormUnidad('Unidad');
    setError(null);
  };

  // Guardar (crear o actualizar)
  const handleGuardarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setError('El nombre del material es obligatorio.');
      return;
    }
    if (!formUnidad.trim()) {
      setError('La unidad de medida es obligatoria.');
      return;
    }
    if (!formEspecialidadId) {
      setError('Debe seleccionar una especialidad.');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      if (materialEnEdicion) {
        // Actualizar
        const actualizado = await materialApi.actualizarMaterial(materialEnEdicion.id, {
          nombre: formNombre.trim(),
          unidad: formUnidad.trim(),
          especialidadId: Number(formEspecialidadId),
          activo: true
        });
        setExito(`Material "${actualizado.nombre}" actualizado correctamente.`);
      } else {
        // Crear
        const nuevo = await materialApi.crearMaterial({
          nombre: formNombre.trim(),
          unidad: formUnidad.trim(),
          especialidadId: Number(formEspecialidadId)
        });
        setExito(`Material "${nuevo.nombre}" registrado exitosamente.`);
      }

      handleCancelarFormulario();
      // Recargar materiales de la especialidad activa
      if (especialidadSeleccionadaId) {
        cargarMateriales(especialidadSeleccionadaId);
      }
    } catch (err: any) {
      console.error('Error al guardar material:', err);
      const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al guardar el material.';
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  // Confirmar y eliminar
  const handleConfirmarEliminar = async () => {
    if (!materialAEliminar) return;
    setEliminando(true);
    setError(null);
    try {
      await materialApi.eliminarMaterial(materialAEliminar.id);
      setExito(`Material "${materialAEliminar.nombre}" eliminado del catálogo.`);
      setMaterialAEliminar(null);
      if (especialidadSeleccionadaId) {
        cargarMateriales(especialidadSeleccionadaId);
      }
    } catch (err: any) {
      console.error('Error al eliminar material:', err);
      const msg = err.response?.data?.mensaje || 'Error al eliminar el material.';
      setError(msg);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Package className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Catálogo de Materiales</h2>
              <p className="text-xs text-slate-500">Gestión de repuestos y materiales por especialidad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        {exito && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{exito}</span>
          </div>
        )}

        {/* Filtro de Especialidad y Botón Nuevo */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <label className="text-xs font-bold text-slate-600 uppercase">Especialidad:</label>
            <select
              value={especialidadSeleccionadaId || ''}
              onChange={(e) => setEspecialidadSeleccionadaId(Number(e.target.value))}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
            >
              {especialidades.map((esp) => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre}
                </option>
              ))}
            </select>
          </div>

          {!mostrarFormulario && (
            <button
              onClick={handleNuevoMaterial}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Material</span>
            </button>
          )}
        </div>

        {/* Formulario Inline de Alta / Edición */}
        {mostrarFormulario && (
          <div className="p-5 bg-sky-50/40 border-b border-sky-100 animate-in fade-in duration-150">
            <form onSubmit={handleGuardarMaterial} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">
                  {materialEnEdicion ? 'Editar Material' : 'Nuevo Material para ' + (especialidades.find(e => e.id === especialidadSeleccionadaId)?.nombre || '')}
                </span>
                <button
                  type="button"
                  onClick={handleCancelarFormulario}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Nombre del Material / Repuesto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Gas Refrigerante R410A"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    required
                    list="unidades-sugeridas"
                    placeholder="Ej. Unidad, Metros"
                    value={formUnidad}
                    onChange={(e) => setFormUnidad(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                  <datalist id="unidades-sugeridas">
                    {UNIDADES_COMUNES.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Selector de Especialidad si se edita */}
              {materialEnEdicion && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Cambiar Especialidad Asociada
                  </label>
                  <select
                    value={formEspecialidadId}
                    onChange={(e) => setFormEspecialidadId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    {especialidades.map((esp) => (
                      <option key={esp.id} value={esp.id}>
                        {esp.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelarFormulario}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{guardando ? 'Guardando...' : materialEnEdicion ? 'Actualizar' : 'Guardar Material'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Materiales */}
        <div className="flex-1 overflow-y-auto p-5">
          {cargando ? (
            <div className="py-12 text-center text-slate-400">
              <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
              <p className="text-xs font-semibold">Cargando catálogo de materiales...</p>
            </div>
          ) : materiales.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Sin materiales registrados</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                No hay materiales asignados a esta especialidad. Presiona &quot;Nuevo Material&quot; para registrar el primero.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
              {materiales.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{m.nombre}</p>
                      <span className="inline-block px-2 py-0.5 mt-0.5 bg-sky-50 border border-sky-200/60 text-sky-700 text-[10px] font-bold rounded-md">
                        {m.unidad || 'Unidad'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditarMaterial(m)}
                      title="Editar material"
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMaterialAEliminar(m)}
                      title="Eliminar material"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>{materiales.length} materiales en esta categoría</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de Confirmación para Eliminar */}
      {materialAEliminar && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">¿Eliminar material?</h3>
              <p className="text-xs text-slate-500">
                Se desactivará <span className="font-bold text-slate-800">&quot;{materialAEliminar.nombre}&quot;</span> del catálogo. Los registros históricos de órdenes anteriores permanecerán intactos.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMaterialAEliminar(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminando}
                onClick={handleConfirmarEliminar}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
