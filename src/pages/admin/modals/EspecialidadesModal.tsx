import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Layers,
  Save,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '../../../api';
import type { Especialidad } from '../../../types';

interface EspecialidadesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEspecialidadesCambiadas?: () => void;
  onCrearEspecialidad?: (nombre: string) => Promise<void>;
  guardando?: boolean;
}

export const EspecialidadesModal: React.FC<EspecialidadesModalProps> = ({
  isOpen,
  onClose,
  onEspecialidadesCambiadas,
}) => {
  // Especialidades
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Formulario Inline (Creación / Edición)
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [especialidadEnEdicion, setEspecialidadEnEdicion] = useState<Especialidad | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [guardandoForm, setGuardandoForm] = useState<boolean>(false);

  // Modal de confirmación para eliminar
  const [especialidadAEliminar, setEspecialidadAEliminar] = useState<Especialidad | null>(null);
  const [eliminando, setEliminando] = useState<boolean>(false);

  // Cargar especialidades activas desde Backend
  const cargarEspecialidades = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await adminApi.getEspecialidades();
      const activas = Array.isArray(data) ? data.filter((e) => e.activo !== false) : [];
      setEspecialidades(activas);
    } catch (err: any) {
      console.error('Error al cargar especialidades:', err);
      setError('No se pudieron cargar las especialidades.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      cargarEspecialidades();
      setMostrarFormulario(false);
      setEspecialidadEnEdicion(null);
      setFormNombre('');
      setError(null);
      setExito(null);
    }
  }, [isOpen, cargarEspecialidades]);

  // Auto-cierre de alertas de éxito
  useEffect(() => {
    if (exito) {
      const timer = setTimeout(() => setExito(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [exito]);

  if (!isOpen) return null;

  // Abrir formulario para nueva especialidad
  const handleNuevaEspecialidad = () => {
    setEspecialidadEnEdicion(null);
    setFormNombre('');
    setError(null);
    setMostrarFormulario(true);
  };

  // Abrir formulario para editar especialidad existente
  const handleEditarEspecialidad = (esp: Especialidad) => {
    setEspecialidadEnEdicion(esp);
    setFormNombre(esp.nombre);
    setError(null);
    setMostrarFormulario(true);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setEspecialidadEnEdicion(null);
    setFormNombre('');
    setError(null);
  };

  // Guardar (crear o actualizar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = formNombre.trim();
    if (!nombreLimpio) {
      setError('El nombre de la especialidad es obligatorio.');
      return;
    }

    setGuardandoForm(true);
    setError(null);

    try {
      if (especialidadEnEdicion) {
        // Actualizar
        const actualizada = await adminApi.actualizarEspecialidad(especialidadEnEdicion.id, nombreLimpio);
        setExito(`Especialidad "${actualizada.nombre}" actualizada con éxito.`);
      } else {
        // Crear
        const nueva = await adminApi.crearEspecialidad(nombreLimpio);
        setExito(`Especialidad "${nueva.nombre}" registrada correctamente.`);
      }

      handleCancelarFormulario();
      await cargarEspecialidades();
      onEspecialidadesCambiadas?.();
    } catch (err: any) {
      console.error('Error al guardar especialidad:', err);
      const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al guardar la especialidad.';
      setError(msg);
    } finally {
      setGuardandoForm(false);
    }
  };

  // Confirmar y eliminar (baja lógica)
  const handleConfirmarEliminar = async () => {
    if (!especialidadAEliminar) return;
    setEliminando(true);
    setError(null);

    try {
      await adminApi.eliminarEspecialidad(especialidadAEliminar.id);
      setExito(`Especialidad "${especialidadAEliminar.nombre}" dada de baja correctamente.`);
      setEspecialidadAEliminar(null);
      await cargarEspecialidades();
      onEspecialidadesCambiadas?.();
    } catch (err: any) {
      console.error('Error al eliminar especialidad:', err);
      const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al eliminar la especialidad.';
      setError(msg);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Especialidades del Servicio</h2>
              <p className="text-xs text-slate-500">Gestión de rubros y categorías técnicas activas</p>
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

        {/* Barra superior con botón Nueva Especialidad */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Catálogo Oficial ({especialidades.length})
          </span>
          {!mostrarFormulario && (
            <button
              onClick={handleNuevaEspecialidad}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nueva Especialidad</span>
            </button>
          )}
        </div>

        {/* Formulario Inline de Alta / Edición */}
        {mostrarFormulario && (
          <div className="p-5 bg-sky-50/40 border-b border-sky-100 animate-in fade-in duration-150">
            <form onSubmit={handleGuardar} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">
                  {especialidadEnEdicion ? 'Editar Especialidad' : 'Nueva Especialidad'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelarFormulario}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nombre de la Especialidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Climatización, Cerrajería, Gasfitería"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {especialidadEnEdicion
                    ? 'Al renombrar, se actualizarán en cascada las órdenes y técnicos asociados para mantener la consistencia.'
                    : 'Estará disponible de inmediato en la asignación de técnicos y registro de órdenes.'}
                </p>
              </div>

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
                  disabled={guardandoForm || !formNombre.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {guardandoForm
                      ? 'Guardando...'
                      : especialidadEnEdicion
                      ? 'Actualizar'
                      : 'Guardar Especialidad'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Especialidades */}
        <div className="flex-1 overflow-y-auto p-5">
          {cargando ? (
            <div className="py-12 text-center text-slate-400">
              <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
              <p className="text-xs font-semibold">Cargando catálogo de especialidades...</p>
            </div>
          ) : especialidades.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Sin especialidades registradas</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                No hay especialidades activas. Presiona &quot;Nueva Especialidad&quot; para registrar la primera.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
              {especialidades.map((esp) => (
                <div
                  key={esp.id}
                  className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{esp.nombre}</p>
                      <span className="inline-block px-2 py-0.5 mt-0.5 bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-bold rounded-md">
                        Activa
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditarEspecialidad(esp)}
                      title="Editar especialidad"
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEspecialidadAEliminar(esp)}
                      title="Eliminar especialidad"
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
          <span>{especialidades.length} especialidades en catálogo</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de Confirmación para Eliminar */}
      {especialidadAEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">¿Eliminar especialidad?</h3>
              <p className="text-xs text-slate-500">
                Se dará de baja <span className="font-bold text-slate-800">&quot;{especialidadAEliminar.nombre}&quot;</span> del catálogo oficial. Las órdenes de trabajo y técnicos vinculados mantendrán su historial intacto.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEspecialidadAEliminar(null)}
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
