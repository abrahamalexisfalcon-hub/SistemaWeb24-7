import React, { useState, useEffect } from 'react';
import type {
  TecnicoResumen,
  CrearTecnicoRequest,
  ActualizarTecnicoRequest,
} from '../../../types';
import { X, RefreshCw, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { obtenerEspecialidadesTecnico } from '../../../utils/tecnicoEspecialidades';
import { useModalBackButton } from '../../../hooks';

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
  onToggleEstado?: (tecnico: TecnicoResumen) => Promise<boolean | void>;
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
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState<string[]>([]);
  const [pin, setPin] = useState('');
  const [mostrarPin, setMostrarPin] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Confirmación de suspensión / reactivación
  const [modalConfirmarEstado, setModalConfirmarEstado] = useState(false);
  const [accionConfirmar, setAccionConfirmar] = useState<'suspender' | 'reactivar' | null>(null);

  useModalBackButton(isOpen, () => {
    if (!submitting) onClose();
  });
  useModalBackButton(modalConfirmarEstado, () => {
    if (!togglingId) {
      setModalConfirmarEstado(false);
      setAccionConfirmar(null);
    }
  });

  useEffect(() => {
    setLocalError(null);
    setMostrarPin(false);
    if (modo === 'editar' && tecnicoAEditar) {
      setNombreCompleto(tecnicoAEditar.nombreCompleto || '');
      setCorreo(tecnicoAEditar.correo || '');
      setTelefono((tecnicoAEditar.telefono || '').replace(/\D/g, '').slice(0, 9));
      const inicial = obtenerEspecialidadesTecnico(tecnicoAEditar, []).map(
        (item) => especialidades.find((esp) => esp.toLowerCase() === item.toLowerCase()) || item
      );
      setEspecialidadesSeleccionadas(
        inicial.length > 0
          ? Array.from(new Set(inicial))
          : especialidades.length > 0
            ? [especialidades[0]]
            : []
      );
      setPin('');
    } else {
      setNombreCompleto('');
      setCorreo('');
      setTelefono('');
      setEspecialidadesSeleccionadas(especialidades[0] ? [especialidades[0]] : []);
      setPin('');
    }
  }, [modo, tecnicoAEditar, especialidades, isOpen]);

  if (!isOpen) return null;

  const estaEspecialidadSeleccionada = (nombre: string) =>
    especialidadesSeleccionadas.some((item) => item.toLowerCase() === nombre.toLowerCase());

  const toggleEspecialidad = (nombre: string) => {
    setLocalError(null);
    setEspecialidadesSeleccionadas((prev) => {
      const existe = prev.some((item) => item.toLowerCase() === nombre.toLowerCase());
      if (existe) {
        return prev.filter((item) => item.toLowerCase() !== nombre.toLowerCase());
      }
      return [...prev, nombre];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const telefonoLimpio = telefono.replace(/\D/g, '');
    const pinLimpio = pin.replace(/\D/g, '');

    if (!/^\d{9}$/.test(telefonoLimpio)) {
      setLocalError('El número de teléfono / celular debe contener exactamente 9 dígitos numéricos.');
      return;
    }

    if (especialidadesSeleccionadas.length === 0) {
      setLocalError('Selecciona al menos una especialidad.');
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
          especialidad: especialidadesSeleccionadas.join(', '),
          especialidades: especialidadesSeleccionadas,
        });
      }
    } else if (modo === 'editar' && onGuardarEdicion) {
      if (!correo.trim()) {
        setLocalError('El correo electrónico es obligatorio.');
        return;
      }
      if (pinLimpio.length > 0 && !/^\d{4}$/.test(pinLimpio)) {
        setLocalError('Si deseas cambiar el PIN de acceso, debe tener exactamente 4 dígitos numéricos.');
        return;
      }
      const payload: ActualizarTecnicoRequest = {
        nombreCompleto: nombreCompleto.trim(),
        correo: correo.trim().toLowerCase(),
        telefono: telefonoLimpio,
        especialidad: especialidadesSeleccionadas.join(', '),
        especialidades: especialidadesSeleccionadas,
      };
      if (pinLimpio.length === 4) {
        payload.password = pinLimpio;
      }
      await onGuardarEdicion(payload);
    }
  };

  const errorMostrado = localError || error;
  const cantidadSeleccionadasTexto =
    especialidadesSeleccionadas.length === 1
      ? '1 seleccionada'
      : `${especialidadesSeleccionadas.length} seleccionadas`;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5 max-h-[88vh] overflow-y-auto border border-slate-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="font-black text-base text-slate-900 block">
                {modo === 'crear' ? 'Registrar Técnico' : 'Editar Técnico'}
              </span>
              {modo === 'editar' && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {correo || tecnicoAEditar?.correo}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label htmlFor="tecnico_telefono" className="block font-bold text-slate-700 uppercase">
                    Teléfono / Celular <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {telefono.length}/9
                  </span>
                </div>
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
                  onChange={(e) => {
                    setLocalError(null);
                    setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9));
                  }}
                  placeholder="987654321"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label htmlFor="tecnico_pin" className="block font-bold text-slate-700 uppercase mb-1">
                  {modo === 'crear' ? (
                    <>PIN DE ACCESO (4 DÍGITOS) <span className="text-red-500">*</span></>
                  ) : (
                    'PIN DE ACCESO (OPCIONAL)'
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
                    placeholder={modo === 'crear' ? 'Ej: 1234' : 'Mantener actual'}
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
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  {modo === 'crear'
                    ? 'Iniciará sesión con su celular y este PIN.'
                    : 'Déjalo vacío para mantener el PIN actual.'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="block font-bold text-slate-700 uppercase">
                  ESPECIALIDADES <span className="text-red-500">*</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    especialidadesSeleccionadas.length > 0
                      ? 'bg-[#2b7de9]/10 text-[#2b7de9] border-[#2b7de9]/25'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {cantidadSeleccionadasTexto}
                </span>
              </div>

              {especialidadesSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {especialidadesSeleccionadas.map((esp) => (
                    <span
                      key={esp}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2b7de9]/10 text-[#2b7de9] border border-[#2b7de9]/25"
                    >
                      <Check className="w-3 h-3 shrink-0" />
                      <span>{esp}</span>
                      <button
                        type="button"
                        onClick={() => toggleEspecialidad(esp)}
                        aria-label={`Quitar ${esp}`}
                        className="p-0.5 rounded-full hover:bg-[#2b7de9]/15 text-[#2b7de9] transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                {cargandoEspecialidades ? (
                  <span className="text-[11px] text-slate-400 font-medium py-1">
                    Cargando especialidades...
                  </span>
                ) : especialidades.length === 0 ? (
                  <span className="text-[11px] text-slate-400 font-medium py-1">
                    No hay especialidades registradas
                  </span>
                ) : (
                  especialidades.map((esp) => {
                    const seleccionada = estaEspecialidadSeleccionada(esp);
                    return (
                      <button
                        key={esp}
                        type="button"
                        onClick={() => toggleEspecialidad(esp)}
                        aria-pressed={seleccionada}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          seleccionada
                            ? 'bg-[#2b7de9] text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-[#2b7de9]/40 hover:text-[#2b7de9]'
                        }`}
                      >
                        {seleccionada && <Check className="w-3 h-3 shrink-0" />}
                        <span>{esp}</span>
                      </button>
                    );
                  })
                )}
              </div>

              <p className="text-[10px] text-slate-400 mt-1">
                Puedes seleccionar una o varias especialidades para este técnico.
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
                  try {
                    const ok = await onToggleEstado(tecnicoAEditar);
                    setModalConfirmarEstado(false);
                    setAccionConfirmar(null);
                    if (ok !== false) {
                      onClose();
                    }
                  } catch {
                    setModalConfirmarEstado(false);
                    setAccionConfirmar(null);
                  }
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
