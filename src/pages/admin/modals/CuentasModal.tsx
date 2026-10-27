import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building2,
  Save,
  RotateCcw,
  AlertTriangle,
  Power,
} from 'lucide-react';
import { adminApi } from '../../../api';
import type { Cuenta } from '../../../types';

interface CuentasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCuentasCambiadas?: () => void;
}

export const CuentasModal: React.FC<CuentasModalProps> = ({
  isOpen,
  onClose,
  onCuentasCambiadas,
}) => {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Formulario Inline (Creación / Edición)
  const [mostrarFormulario, setMostrarFormulario] = useState<boolean>(false);
  const [cuentaEnEdicion, setCuentaEnEdicion] = useState<Cuenta | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [guardandoForm, setGuardandoForm] = useState<boolean>(false);

  // Confirmación para deshabilitar cuenta
  const [cuentaADesactivar, setCuentaADesactivar] = useState<Cuenta | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const cargarCuentas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await adminApi.getCuentas(true);
      setCuentas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al cargar cuentas:', err);
      setError('No se pudieron cargar las cuentas / aseguradoras.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      cargarCuentas();
      setMostrarFormulario(false);
      setCuentaEnEdicion(null);
      setFormNombre('');
      setError(null);
      setExito(null);
    }
  }, [isOpen, cargarCuentas]);

  useEffect(() => {
    if (exito) {
      const timer = setTimeout(() => setExito(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [exito]);

  if (!isOpen) return null;

  const handleNuevaCuenta = () => {
    setCuentaEnEdicion(null);
    setFormNombre('');
    setError(null);
    setMostrarFormulario(true);
  };

  const handleEditarCuenta = (cuenta: Cuenta) => {
    setCuentaEnEdicion(cuenta);
    setFormNombre(cuenta.nombre);
    setError(null);
    setMostrarFormulario(true);
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setCuentaEnEdicion(null);
    setFormNombre('');
    setError(null);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = formNombre.trim();
    if (!nombreLimpio) {
      setError('El nombre de la cuenta / aseguradora es obligatorio.');
      return;
    }

    setGuardandoForm(true);
    setError(null);

    try {
      if (cuentaEnEdicion) {
        const actualizada = await adminApi.actualizarCuenta(
          cuentaEnEdicion.id,
          nombreLimpio,
          cuentaEnEdicion.activo
        );
        setExito(`Cuenta "${actualizada.nombre}" actualizada con éxito.`);
      } else {
        const nueva = await adminApi.crearCuenta(nombreLimpio);
        setExito(`Cuenta "${nueva.nombre}" registrada correctamente.`);
      }

      handleCancelarFormulario();
      await cargarCuentas();
      onCuentasCambiadas?.();
    } catch (err: any) {
      console.error('Error al guardar cuenta:', err);
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        'Error al guardar la cuenta.';
      setError(msg);
    } finally {
      setGuardandoForm(false);
    }
  };

  const handleConfirmarDesactivar = async () => {
    if (!cuentaADesactivar) return;
    setProcesandoId(cuentaADesactivar.id);
    setError(null);

    try {
      await adminApi.eliminarCuenta(cuentaADesactivar.id);
      setExito(`Cuenta "${cuentaADesactivar.nombre}" deshabilitada correctamente.`);
      setCuentaADesactivar(null);
      await cargarCuentas();
      onCuentasCambiadas?.();
    } catch (err: any) {
      console.error('Error al deshabilitar cuenta:', err);
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        'Error al deshabilitar la cuenta.';
      setError(msg);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleReactivarCuenta = async (cuenta: Cuenta) => {
    setProcesandoId(cuenta.id);
    setError(null);
    try {
      await adminApi.toggleCuenta(cuenta.id);
      setExito(`Cuenta "${cuenta.nombre}" habilitada nuevamente.`);
      await cargarCuentas();
      onCuentasCambiadas?.();
    } catch (err: any) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        'Error al cambiar el estado de la cuenta.';
      setError(msg);
    } finally {
      setProcesandoId(null);
    }
  };

  const cuentasActivasCount = cuentas.filter((c) => c.activo !== false).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Building2 className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Cuentas y Aseguradoras
              </h2>
              <p className="text-xs text-slate-500">
                Gestión de aseguradoras, convenios y clientes corporativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
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

        {/* Barra superior con botón Nueva Cuenta */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Cuentas Activas ({cuentasActivasCount})
          </span>
          {!mostrarFormulario && (
            <button
              onClick={handleNuevaCuenta}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nueva Cuenta</span>
            </button>
          )}
        </div>

        {/* Formulario Inline de Alta / Edición */}
        {mostrarFormulario && (
          <div className="p-5 bg-emerald-50/40 border-b border-emerald-100 animate-in fade-in duration-150">
            <form onSubmit={handleGuardar} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  {cuentaEnEdicion ? 'Editar Cuenta / Aseguradora' : 'Nueva Cuenta / Aseguradora'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelarFormulario}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nombre de la Cuenta o Aseguradora <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Rímac Seguros, Pacífico, Interseguro, Mapfre"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Estará disponible como opción en el formulario de registro de nuevas órdenes de trabajo.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelarFormulario}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoForm || !formNombre.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {guardandoForm
                      ? 'Guardando...'
                      : cuentaEnEdicion
                      ? 'Actualizar'
                      : 'Guardar Cuenta'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Cuentas */}
        <div className="flex-1 overflow-y-auto p-5">
          {cargando ? (
            <div className="py-12 text-center text-slate-400">
              <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-semibold">Cargando cuentas y aseguradoras...</p>
            </div>
          ) : cuentas.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Sin cuentas registradas</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                No hay aseguradoras o cuentas registradas. Presiona &quot;Nueva Cuenta&quot; para agregar la primera.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
              {cuentas.map((cuenta) => {
                const activa = cuenta.activo !== false;
                return (
                  <div
                    key={cuenta.id}
                    className={`p-3.5 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 ${
                      !activa ? 'opacity-60 bg-slate-50/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                          activa
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{cuenta.nombre}</p>
                        <span
                          className={`inline-block px-2 py-0.5 mt-0.5 border text-[10px] font-bold rounded-md ${
                            activa
                              ? 'bg-emerald-50 border-emerald-200/60 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          {activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEditarCuenta(cuenta)}
                        title="Editar cuenta"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {activa ? (
                        <button
                          onClick={() => setCuentaADesactivar(cuenta)}
                          disabled={procesandoId === cuenta.id}
                          title="Deshabilitar cuenta"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivarCuenta(cuenta)}
                          disabled={procesandoId === cuenta.id}
                          title="Habilitar cuenta"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>{cuentasActivasCount} cuentas activas</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modal de Confirmación para Deshabilitar */}
      {cuentaADesactivar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">¿Deshabilitar cuenta?</h3>
              <p className="text-xs text-slate-500">
                Se dará de baja <span className="font-bold text-slate-800">&quot;{cuentaADesactivar.nombre}&quot;</span> de las opciones activas. Las órdenes históricas asociadas conservarán su registro intacto.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCuentaADesactivar(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={procesandoId === cuentaADesactivar.id}
                onClick={handleConfirmarDesactivar}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {procesandoId === cuentaADesactivar.id ? 'Deshabilitando...' : 'Sí, deshabilitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
