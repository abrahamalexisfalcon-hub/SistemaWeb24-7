import React, { useState, useEffect } from 'react';
import type {
  TecnicoResumen,
  CrearTecnicoRequest,
  ActualizarTecnicoRequest,
} from '../../../types';
import { X, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';

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
  // Estados limpios de formulario
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [pin, setPin] = useState('');
  const [mostrarPin, setMostrarPin] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Confirmación de suspensión / reactivación
  const [modalConfirmarEstado, setModalConfirmarEstado] = useState(false);
  const [accionConfirmar, setAccionConfirmar] = useState<'suspender' | 'reactivar' | null>(null);

  useEffect(() => {
    setLocalError(null);
    setMostrarPin(false);
    if (modo === 'editar' && tecnicoAEditar) {
      setNombreCompleto(tecnicoAEditar.nombreCompleto || '');
      setCorreo(tecnicoAEditar.correo || '');
      setTelefono((tecnicoAEditar.telefono || '').replace(/\D/g, '').slice(0, 9));
      setEspecialidad(tecnicoAEditar.especialidad || (especialidades[0] || ''));
      setPin('');
    } else {
      setNombreCompleto('');
      setCorreo('');
      setTelefono('');
      setEspecialidad(especialidades[0] || '');
      setPin('');
    }
  }, [modo, tecnicoAEditar, especialidades, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const telefonoLimpio = telefono.replace(/\D/g, '');
    const pinLimpio = pin.replace(/\D/g, '');

    if (!/^\d{9}$/.test(telefonoLimpio)) {
      setLocalError('El número de teléfono / celular debe contener exactamente 9 dígitos numéricos.');
      return;
    }

    if (modo === 'crear') {
      if (!/^\d{4}$/.test(pinLimpio)) {
        setLocalError('El PIN de acceso debe contener exactamente 4 dígitos numéricos.');
        return;
      }
      if (onCrear) {
        await onCrear({
          nombreCompleto: nombreCompleto.trim(),
          correo: correo.trim(),
          password: pinLimpio,
          telefono: telefonoLimpio,
          especialidad: especialidad.trim(),
        });
      }
    } else if (modo === 'editar' && onGuardarEdicion) {
      if (pinLimpio.length > 0 && !/^\d{4}$/.test(pinLimpio)) {
        setLocalError('Si deseas cambiar el PIN de acceso, debe tener exactamente 4 dígitos numéricos.');
        return;
      }
      const payload: ActualizarTecnicoRequest = {
        nombreCompleto: nombreCompleto.trim(),
        telefono: telefonoLimpio,
        especialidad: especialidad.trim(),
      };
      if (pinLimpio.length === 4) {
        payload.password = pinLimpio;
      }
      await onGuardarEdicion(payload);
    }
  };

  const errorMostrado = localError || error;

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
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMostrado && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMostrado}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3 text-xs">
            {/* Campos señuelo ocultos para evitar que Chrome/Edge inyecten credenciales guardadas */}
            <input type="text" name="fake_user_autofill" autoComplete="username" className="hidden" tabIndex={-1} />
            <input type="password" name="fake_pass_autofill" autoComplete="new-password" className="hidden" tabIndex={-1} />

            <div>
              <label htmlFor="tecnico_nombre" className="block font-bold text-slate-700 uppercase mb-1">
                NOMBRES Y APELLIDOS: <span className="text-red-500">*</span>
              </label>
              <input
                id="tecnico_nombre"
                name="tecnico_nombre"
                type="text"
                required
                autoComplete="off"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej. Roberto Sánchez Gómez"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            {modo === 'crear' && (
              <div>
                <label htmlFor="tecnico_correo" className="block font-bold text-slate-700 uppercase mb-1">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  id="tecnico_correo"
                  name="tecnico_correo"
                  type="email"
                  required
                  autoComplete="off"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tecnico@asistencias247.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="tecnico_telefono" className="block font-bold text-slate-700 uppercase mb-1">
                  Teléfono / Celular <span className="text-red-500">*</span>
                </label>
                <input
                  id="tecnico_telefono"
                  name="tecnico_telefono"
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  pattern="[0-9]{9}"
                  autoComplete="new-password"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="987654321"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label htmlFor="tecnico_especialidad" className="block font-bold text-slate-700 uppercase mb-1">
                  Especialidad <span className="text-red-500">*</span>
                </label>
                <select
                  id="tecnico_especialidad"
                  name="tecnico_especialidad"
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
              <label htmlFor="tecnico_pin" className="block font-bold text-slate-700 uppercase mb-1">
                {modo === 'crear' ? (
                  <>PIN DE ACCESO (4 DÍGITOS) <span className="text-red-500">*</span></>
                ) : (
                  'CAMBIAR PIN DE ACCESO (4 DÍGITOS)'
                )}
              </label>
              <div className="relative">
                <input
                  id="tecnico_pin"
                  name="tecnico_pin"
                  type={mostrarPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  autoComplete="new-password"
                  required={modo === 'crear'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={modo === 'crear' ? 'Ej: 1234' : 'Dejar vacío para mantener PIN actual'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 font-semibold text-slate-800 tracking-widest placeholder:tracking-normal focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPin((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  title={mostrarPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                >
                  {mostrarPin ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {modo === 'crear'
                  ? 'El técnico iniciará sesión con su Número de Celular y este PIN de 4 dígitos.'
                  : 'Si no deseas cambiar el PIN del técnico, déjalo vacío.'}
              </p>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
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
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
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
                className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
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
