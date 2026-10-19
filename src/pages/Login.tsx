import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoBlanco from '../assets/Logo_blanco.png';
import { Mail, Lock, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const REMEMBER_EMAIL_KEY = 'asistencias247_remembered_email';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [identificador, setIdentificador] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [pin, setPin] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBER_EMAIL_KEY));
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('motivo') === 'inactividad') {
      setError('Tu sesión expiró por inactividad (30 minutos). Por favor, vuelve a ingresar.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const correoPayload = identificador.trim();

      const response = await login({
        correo: correoPayload,
        password: pin,
      });

      try {
        if (recordarme) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, correoPayload);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // Ignorar si el almacenamiento está restringido
      }

      if (response.rol === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/tecnico/ordenes', { replace: true });
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Credenciales inválidas');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-950 text-white overflow-y-auto relative selection:bg-sky-500 selection:text-white">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tarjeta Bento Principal Unificada y Fluida */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl rounded-3xl lg:rounded-[2.5rem] overflow-hidden border border-slate-800/80 bg-[#0d121d] shadow-2xl flex flex-col lg:grid lg:grid-cols-2 my-auto relative z-10">
        
        {/* Panel de Branding e Imagen (Arriba en móvil/tablet, Izquierda en desktop) */}
        <div className="w-full h-56 sm:h-64 lg:h-auto lg:min-h-[580px] lg:m-2.5 lg:rounded-3xl lg:border lg:border-slate-800/50 p-6 sm:p-8 lg:p-10 relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-slate-900 via-sky-950/60 to-slate-950 border-b lg:border-b-0 border-slate-800/60 select-none">
          
          {/* Fondo con onda fluida abstracta en tonos corporativos (Sky, Cyan, Indigo, Deep Navy) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="w-full h-full object-cover scale-110"
              viewBox="0 0 500 700"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="waveGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.95" />
                  <stop offset="55%" stopColor="#818cf8" stopOpacity="0.75" />
                  <stop offset="80%" stopColor="#0ea5e9" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="waveGradPrism" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="30%" stopColor="#60a5fa" stopOpacity="0.7" />
                  <stop offset="65%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
                </linearGradient>
                <radialGradient id="ambientGlow" cx="85%" cy="15%" r="65%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="45%" stopColor="#0284c7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <filter id="waveBlur">
                  <feGaussianBlur stdDeviation="30" />
                </filter>
                <filter id="softGlow">
                  <feGaussianBlur stdDeviation="15" />
                </filter>
              </defs>

              {/* Base azul oscura profunda */}
              <rect width="100%" height="100%" fill="#050811" />
              <rect width="100%" height="100%" fill="url(#ambientGlow)" />

              {/* Formas orgánicas de cinta fluida */}
              <path
                d="M -50,-20 C 120,80 320,60 550,260 L 550,-50 Z"
                fill="url(#waveGradCyan)"
                opacity="0.3"
                filter="url(#waveBlur)"
              />
              <path
                d="M -30,220 C 180,140 330,360 530,290 L 530,120 C 360,200 170,90 -30,150 Z"
                fill="url(#waveGradCyan)"
                opacity="0.85"
              />
              <path
                d="M -40,260 C 170,190 310,390 530,330 L 530,270 C 330,350 170,170 -40,210 Z"
                fill="url(#waveGradPrism)"
                opacity="0.95"
              />
              <path
                d="M -40,300 C 160,250 280,430 530,370 L 530,320 C 310,390 170,230 -40,270 Z"
                fill="#38bdf8"
                opacity="0.6"
                filter="url(#softGlow)"
              />
            </svg>
          </div>

          {/* Capa de degradado interna */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Superior: Logotipo Oficial 24/7 Asistencias con Gran Presencia */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="p-1 lg:p-2">
              <img
                src={logoBlanco}
                alt="24/7 Asistencias"
                className="h-16 sm:h-20 lg:h-24 xl:h-28 w-auto max-w-[200px] sm:max-w-[240px] lg:max-w-none object-contain drop-shadow-lg mb-2 lg:mb-4 select-none"
              />
            </div>
            <div className="lg:hidden mt-2">
              <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
                24/7 Asistencias
              </span>
            </div>
          </div>

          {/* Inferior: Frase institucional */}
          <div className="relative z-10 pt-4 sm:pt-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Tu Operación en <span className="text-sky-400 block">Tiempo Real</span>
            </h2>
          </div>
        </div>

        {/* Panel del Formulario (Abajo en móvil/tablet, Derecha en desktop) */}
        <div className="w-full p-6 sm:p-8 lg:p-12 flex flex-col justify-center space-y-5 bg-[#0d121d]">
          <div className="w-full max-w-sm mx-auto space-y-5">
            {/* Encabezado */}
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Login
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Ingresa tus credenciales para acceder a tu cuenta
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Input Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4 stroke-[2]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="correo@asistencias247.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#161d2d] border border-slate-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4 stroke-[2]" />
                  </div>
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-[#161d2d] border border-slate-700/60 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors cursor-pointer"
                    title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {mostrarPassword ? (
                      <EyeOff className="w-4 h-4 stroke-[2]" />
                    ) : (
                      <Eye className="w-4 h-4 stroke-[2]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Fila Recordarme / Olvidé contraseña */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={recordarme}
                    onChange={(e) => setRecordarme(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-sky-500"
                  />
                  <span>Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={() => toast.info('Por favor, contacte al área de soporte o administración para restablecer sus accesos.')}
                  className="text-sky-400 hover:text-sky-300 hover:underline cursor-pointer focus:outline-none"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Botón Principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] mt-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/20 transition-all text-sm flex items-center justify-center cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.99] focus:outline-none"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

