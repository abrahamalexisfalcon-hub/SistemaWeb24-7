import React, { useState, useEffect } from 'react';
import type {
  TecnicoResumen,
  CrearTecnicoRequest,
  ActualizarTecnicoRequest,
} from '../../../types';
import { X, RefreshCw, AlertCircle } from 'lucide-react';

interface TecnicoFormModalProps {
  isOpen: boolean;
  modo: 'crear' | 'editar';
  tecnicoAEditar?: TecnicoResumen | null;
  especialidades: string[];
  cargandoEspecialidades: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onCrear?: (data: CrearTecnicoRequest) => Promise<void>;
  onGuardarEdicion?: (data: ActualizarTecnicoRequest) => Promise<void>;
  onToggleEstado?: (tecnico: TecnicoResumen) => Promise<void>;
  togglingId?: number | null;
}

export const TecnicoFormModal: React.FC<TecnicoFormModalProps> = ({
  isOpen,
  modo,
  tecnicoAEditar,
  especialidades,
  cargandoEspecialidades,
  submitting,
  error,
  onClose,
  onCrear,
  onGuardarEdicion,
  onToggleEstado,
  togglingId,
}) => {
  // Form states
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [password, setPassword] = useState('');

  // Confirmación de suspensión / reactivación
  const [modalConfirmarEstado, setModalConfirmarEstado] = useState(false);
  const [accionConfirmar, setAccionConfirmar] = useState<'suspender' | 'reactivar' | null>(null);

  useEffect(() => {
    if (modo === 'editar' && tecnicoAEditar) {
      setNombreCompleto(tecnicoAEditar.nombreCompleto || '');
      setCorreo(tecnicoAEditar.correo || '');
      setTelefono(tecnicoAEditar.telefono || '');
      setEspecialidad(tecnicoAEditar.especialidad || (especialidades[0] || ''));
      setPassword('');
    } else {
      setNombreCompleto('');
      setCorreo('');
      setTelefono('');
      setEspecialidad(especialidades[0] || '');
      setPassword('');
    }
  }, [modo, tecnicoAEditar, especialidades, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'crear' && onCrear) {
      await onCrear({
        nombreCompleto: nombreCompleto.trim(),
        correo: correo.trim(),
        password: password.trim(),
        telefono: telefono.trim(),
        especialidad: especialidad.trim(),
      });
    } else if (modo === 'editar' && onGuardarEdicion) {
      const payload: ActualizarTecnicoRequest = {
        nombreCompleto: nombreCompleto.trim(),
        telefono: telefono.trim(),
        especialidad: especialidad.trim(),
      };
      if (password && password.trim().length >= 4) {
        payload.password = password.trim();
      }
      await onGuardarEdicion(payload);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto border border-slate-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="font-black text-base text-slate-900 block">
                {modo === 'crear' ? 'Registrar Técnico' : 'Editar Técnico'}
              </span>
              {modo === 'editar' && tecnicoAEditar && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {tecnicoAEditar.correo}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Apellidos y Nombres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej. Roberto Sánchez Gómez"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            {modo === 'crear' && (
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tecnico@asistencias247.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Teléfono {modo === 'crear' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="tel"
                  required={modo === 'crear'}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="987654321"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Especialidad <span className="text-red-500">*</span>
                </label>
                <select
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  {cargandoEspecialidades ? (
                    <option value="" disabled>Cargando especialidades...</option>
                  ) : especialidades.length === 0 ? (
                    <option value="" disabled>No hay especialidades registradas</option>
                  ) : (
                    especialidades.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                {modo === 'crear' ? (
                  <>Contraseña Inicial <span className="text-red-500">*</span></>
                ) : (
                  'Cambiar Contraseña (Opcional)'
                )}
              </label>
              <input
                type="password"
                required={modo === 'crear'}
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={modo === 'crear' ? 'Mínimo 4 caracteres' : 'Dejar en blanco para mantener la actual'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
              {modo === 'editar' && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Si no deseas cambiar la clave del técnico, déjalo vacío.
                </p>
              )}
            </div>

            {/* Toggle de Suspensión / Reactivación para modo Editar */}
            {modo === 'editar' && tecnicoAEditar && onToggleEstado && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-slate-700 uppercase text-[11px]">
                    Estado de la cuenta
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {tecnicoAEditar.activo !== false
                      ? 'Cuenta activa y habilitada'
                      : 'Cuenta inactiva / suspendida'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAccionConfirmar(tecnicoAEditar.activo !== false ? 'suspender' : 'reactivar');
                    setModalConfirmarEstado(true);
                  }}
                  disabled={togglingId === tecnicoAEditar.id}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    tecnicoAEditar.activo !== false
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {togglingId === tecnicoAEditar.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${tecnicoAEditar.activo !== false ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  )}
                  <span>{tecnicoAEditar.activo !== false ? 'Suspender Cuenta' : 'Reactivar Cuenta'}</span>
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{modo === 'crear' ? 'Registrar' : 'Guardar Cambios'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Confirmar Suspender / Reactivar */}
      {modalConfirmarEstado && tecnicoAEditar && accionConfirmar && onToggleEstado && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-black text-base text-slate-900">
                {accionConfirmar === 'suspender'
                  ? '¿Suspender cuenta técnica?'
                  : '¿Reactivar cuenta técnica?'}
              </span>
              <button
                type="button"
                onClick={() => setModalConfirmarEstado(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {accionConfirmar === 'suspender'
                ? `El técnico ${tecnicoAEditar.nombreCompleto} perderá el acceso a la app de asistencias y no podrá recibir nuevas órdenes de servicio.`
                : `El técnico ${tecnicoAEditar.nombreCompleto} volverá a tener acceso a la app y podrá recibir nuevas órdenes de servicio.`}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarEstado(false)}
                disabled={togglingId === tecnicoAEditar.id}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onToggleEstado(tecnicoAEditar);
                  setModalConfirmarEstado(false);
                }}
                disabled={togglingId === tecnicoAEditar.id}
                className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 ${
                  accionConfirmar === 'suspender'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                {togglingId === tecnicoAEditar.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : accionConfirmar === 'suspender' ? (
                  <span>Sí, suspender</span>
                ) : (
                  <span>Sí, reactivar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
