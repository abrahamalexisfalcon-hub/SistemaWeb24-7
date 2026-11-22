import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Shield,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../../api';
import { useModalBackButton } from '../../../hooks';
import type { Usuario } from '../../../types';

interface PerfilAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario | null;
  onLogout: () => void;
}

const PerfilAdminModalContent: React.FC<Omit<PerfilAdminModalProps, 'isOpen'>> = ({
  onClose,
  user,
  onLogout,
}) => {
  const [mostrarFormPassword, setMostrarFormPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useModalBackButton(true, () => {
    if (!guardando) onClose();
  });

  const limpiarCamposPassword = () => {
    setPasswordActual('');
    setNuevaPassword('');
    setConfirmarPassword('');
    setVerActual(false);
    setVerNueva(false);
    setVerConfirmar(false);
    setError(null);
  };

  const handleToggleFormPassword = () => {
    if (guardando) return;
    if (mostrarFormPassword) {
      limpiarCamposPassword();
      setMostrarFormPassword(false);
    } else {
      limpiarCamposPassword();
      setExito(null);
      setMostrarFormPassword(true);
    }
  };

  const handleCancelarPassword = () => {
    if (guardando) return;
    limpiarCamposPassword();
    setMostrarFormPassword(false);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!passwordActual.trim()) {
      setError('Ingresa tu contraseña actual.');
      return;
    }
    if (nuevaPassword.trim().length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaPassword.trim() !== confirmarPassword.trim()) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (nuevaPassword.trim() === passwordActual.trim()) {
      setError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setGuardando(true);
    try {
      await adminApi.cambiarPasswordAdmin({
        passwordActual: passwordActual.trim(),
        nuevaPassword: nuevaPassword.trim(),
        confirmarPassword: confirmarPassword.trim(),
      });
      limpiarCamposPassword();
      setMostrarFormPassword(false);
      setExito('¡Contraseña actualizada correctamente!');
      toast.success('Contraseña de administrador actualizada correctamente.');
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; mensaje?: string } };
      };
      const msg =
        axiosErr?.response?.data?.message ||
        axiosErr?.response?.data?.mensaje ||
        'No se pudo actualizar la contraseña.';
      setError(msg);
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleSafeClose = () => {
    if (!guardando) onClose();
  };

  const modalElement = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop anclado al viewport */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs animate-in fade-in"
        onClick={handleSafeClose}
        aria-hidden="true"
      />

      <div
        className="relative z-[101] bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-100 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-black text-lg text-slate-900">Perfil Administrador</span>
          <button
            type="button"
            onClick={handleSafeClose}
            disabled={guardando}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 py-1">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
            <Shield className="w-7 h-7 text-[#0284c7]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-base truncate">
              {user?.nombreCompleto || 'Administrador'}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {user?.correo || 'admin@asistencias247.com'}
            </p>
            <span className="inline-block px-2 py-0.5 mt-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
              ADMINISTRADOR
            </span>
          </div>
        </div>

        {/* Banner de éxito tras actualizar contraseña */}
        {exito && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exito}</span>
          </div>
        )}

        {/* Sección de Seguridad: Cambiar Contraseña */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <button
            type="button"
            onClick={handleToggleFormPassword}
            disabled={guardando}
            className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border ${
              mostrarFormPassword
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4 text-sky-600" />
            <span>Cambiar Contraseña</span>
          </button>

          {mostrarFormPassword && (
            <form
              onSubmit={handleSubmitPassword}
              noValidate
              className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150"
            >
              {/* Contraseña Actual */}
              <div>
                <label
                  htmlFor="admin-password-actual"
                  className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
                >
                  Contraseña Actual <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin-password-actual"
                    type={verActual ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={passwordActual}
                    disabled={guardando}
                    onChange={(e) => {
                      setPasswordActual(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ingresa tu contraseña actual"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-10 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setVerActual((prev) => !prev)}
                    aria-label={verActual ? 'Ocultar contraseña actual' : 'Ver contraseña actual'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {verActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label
                  htmlFor="admin-password-nueva"
                  className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
                >
                  Nueva Contraseña <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin-password-nueva"
                    type={verNueva ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={nuevaPassword}
                    disabled={guardando}
                    onChange={(e) => {
                      setNuevaPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-10 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setVerNueva((prev) => !prev)}
                    aria-label={verNueva ? 'Ocultar nueva contraseña' : 'Ver nueva contraseña'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {verNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label
                  htmlFor="admin-password-confirmar"
                  className="block text-[11px] font-bold text-slate-700 uppercase mb-1"
                >
                  Confirmar Nueva Contraseña <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin-password-confirmar"
                    type={verConfirmar ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmarPassword}
                    disabled={guardando}
                    onChange={(e) => {
                      setConfirmarPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Repite la nueva contraseña"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-10 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setVerConfirmar((prev) => !prev)}
                    aria-label={
                      verConfirmar ? 'Ocultar confirmación de contraseña' : 'Ver confirmación de contraseña'
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {verConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelarPassword}
                  disabled={guardando}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {guardando && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
                  <span>{guardando ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <p>24/7 Asistencias Generales S.A.C.</p>
          <p className="text-[11px] text-slate-400">Versión 1.0.0 (PWA)</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={guardando}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};

export const PerfilAdminModal: React.FC<PerfilAdminModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <PerfilAdminModalContent
      onClose={onClose}
      user={user}
      onLogout={onLogout}
    />
  );
};
