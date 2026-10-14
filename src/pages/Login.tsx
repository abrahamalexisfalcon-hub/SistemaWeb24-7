import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoNegro from '../assets/Logo_negro.png';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identificador, setIdentificador] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Normalización de correo o identificador de prueba
      let correoPayload = identificador.trim();
      if (!correoPayload.includes('@')) {
        if (correoPayload.toLowerCase() === 'tecnico' || correoPayload === '999888777') {
          correoPayload = 'tecnico@asistencias247.com';
        } else if (correoPayload.toLowerCase() === 'admin') {
          correoPayload = 'admin@asistencias247.com';
        }
      }

      const response = await login({
        correo: correoPayload,
        password: pin,
      });

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

  const handleFillDemo = (type: 'tecnico' | 'admin') => {
    if (type === 'tecnico') {
      setIdentificador('tecnico@asistencias247.com');
      setPin('tecnico123');
    } else {
      setIdentificador('admin@asistencias247.com');
      setPin('admin123');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-200/60 flex justify-center">
      {/* Contenedor móvil centrado max-w-md fiel al diseño de Figma */}
      <div className="w-full max-w-md min-h-screen bg-gradient-to-b from-slate-100/70 via-[#f8fafc] to-slate-100/70 flex flex-col justify-between p-6 pt-10 shadow-2xl border-x border-slate-100">
        {/* Sección Central: Logo Oficial e Inputs */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Imagen Oficial del Logo importada de assets con ancho responsivo y object-contain */}
          <img
            src={logoNegro}
            alt="24/7 Asistencias Generales"
            className="w-60 sm:w-56 mx-auto mb-8 object-contain drop-shadow-sm select-none"
          />

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Input Correo o Celular */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5 stroke-[1.8]" />
              </div>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Correo o celular"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/90 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] transition-all"
              />
            </div>

            {/* Input PIN / Contraseña */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5 stroke-[1.8]" />
              </div>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/90 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] transition-all"
              />
            </div>

            {/* Botón Primario Iniciar Sesión */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.99] text-white font-bold text-base rounded-2xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            {/* Enlace Olvidé mi contraseña */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => alert('Por favor, contacte al área de soporte o administración para restablecer sus accesos.')}
                className="text-[#0ea5e9] font-bold text-sm hover:underline tracking-tight"
              >
                Olvidé mi contraseña
              </button>
            </div>
          </form>
        </div>

        {/* Accesos rápidos de desarrollo */}
        <div className="pt-4 border-t border-slate-200/60 flex items-center justify-center gap-2">
          <span className="text-[11px] text-slate-400">Acceso rápido:</span>
          <button
            type="button"
            onClick={() => handleFillDemo('tecnico')}
            className="text-[11px] font-semibold text-sky-700 bg-sky-100/70 hover:bg-sky-200/70 px-2.5 py-1 rounded-lg transition-colors"
          >
            Técnico Demo
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('admin')}
            className="text-[11px] font-semibold text-slate-700 bg-slate-200/70 hover:bg-slate-300/70 px-2.5 py-1 rounded-lg transition-colors"
          >
            Admin Demo
          </button>
        </div>
      </div>
    </div>
  );
};
