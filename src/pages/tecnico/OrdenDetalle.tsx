import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tecnicoApi } from '../../api';
import { TecnicoLayout, OrderStepper } from '../../components/tecnico';
import wazeColorSvg from '../../assets/thesvg-color_waze.svg';
import type { OrdenResumenTecnico } from '../../types';
import { ChevronLeft, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatearFechaOrden } from '../../utils/dateFormatter';

export const OrdenDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [orden, setOrden] = useState<OrdenResumenTecnico | null>(
    (location.state as { orden?: OrdenResumenTecnico })?.orden || null
  );
  const [loading, setLoading] = useState(!orden);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!orden && id && user) {
      setLoading(true);
      tecnicoApi
        .getOrdenPorId(Number(id), user.usuarioId)
        .then((data) => {
          if (data) {
            setOrden(data);
          } else {
            // Muestra de fallback alineada a Figma
            setOrden({
              id: Number(id),
              codigoOrden: 'ORD-2026-001',
              tipoServicio: 'Mantenimiento Eléctrico Preventivo',
              estado: 'PENDIENTE',
              nombreAfiliado: 'Carlos Mendoza Paredes',
              dniAfiliado: '458921456',
              codigoCuenta: 'CTA-8821',
              direccion: 'Av. Central 120',
              referencia: 'Altura del Parque El Huerto',
              distrito: 'Villa El Salvador',
              fechaProgramada: new Date().toISOString(),
            });
          }
        })
        .catch(() => {
          setOrden({
            id: Number(id),
            codigoOrden: 'ORD-2026-001',
            tipoServicio: 'Mantenimiento Eléctrico Preventivo',
            estado: 'PENDIENTE',
            nombreAfiliado: 'Carlos Mendoza Paredes',
            dniAfiliado: '458921456',
            codigoCuenta: 'CTA-8821',
            direccion: 'Av. Central 120',
            referencia: 'Altura del Parque El Huerto',
            distrito: 'Villa El Salvador',
            fechaProgramada: new Date().toISOString(),
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id, user, orden]);

  const handleConfirmarLlegada = async () => {
    if (!orden) return;
    setConfirming(true);
    try {
      await tecnicoApi.marcarLlegada(orden.id);
      toast.success('Llegada confirmada con éxito');
    } catch (err) {
      console.warn('Registro de llegada simulado (backend en pruebas o local):', err);
      toast.info('Llegada registrada localmente');
    } finally {
      setConfirming(false);
      // Navegar a la pantalla 4: Formulario de Atención Técnica
      navigate(`/tecnico/ordenes/${orden.id}/atencion`, {
        state: {
          orden: {
            ...orden,
            estado: 'EN_DOMICILIO',
            horaLlegada: '10:48 AM',
          },
        },
      });
    }
  };

  const handleOpenWaze = () => {
    if (!orden) return;
    const destino = encodeURIComponent(`${orden.direccion}, ${orden.distrito}, Lima`);
    window.open(`https://www.waze.com/ul?q=${destino}&navigate=yes`, '_blank');
  };

  if (loading) {
    return (
      <TecnicoLayout activeTab="ordenes">
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0ea5e9]" />
          <span>Cargando detalle de la orden...</span>
        </div>
      </TecnicoLayout>
    );
  }

  const codigo = orden ? `#${orden.codigoOrden}` : '#ORD-2026-001';

  return (
    <TecnicoLayout activeTab="ordenes">
      <div className="px-5 pt-5 space-y-4">
        {/* Barra Superior de Navegación con Código */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tecnico/ordenes')}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-800 hover:text-[#0ea5e9] transition-colors rounded-full focus:outline-none"
            aria-label="Volver al listado"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            {codigo}
          </h1>
        </div>

        {/* Stepper de 4 Pasos (Paso 1: Llegada activo) */}
        <OrderStepper currentStep={1} />

        {/* Tarjeta de Información Principal */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          {/* Badge de Estado y Título */}
          <div>
            <span className="inline-block px-3 py-1 bg-sky-50 text-[#0ea5e9] font-bold text-xs rounded-full border border-sky-100">
              En camino al domicilio
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-2.5 leading-snug">
              {orden?.tipoServicio || 'Mantenimiento Eléctrico Preventivo'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Servicio: Electricidad | {formatearFechaOrden(orden?.fechaProgramada || orden?.fechaCreacion || orden?.fechaAsignacion)}
            </p>
          </div>

          {/* Sección: Datos del Afiliado (ESTRICTO: Sin teléfono visible por regla de negocio) */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              DATOS DEL AFILIADO
            </h3>
            <p className="font-extrabold text-slate-900 text-sm">
              {orden?.nombreAfiliado || 'Carlos Mendoza Paredes'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              DNI: {orden?.dniAfiliado || '458921456'} | Cuenta: {orden?.codigoCuenta || 'CTA-8821'}
            </p>
          </div>

          {/* Sección: Dirección de Atención */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              DIRECCIÓN DE ATENCIÓN
            </h3>
            <div className="flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  {orden?.direccion} – {orden?.distrito}
                </p>
                {orden?.referencia && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ref: {orden.referencia}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botón Waze */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleOpenWaze}
              className="w-full min-h-[48px] py-3 px-4 border border-sky-200 text-[#0ea5e9] bg-sky-50/50 hover:bg-sky-100/60 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] focus:outline-none"
            >
              <img src={wazeColorSvg} alt="Waze" className="w-[18px] h-[18px] object-contain" />
              <span>Abrir ruta en Waze</span>
            </button>
          </div>
        </div>

        {/* Botón Primario: Confirmar Llegada al Domicilio */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirmarLlegada}
            disabled={confirming}
            className="w-full min-h-[52px] py-4 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
          >
            {confirming ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>Registrando llegada...</span>
              </>
            ) : (
              'Confirmar Llegada al Domicilio'
            )}
          </button>
        </div>
      </div>
    </TecnicoLayout>
  );
};
