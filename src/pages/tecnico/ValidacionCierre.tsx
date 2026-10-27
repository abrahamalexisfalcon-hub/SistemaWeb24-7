import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrdenes } from '../../context/OrdenesContext';
import { tecnicoApi } from '../../api';
import { TecnicoLayout, OrderStepper, SignaturePad, type SignaturePadRef } from '../../components/tecnico';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { comprimirImagenConDetalle } from '../../utils/imageCompression';
import { formatearHoraLocal, calcularDuracionServicio } from '../../utils/dateFormatter';
import type { OrdenResumenTecnico, CierreHojaServicioRequest } from '../../types';
import { ChevronLeft, Camera, Image as ImageIcon, Star, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const ValidacionCierre: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { actualizarOrdenLocal, invalidarCache } = useOrdenes();

  const stateData = location.state as {
    orden?: OrdenResumenTecnico;
    formulario?: {
      evaluacionAveria: string;
      detalleSolucion: string;
      sugerencias: string;
      materiales: Array<{ materialId?: number | null; descripcion?: string | null; cantidad: number }>;
    };
  } | undefined;

  const [orden, setOrden] = useState<OrdenResumenTecnico | undefined>(stateData?.orden);
  const formularioPrevio = stateData?.formulario;

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    tecnicoApi
      .getDetalleOrden(Number(id))
      .then((data) => {
        if (!mounted || !data) return;
        setOrden((prev) => ({
          ...prev,
          ...data,
          fechaLlegada: data.fechaLlegada || data.horaLlegada || prev?.fechaLlegada,
        }));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [id]);

  const sigPadRef = useRef<SignaturePadRef>(null);

  // Evidencias fotográficas (captura / preview)
  const [fotoInicial, setFotoInicial] = useState<string | null>(null);
  const [fotoFinal, setFotoFinal] = useState<string | null>(null);
  const [comprimiendoInicial, setComprimiendoInicial] = useState<boolean>(false);
  const [comprimiendoFinal, setComprimiendoFinal] = useState<boolean>(false);

  // Calificaciones
  const [califPuntualidad, setCalifPuntualidad] = useState(5);
  const [califSolucion, setCalifSolucion] = useState(5);

  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraInputInicialRef = useRef<HTMLInputElement>(null);
  const galleryInputInicialRef = useRef<HTMLInputElement>(null);
  const cameraInputFinalRef = useRef<HTMLInputElement>(null);
  const galleryInputFinalRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    setLoadingState: (loading: boolean) => void,
    tipo: 'inicial' | 'final'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingState(true);
    try {
      const { base64Url, pesoFinalKB } = await comprimirImagenConDetalle(file, 1280, 1280, 0.72);
      setter(base64Url);
      toast.success(
        `Foto ${tipo === 'inicial' ? 'inicial' : 'final'} optimizada (${pesoFinalKB} KB)`,
        { duration: 3000 }
      );
    } catch (err) {
      console.warn('Error al procesar la imagen:', err);
      toast.error('No se pudo procesar la imagen seleccionada');
    } finally {
      setLoadingState(false);
      e.target.value = '';
    }
  };

  const ordenId = Number(id) || orden?.id || 1;
  const DRAFT_KEY = `borrador_atencion_${ordenId}`;

  // Si no viene en el state, intentar recuperar desde el borrador guardado en localStorage
  const formularioEfectivo = formularioPrevio || (() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const listaMateriales = (parsed.materialesSeleccionados || []).map((m: {
          materialId?: number | null;
          descripcion?: string | null;
          cantidad?: number;
          esPersonalizado?: boolean;
        }) => ({
          materialId: m.esPersonalizado ? null : m.materialId,
          descripcion: m.esPersonalizado ? m.descripcion : null,
          cantidad: m.cantidad || 1,
        }));
        if (listaMateriales.length === 0 && parsed.descripcionMateriales?.trim()) {
          listaMateriales.push({
            materialId: null,
            descripcion: parsed.descripcionMateriales.trim(),
            cantidad: 1,
          });
        }
        return {
          evaluacionAveria: parsed.evaluacion || '',
          detalleSolucion: parsed.solucion || '',
          sugerencias: parsed.sugerencias || '',
          materiales: listaMateriales,
        };
      }
    } catch (e) {
      console.error('Error recuperando borrador en cierre:', e);
    }
    return undefined;
  })();

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fotoInicial || !fotoFinal) {
      const msg = 'Debes adjuntar obligatoriamente la foto de antes y la foto de después del servicio.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (sigPadRef.current?.isEmpty()) {
      toast.error('Por favor solicita la firma del afiliado antes de finalizar.');
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleFinalizar = async () => {
    if (!fotoInicial || !fotoFinal) {
      const msg = 'Debes adjuntar obligatoriamente la foto de antes y la foto de después del servicio.';
      setError(msg);
      toast.error(msg);
      setConfirmDialogOpen(false);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const signatureDataUrl = sigPadRef.current?.getSignature() || 'data:image/png;base64,mockSignature';
      const promedioCalificacion = Math.round((califPuntualidad + califSolucion) / 2);

      const tecnicoFirmaUrl = (() => {
        try {
          const userKey = user?.usuarioId ? `tecnico_${user.usuarioId}_firma_url` : null;
          const userFirma = userKey ? localStorage.getItem(userKey) : null;
          if (userFirma) return userFirma;

          const storedFirma = localStorage.getItem('tecnico_firma_url');
          if (storedFirma) return storedFirma;
          const raw = sessionStorage.getItem('auth_user') || sessionStorage.getItem('user');
          if (raw) return JSON.parse(raw).firmaUrl || null;
        } catch {}
        return orden?.tecnicoFirmaUrl || null;
      })();

      const requestPayload: CierreHojaServicioRequest = {
        evaluacionAveria: formularioEfectivo?.evaluacionAveria || 'Mantenimiento preventivo completado satisfactoriamente.',
        detalleSolucion: formularioEfectivo?.detalleSolucion || 'Reemplazo y ajuste de componentes defectuosos.',
        sugerencias: formularioEfectivo?.sugerencias || 'Revisión técnica periódica recomendada.',
        calificacion: promedioCalificacion,
        calificacionAfiliado: promedioCalificacion,
        fotoInicialUrl: fotoInicial || undefined,
        fotoAntesUrl: fotoInicial || undefined,
        fotoFinalUrl: fotoFinal || undefined,
        fotoDespuesUrl: fotoFinal || undefined,
        firmaDigitalUrl: signatureDataUrl,
        firmaAfiliadoUrl: signatureDataUrl,
        firmaTecnicoUrl: tecnicoFirmaUrl || undefined,
        tecnicoFirmaUrl: tecnicoFirmaUrl || undefined,
        materiales: formularioEfectivo?.materiales || [],
      };

      // 1. Esperar obligatoriamente la resolución exitosa del backend
      const cierreRes = await tecnicoApi.cerrarOrden(ordenId, requestPayload);
      const firmaClienteUrl = cierreRes?.firmaDigitalUrl || cierreRes?.firmaAfiliadoUrl || signatureDataUrl;
      const fechaLlegadaFinal = cierreRes?.fechaLlegada || orden?.fechaLlegada || orden?.horaLlegada;
      const fechaFinFinal = cierreRes?.fechaFinalizacion || new Date().toISOString();
      const duracionFinal = calcularDuracionServicio(fechaLlegadaFinal, fechaFinFinal);

      if (firmaClienteUrl) {
        try {
          localStorage.setItem(`orden_${ordenId}_firma_cliente`, firmaClienteUrl);
        } catch {}
      }

      // Invalida y actualiza en memoria para transición 0 ms a "Finalizada"
      actualizarOrdenLocal({
        id: ordenId,
        estado: 'FINALIZADA',
        fechaLlegada: fechaLlegadaFinal,
        fechaFinalizacion: fechaFinFinal,
        firmaDigitalUrl: firmaClienteUrl,
        firmaAfiliadoUrl: firmaClienteUrl,
      });
      invalidarCache();

      // 2. Limpieza de borrador tras confirmación de éxito del servidor
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(`borrador_atencion_${ordenId}`);

      // 3. Registrar orden en caché local de finalizadas para reactividad inmediata
      try {
        const cacheKey = user?.usuarioId ? `ordenes_finalizadas_ids_${user.usuarioId}` : 'ordenes_finalizadas_ids';
        const finalizadasRaw = localStorage.getItem(cacheKey) || '[]';
        const finalizadasIds: number[] = JSON.parse(finalizadasRaw);
        if (!finalizadasIds.includes(ordenId)) {
          finalizadasIds.push(ordenId);
          localStorage.setItem(cacheKey, JSON.stringify(finalizadasIds));
          localStorage.setItem('ordenes_finalizadas_ids', JSON.stringify(finalizadasIds));
        }
      } catch (cacheErr) {
        console.warn('Error guardando cache local de orden finalizada:', cacheErr);
      }

      // 4. Navegar a la pantalla de éxito con estado FINALIZADA garantizado
      const tecnicoNombre = (() => {
        if (user?.nombreCompleto) return user.nombreCompleto;
        try {
          const raw = sessionStorage.getItem('auth_user') || sessionStorage.getItem('user');
          if (raw) return JSON.parse(raw).nombreCompleto || 'Técnico';
        } catch { /* ignore */ }
        return orden?.tecnicoNombre || 'Técnico Asistencias 24/7';
      })();

      const isMockUrl = (url?: string | null) =>
        !url ||
        url.includes('images.unsplash.com') ||
        url.includes('placeholder');

      const fotoInicialServidor = (!isMockUrl(cierreRes?.fotoInicialUrl) ? cierreRes?.fotoInicialUrl : undefined) ||
        (!isMockUrl(requestPayload.fotoInicialUrl) ? requestPayload.fotoInicialUrl : undefined);
      const fotoFinalServidor = (!isMockUrl(cierreRes?.fotoFinalUrl) ? cierreRes?.fotoFinalUrl : undefined) ||
        (!isMockUrl(requestPayload.fotoFinalUrl) ? requestPayload.fotoFinalUrl : undefined);

      const rawEvidencias = (cierreRes?.fotosEvidencia && cierreRes.fotosEvidencia.length > 0)
        ? cierreRes.fotosEvidencia
        : [fotoInicialServidor, fotoFinalServidor];

      const fotosServidor: string[] = Array.from(
        new Set(rawEvidencias.filter((f): f is string => Boolean(f && typeof f === 'string' && f.trim() && !isMockUrl(f))))
      );

      navigate(`/tecnico/ordenes/${ordenId}/exito`, {
        replace: true,
        state: {
          orden: {
            ...orden,
            id: ordenId,
            codigoOrden: orden?.codigoOrden || 'ORD-2026-001',
            nombreAfiliado: orden?.nombreAfiliado || 'Carlos Mendoza Paredes',
            tipoServicio: orden?.tipoServicio || 'Mantenimiento Eléctrico Preventivo',
            direccion: orden?.direccion || 'Av. Central 120',
            distrito: orden?.distrito || 'Villa El Salvador',
            dniAfiliado: orden?.dniAfiliado || '',
            codigoCuenta: orden?.codigoCuenta || '',
            fechaLlegada: fechaLlegadaFinal,
            fechaFinalizacion: fechaFinFinal,
            tecnicoNombre,
            tecnicoFirmaUrl,
            firmaDigitalUrl: firmaClienteUrl,
            firmaAfiliadoUrl: firmaClienteUrl,
            fotoInicialUrl: fotoInicialServidor,
            fotoFinalUrl: fotoFinalServidor,
            fotosEvidencia: fotosServidor,
            estado: 'FINALIZADA',
          },
          duracion: duracionFinal,
          calificacion: promedioCalificacion,
          califPuntualidad,
          califSolucion,
          hojaServicio: {
            evaluacionAveria: requestPayload.evaluacionAveria,
            detalleSolucion: requestPayload.detalleSolucion,
            sugerencias: requestPayload.sugerencias || '',
            materiales: requestPayload.materiales,
            fotoInicialUrl: fotoInicialServidor,
            fotoFinalUrl: fotoFinalServidor,
            fotosEvidencia: fotosServidor,
            firmaDigitalUrl: firmaClienteUrl,
            firmaAfiliadoUrl: firmaClienteUrl,
          },
        },
      });

      toast.success('¡Servicio finalizado con éxito!');
      setConfirmDialogOpen(false);
    } catch (err: any) {
      console.error('Error al cerrar la orden en el servidor:', err);
      const errorMsg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo completar el cierre en el servidor. Verifica tu conexión e inténtalo de nuevo.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const codigo = orden ? `#${orden.codigoOrden}` : '#ORD-2026-001';
  const horaFinActual = formatearHoraLocal(orden?.fechaFinalizacion || new Date());
  const duracionActual = calcularDuracionServicio(
    orden?.fechaLlegada || orden?.horaLlegada,
    orden?.fechaFinalizacion || new Date()
  );

  return (
    <TecnicoLayout activeTab="ordenes">
      <div className="px-5 pt-5 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/tecnico/ordenes/${id}/atencion`, { state: { orden } })}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-800 hover:text-[#0ea5e9] transition-colors rounded-full focus:outline-none"
            aria-label="Volver"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            {codigo}
          </h1>
        </div>

        {/* Stepper (Paso 3: Validación y Cierre activo) */}
        <OrderStepper currentStep={3} />

        {/* Tarjeta de Validación y Cierre */}
        <form onSubmit={handlePreSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Badge y Título */}
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200/60">
                Validación y Cierre
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2 leading-snug">
                {orden?.tipoServicio || 'Mantenimiento Eléctrico Preventivo'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fin de servicio: {horaFinActual} • Duración: {duracionActual}
              </p>
            </div>

            {/* EVIDENCIA DEL SERVICIO */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  EVIDENCIA DEL SERVICIO <span className="text-rose-500">*</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {[fotoInicial, fotoFinal].filter(Boolean).length}/2 adjuntas
                </span>
              </div>

              {/* Inputs ocultos para Slot 1 (Antes): Cámara directa y Galería */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple={false}
                ref={cameraInputInicialRef}
                className="hidden"
                onChange={(e) => handleImageUpload(e, setFotoInicial, setComprimiendoInicial, 'inicial')}
              />
              <input
                type="file"
                accept="image/*"
                multiple={false}
                ref={galleryInputInicialRef}
                className="hidden"
                onChange={(e) => handleImageUpload(e, setFotoInicial, setComprimiendoInicial, 'inicial')}
              />

              {/* Inputs ocultos para Slot 2 (Después): Cámara directa y Galería */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple={false}
                ref={cameraInputFinalRef}
                className="hidden"
                onChange={(e) => handleImageUpload(e, setFotoFinal, setComprimiendoFinal, 'final')}
              />
              <input
                type="file"
                accept="image/*"
                multiple={false}
                ref={galleryInputFinalRef}
                className="hidden"
                onChange={(e) => handleImageUpload(e, setFotoFinal, setComprimiendoFinal, 'final')}
              />

              <div className="grid grid-cols-1 gap-3.5">
                {/* Bloque 1: Foto Inicial (Antes del servicio) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Foto Inicial: Antes del servicio <span className="text-rose-500">*</span>
                    </label>
                    {fotoInicial && (
                      <span className="text-[11px] font-bold text-emerald-600">Completado</span>
                    )}
                  </div>

                  {comprimiendoInicial ? (
                    <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 min-h-[148px]">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                      <span className="text-xs font-bold text-sky-700">
                        Optimizando evidencia inicial...
                      </span>
                    </div>
                  ) : fotoInicial ? (
                    <div className="rounded-xl overflow-hidden shadow-sm relative group border border-emerald-200 bg-slate-900 h-48">
                      <img
                        src={fotoInicial}
                        alt="Foto Inicial: Antes del servicio"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-emerald-600/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <span>✓ Evidencia lista</span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => cameraInputInicialRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-semibold shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Tomar otra foto con cámara"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Cámara</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputInicialRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-[11px] font-semibold shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Cambiar desde galería"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Reemplazar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFotoInicial(null)}
                          className="p-1.5 rounded-lg bg-rose-600/95 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                          title="Eliminar foto inicial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">
                          Registra el estado inicial antes de intervenir
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Usa la cámara al instante o selecciona una foto de tu galería
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => cameraInputInicialRef.current?.click()}
                          className="min-h-[44px] bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all text-xs cursor-pointer"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>Tomar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputInicialRef.current?.click()}
                          className="min-h-[44px] bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 shrink-0 text-slate-600" />
                          <span>Elegir Galería</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bloque 2: Foto Final (Trabajo culminado) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Foto Final: Trabajo culminado <span className="text-rose-500">*</span>
                    </label>
                    {fotoFinal && (
                      <span className="text-[11px] font-bold text-emerald-600">Completado</span>
                    )}
                  </div>

                  {comprimiendoFinal ? (
                    <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 min-h-[148px]">
                      <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
                      <span className="text-xs font-bold text-sky-700">
                        Optimizando evidencia final...
                      </span>
                    </div>
                  ) : fotoFinal ? (
                    <div className="rounded-xl overflow-hidden shadow-sm relative group border border-emerald-200 bg-slate-900 h-48">
                      <img
                        src={fotoFinal}
                        alt="Foto Final: Trabajo culminado"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-emerald-600/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <span>✓ Evidencia lista</span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => cameraInputFinalRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-semibold shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Tomar otra foto con cámara"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Cámara</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputFinalRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-[11px] font-semibold shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title="Cambiar desde galería"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Reemplazar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFotoFinal(null)}
                          className="p-1.5 rounded-lg bg-rose-600/95 hover:bg-rose-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                          title="Eliminar foto final"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">
                          Registra el resultado final del servicio realizado
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Usa la cámara al instante o selecciona una foto de tu galería
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => cameraInputFinalRef.current?.click()}
                          className="min-h-[44px] bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all text-xs cursor-pointer"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>Tomar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputFinalRef.current?.click()}
                          className="min-h-[44px] bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 shrink-0 text-slate-600" />
                          <span>Elegir Galería</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(!fotoInicial || !fotoFinal) && (
                <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 rounded-xl px-3 py-2">
                  * Es obligatorio adjuntar tanto la Foto Inicial (Antes) como la Foto Final (Después) para habilitar el cierre de la orden.
                </p>
              )}
            </div>

            {/* EVALUACIÓN DEL SERVICIO */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                EVALUACIÓN DEL SERVICIO
              </h3>

              {/* Fila 1: Presentación y puntualidad */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Presentación y puntualidad</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCalifPuntualidad(star)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 text-amber-400 hover:scale-110 active:scale-90 transition-transform focus:outline-none"
                      aria-label={`Calificar puntualidad con ${star} estrellas`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= califPuntualidad ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Fila 2: Trabajo y solución brindada */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Trabajo y solución brindada</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCalifSolucion(star)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 text-amber-400 hover:scale-110 active:scale-90 transition-transform focus:outline-none"
                      aria-label={`Calificar solución con ${star} estrellas`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= califSolucion ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CONFORMIDAD DEL AFILIADO */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                CONFORMIDAD DEL AFILIADO
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Declaro recibir el servicio a entera satisfacción.
              </p>

              {/* Lienzo de Firma */}
              <SignaturePad ref={sigPadRef} />
            </div>
          </div>

          {/* Botón Primario: Finalizar y Cerrar Orden */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!fotoInicial || !fotoFinal || submitting || comprimiendoInicial || comprimiendoFinal}
              className="w-full min-h-[52px] py-4 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>Procesando cierre...</span>
                </>
              ) : (
                'Finalizar y Cerrar Orden'
              )}
            </button>
          </div>
        </form>

        {/* Modal de confirmación para acción crítica */}
        <ConfirmDialog
          isOpen={confirmDialogOpen}
          title="¿Finalizar y cerrar orden de trabajo?"
          message="Se generará la hoja de servicio oficial con las firmas y evidencias fotográficas registradas. Esta acción concluirá el servicio formalmente."
          confirmLabel="Sí, Finalizar Orden"
          cancelLabel="Cancelar"
          variant="primary"
          isLoading={submitting}
          loadingLabel="Procesando cierre..."
          onConfirm={handleFinalizar}
          onCancel={() => !submitting && setConfirmDialogOpen(false)}
        />
      </div>
    </TecnicoLayout>
  );
};
