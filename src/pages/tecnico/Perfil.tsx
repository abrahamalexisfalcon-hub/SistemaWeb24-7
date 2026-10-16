import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrdenes } from '../../context/OrdenesContext';
import { tecnicoApi } from '../../api';
import { TecnicoLayout, SignaturePad, type SignaturePadRef } from '../../components/tecnico';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { PerfilTecnico } from '../../types';
import {
  User,
  LogOut,
  Wrench,
  ShieldCheck,
  Mail,
  Phone,
  RefreshCw,
  PenTool,
  Check,
  Edit3,
  AlertCircle,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

export const Perfil: React.FC = () => {
  const { user, logout } = useAuth();
  const { notificacionesActivas, toggleNotificaciones } = useOrdenes();

  const [perfil, setPerfil] = useState<PerfilTecnico | null>(null);
  const [disponible, setDisponible] = useState<boolean>(user?.disponible ?? true);
  const [actualizando, setActualizando] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);

  // Estados para Firma Digital del Técnico
  const sigPadRef = useRef<SignaturePadRef>(null);
  const [editandoFirma, setEditandoFirma] = useState<boolean>(false);
  const [guardandoFirma, setGuardandoFirma] = useState<boolean>(false);
  const [errorFirma, setErrorFirma] = useState<string | null>(null);
  const [exitoFirma, setExitoFirma] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState<boolean>(false);

  // Cargar datos del perfil operativo al montar o al cambiar de usuario
  useEffect(() => {
    if (!user) return;
    setCargando(true);
    setEditandoFirma(false);
    setErrorFirma(null);
    setExitoFirma(null);

    tecnicoApi
      .getPerfil()
      .then((data) => {
        setPerfil(data);
        if (data.disponible !== undefined) {
          setDisponible(data.disponible);
        }
        const firma = data.firmaDigitalUrl || data.firmaUrl;
        if (firma) {
          localStorage.setItem(`tecnico_${user.usuarioId}_firma_url`, firma);
          localStorage.setItem('tecnico_firma_url', firma);
        } else {
          // El nuevo técnico no tiene firma: purgar residuos locales
          localStorage.removeItem(`tecnico_${user.usuarioId}_firma_url`);
          localStorage.removeItem('tecnico_firma_url');
        }
      })
      .catch((err) => {
        console.warn('Backend no disponible o modo offline para perfil:', err);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [user]);

  // Manejar cambio en el Switch de Disponibilidad
  const handleToggleDisponibilidad = async () => {
    const nuevoEstado = !disponible;
    setDisponible(nuevoEstado); // Actualización optimista
    setActualizando(true);

    try {
      const data = await tecnicoApi.actualizarDisponibilidad(nuevoEstado);
      if (data && data.disponible !== undefined) {
        setDisponible(data.disponible);
        setPerfil((prev) => (prev ? { ...prev, disponible: data.disponible } : null));
      }
      toast.success(
        nuevoEstado
          ? 'Disponibilidad activada: Listo para recibir órdenes'
          : 'Disponibilidad pausada: No recibirás nuevas asignaciones'
      );
    } catch (error) {
      console.error('Error al actualizar disponibilidad con el backend:', error);
      toast.error('No se pudo sincronizar la disponibilidad con el servidor');
    } finally {
      setActualizando(false);
    }
  };

  // Manejar guardado de firma digital en Cloudinary
  const handleGuardarFirma = async () => {
    const dataUrl = sigPadRef.current?.getSignature();
    if (!dataUrl || sigPadRef.current?.isEmpty()) {
      setErrorFirma('Por favor dibuja tu firma en el recuadro antes de guardar.');
      toast.error('Dibuja tu firma antes de guardar');
      return;
    }

    setGuardandoFirma(true);
    setErrorFirma(null);
    setExitoFirma(null);

    try {
      const data = await tecnicoApi.actualizarFirma(dataUrl);
      const nuevaUrl = data.firmaDigitalUrl || data.firmaUrl || dataUrl;
      setPerfil((prev) => (prev ? { ...prev, firmaUrl: nuevaUrl, firmaDigitalUrl: nuevaUrl } : null));
      if (user?.usuarioId) {
        localStorage.setItem(`tecnico_${user.usuarioId}_firma_url`, nuevaUrl);
      }
      localStorage.setItem('tecnico_firma_url', nuevaUrl);

      // Actualizar sesión almacenada en localStorage
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.firmaUrl = nuevaUrl;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch {}

      setEditandoFirma(false);
      setExitoFirma('Firma digital guardada correctamente.');
      toast.success('Firma digital guardada y sincronizada correctamente');
      setTimeout(() => setExitoFirma(null), 4000);
    } catch (err: any) {
      console.error('Error guardando firma:', err);
      const msg = err?.response?.data?.message || err?.message || 'No se pudo guardar la firma. Verifica tu conexión.';
      setErrorFirma(msg);
      toast.error(msg);
    } finally {
      setGuardandoFirma(false);
    }
  };

  const firmaActual =
    perfil?.firmaDigitalUrl ||
    perfil?.firmaUrl ||
    (user?.usuarioId ? localStorage.getItem(`tecnico_${user.usuarioId}_firma_url`) : null);
  const tieneFirma = Boolean(firmaActual);

  return (
    <TecnicoLayout activeTab="perfil">
      <div className="px-5 pt-5 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Mi Perfil
          </h1>
          {cargando && (
            <RefreshCw className="w-4 h-4 animate-spin text-[#0ea5e9]" />
          )}
        </div>

        {/* Módulo 1: Switch de Disponibilidad Operativa */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    disponible
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-400'
                  }`}
                />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {disponible ? 'Disponible para emergencias' : 'Fuera de turno'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 pl-4.5">
                {disponible
                  ? 'Activo para recibir servicios y asignaciones'
                  : 'En descanso / no disponible temporalmente'}
              </p>
            </div>

            {/* Toggle interactivo */}
            <button
              type="button"
              role="switch"
              aria-checked={disponible}
              onClick={handleToggleDisponibilidad}
              disabled={actualizando}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                disponible ? 'bg-[#0ea5e9]' : 'bg-slate-300'
              } ${actualizando ? 'opacity-60 cursor-wait' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  disponible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Módulo: Switch de Notificaciones Inmediatas en Tiempo Real (SSE + Sonido + Push) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    notificacionesActivas
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-300'
                  }`}
                />
                <Bell className={`w-4 h-4 ${notificacionesActivas ? 'text-[#0ea5e9]' : 'text-slate-400'}`} />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Notificaciones de nuevas órdenes
                </h3>
              </div>
              <p className="text-xs text-slate-500 pl-4.5">
                {notificacionesActivas
                  ? 'Alertas sonoras y visuales instantáneas al recibir asignaciones'
                  : 'Notificaciones pausadas temporalmente'}
              </p>
            </div>

            {/* Toggle interactivo */}
            <button
              type="button"
              role="switch"
              aria-checked={notificacionesActivas}
              onClick={() => toggleNotificaciones()}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notificacionesActivas ? 'bg-[#0ea5e9]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  notificacionesActivas ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Módulo 2: Mi Firma Digital (Registrada en Cloudinary) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#0ea5e9]" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Mi Firma Digital
              </h3>
            </div>
            {tieneFirma && !editandoFirma && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Registrada
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Esta firma se estampará automáticamente en el bloque "FIRMA DEL TÉCNICO" de la Hoja de Servicio al finalizar cada atención.
          </p>

          {exitoFirma && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{exitoFirma}</span>
            </div>
          )}

          {errorFirma && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorFirma}</span>
            </div>
          )}

          {tieneFirma && !editandoFirma ? (
            /* Vista de firma existente con previsualización */
            <div className="space-y-3 pt-1">
              <div className="h-28 w-full bg-slate-50/70 border border-slate-200 rounded-2xl flex items-center justify-center p-3 relative overflow-hidden">
                <img
                  src={firmaActual!}
                  alt="Firma digital del técnico"
                  className="max-h-24 max-w-full object-contain pointer-events-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditandoFirma(true);
                  setErrorFirma(null);
                  setExitoFirma(null);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Actualizar Firma</span>
              </button>
            </div>
          ) : (
            /* Modo dibujo / edición de firma */
            <div className="space-y-3 pt-1">
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <SignaturePad ref={sigPadRef} />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => sigPadRef.current?.clear()}
                  className="px-3.5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
                >
                  Limpiar
                </button>

                {tieneFirma && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditandoFirma(false);
                      setErrorFirma(null);
                    }}
                    className="px-3.5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGuardarFirma}
                  disabled={guardandoFirma}
                  className="flex-1 py-2.5 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.99] disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {guardandoFirma ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando en Cloudinary...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Guardar Firma</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Módulo 3: Tarjeta de Contacto con Central */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Central de Asistencias 24/7
            </h3>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
              Emergencias
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            ¿Incidencias en ruta o consultas con la central? Comunícate de inmediato con despacho.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Botón directo: Llamar a Central (tel:914279170) */}
            <a
              href="tel:914279170"
              className="py-3 px-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all text-center"
            >
              <Phone className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>Llamar Central</span>
            </a>

            {/* Botón directo: WhatsApp Central con asset oficial */}
            <a
              href="https://wa.me/51914279170?text=Hola,%20me%20comunico%20desde%20la%20app%20de%20técnico"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all text-center"
            >
              <img src="/whatsapp.svg" alt="WhatsApp" className="w-5 h-5 object-contain" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Tarjeta de Identidad Actual (Conservada fiel al diseño) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-sky-100 border-2 border-[#0ea5e9] flex items-center justify-center text-[#0ea5e9] shadow-inner">
            <User className="w-10 h-10 stroke-[2]" />
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {perfil?.nombreCompleto || user?.nombreCompleto || 'Luis Inca'}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#0ea5e9] text-xs font-bold border border-sky-100 mt-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>Técnico de Campo 24/7</span>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-left text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{perfil?.correo || user?.correo || 'tecnico@asistencias247.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Sesión activa</span>
            </div>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setLogoutDialogOpen(true)}
            className="w-full min-h-[52px] py-4 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-[0.99] rounded-2xl font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2 focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Modal de confirmación para cerrar sesión */}
        <ConfirmDialog
          isOpen={logoutDialogOpen}
          title="¿Cerrar Sesión?"
          message="Tendrás que ingresar tus credenciales nuevamente para acceder al panel técnico."
          confirmLabel="Sí, Cerrar Sesión"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={logout}
          onCancel={() => setLogoutDialogOpen(false)}
        />

        {/* Versión discreta al pie */}
        <div className="text-center pt-1 pb-3">
          <p className="text-[11px] font-medium text-slate-400 tracking-tight">
            24/7 Asistencias v1.0.0 (PWA)
          </p>
        </div>
      </div>
    </TecnicoLayout>
  );
};

export const PerfilScreen = Perfil;
