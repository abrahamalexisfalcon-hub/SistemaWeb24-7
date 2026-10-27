import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { tecnicoApi } from '../../api';
import { useEspecialidades } from '../../hooks';
import { TecnicoLayout, OrderStepper } from '../../components/tecnico';
import type { OrdenResumenTecnico, MaterialConsumido } from '../../types';
import { ChevronLeft, Check, Star, FileText, Download } from 'lucide-react';
import logo247 from '../../assets/Logo_negro.png';
import { EvidenciasGaleria } from '../../components/EvidenciasGaleria';
import { calcularDuracionServicio } from '../../utils/dateFormatter';

/* ─────────────── Tipos del state recibido desde ValidacionCierre ─────────────── */
interface HojaServicioData {
  evaluacionAveria: string;
  detalleSolucion: string;
  sugerencias: string;
  materiales: MaterialConsumido[];
  firmaDigitalUrl?: string;
  firmaAfiliadoUrl?: string;
}

interface ExitoState {
  orden?: OrdenResumenTecnico;
  duracion?: string;
  calificacion?: number;
  califPuntualidad?: number;
  califSolucion?: number;
  hojaServicio?: HojaServicioData;
}

/* ─────────────── Helpers ─────────────── */

function calificacionLabel(value: number): 'Excelente' | 'Regular' | 'Malo' {
  if (value >= 4) return 'Excelente';
  if (value >= 3) return 'Regular';
  return 'Malo';
}

function formatFechaHoy(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/* ─────────────── Componente Checkbox visual ─────────────── */
const CheckBox: React.FC<{ checked: boolean; label: string }> = ({ checked, label }) => (
  <span className="inline-flex items-center gap-1.5 mr-3 text-[9.5px] leading-none whitespace-nowrap text-gray-800">
    <span className={`inline-flex items-center justify-center w-[11px] h-[11px] border border-gray-700 rounded-sm text-[8px] font-bold ${checked ? 'bg-[#0284c7] text-white border-[#0284c7]' : 'bg-white'}`}>
      {checked ? '✓' : ''}
    </span>
    {label}
  </span>
);

/* ─────────────── Componente de Renglones para Texto ─────────────── */
const RenglonesTexto: React.FC<{ texto?: string; minLineas?: number }> = ({ texto, minLineas = 2 }) => {
  const limpio = texto?.trim();
  const tieneTexto = Boolean(limpio && limpio !== '—');

  if (tieneTexto) {
    return (
      <div className="space-y-1 my-0.5">
        <p className="text-[10px] text-gray-900 leading-normal font-medium pb-0.5 border-b border-gray-300 whitespace-pre-wrap">
          {limpio}
        </p>
        <div className="border-b border-gray-300 h-2 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5 my-1">
      {Array.from({ length: minLineas }).map((_, idx) => (
        <div key={idx} className="border-b border-gray-300 h-2 w-full" />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════ */
export const ExitoOrden: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = location.state as ExitoState | undefined;

  const ordenFromState = stateData?.orden;
  const calificacion = stateData?.calificacion || 5;
  const califPuntualidad = stateData?.califPuntualidad ?? calificacion;
  const califSolucion = stateData?.califSolucion ?? calificacion;
  const hojaServicio = stateData?.hojaServicio;

  const [modalPdfOpen, setModalPdfOpen] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenResumenTecnico | null>(null);

  const orden = ordenDetalle || ordenFromState;
  const duracion =
    stateData?.duracion ||
    calcularDuracionServicio(orden?.fechaLlegada || orden?.horaLlegada, orden?.fechaFinalizacion);

  const { especialidades: espObjs } = useEspecialidades();
  const tipoServicioActivo = ordenDetalle?.tipoServicio || ordenFromState?.tipoServicio;
  const listaEspecialidades = useMemo(() => {
    const nombres = espObjs.map((e) => e.nombre);
    if (tipoServicioActivo && !nombres.some((n) => n.toLowerCase() === tipoServicioActivo.toLowerCase())) {
      return [...nombres, tipoServicioActivo];
    }
    return nombres;
  }, [espObjs, tipoServicioActivo]);

  const ordenId = Number(id) || ordenFromState?.id || 1;

  // Consulta el detalle de la orden si faltan datos de la hoja de servicio o firmas
  useEffect(() => {
    if (ordenId) {
      tecnicoApi.getDetalleOrden(ordenId)
        .then((data) => {
          if (data) setOrdenDetalle(data);
        })
        .catch(() => {});
    }
  }, [ordenId]);

  // Limpieza garantizada del borrador de la orden finalizada con éxito
  useEffect(() => {
    localStorage.removeItem(`borrador_atencion_${ordenId}`);
  }, [ordenId]);

  const codigo = orden ? `#${orden.codigoOrden}` : `#ORD-2026-${String(ordenId).padStart(3, '0')}`;
  const codigoLimpio = codigo.replace(/^#+/, '#');
  const nombreAfiliado = orden?.nombreAfiliado || 'Carlos Mendoza P.';
  const direccion = orden?.direccion || 'Av. Central 120';
  const dniAfiliado = orden?.dniAfiliado || '';
  const rawNombreCuenta =
    orden?.cuentaNombre ||
    (orden as any)?.cuenta?.nombre ||
    (orden as any)?.nombreCuenta ||
    orden?.codigoCuenta ||
    '';
  const nombreCuenta =
    rawNombreCuenta && !String(rawNombreCuenta).trim().toUpperCase().startsWith('CTA-')
      ? String(rawNombreCuenta).trim()
      : 'Particular';
  const numeroOt = orden?.numeroOt || '-';
  const tecnicoNombre = orden?.tecnicoNombre || 'Técnico 24/7';
  const tipoServicio = orden?.tipoServicio || '';

  const materiales =
    hojaServicio?.materiales && hojaServicio.materiales.length > 0
      ? hojaServicio.materiales
      : orden?.materiales || [];

  const evaluacion = hojaServicio?.evaluacionAveria || orden?.evaluacionAveria || '';
  const detalleSolucion = hojaServicio?.detalleSolucion || orden?.detalleSolucion || '';
  const sugerencias = hojaServicio?.sugerencias || orden?.sugerencias || '';

  const firmaClienteUrl =
    hojaServicio?.firmaDigitalUrl ||
    hojaServicio?.firmaAfiliadoUrl ||
    orden?.firmaDigitalUrl ||
    orden?.firmaAfiliadoUrl ||
    (orden as any)?.hojaServicio?.firmaDigitalUrl ||
    (orden as any)?.hojaServicio?.firmaAfiliadoUrl ||
    localStorage.getItem(`orden_${ordenId}_firma_cliente`) ||
    '';

  const tecnicoFirmaUrl =
    orden?.tecnicoFirmaUrl ||
    (orden as any)?.tecnico?.firmaUrl ||
    (orden as any)?.tecnicoFirma ||
    (() => {
      try {
        const u = sessionStorage.getItem('user');
        if (u) {
          const parsed = JSON.parse(u);
          const userKey = `tecnico_${parsed.usuarioId}_firma_url`;
          const firma = localStorage.getItem(userKey);
          if (firma) return firma;
          if (parsed.firmaUrl) return parsed.firmaUrl;
        }
      } catch {}
      return null;
    })() ||
    localStorage.getItem('tecnico_firma_url') ||
    '';

  const fotosEvidencia: string[] = useMemo(() => {
    const isMockUrl = (url?: string | null) =>
      !url ||
      url.includes('images.unsplash.com') ||
      url.includes('placeholder');

    const lista: (string | null | undefined)[] = [];

    // 1. Prioridad: Evidencias devueltas directamente por el servidor (ordenDetalle)
    if (ordenDetalle?.fotosEvidencia && ordenDetalle.fotosEvidencia.length > 0) {
      lista.push(...ordenDetalle.fotosEvidencia);
    } else if (ordenDetalle?.fotoInicialUrl || ordenDetalle?.fotoFinalUrl) {
      lista.push(ordenDetalle.fotoInicialUrl, ordenDetalle.fotoFinalUrl);
    }

    // 2. Respaldo: Estado devuelto por el servidor durante el cierre (hojaServicio u orden)
    if ((hojaServicio as any)?.fotosEvidencia && (hojaServicio as any).fotosEvidencia.length > 0) {
      lista.push(...((hojaServicio as any).fotosEvidencia as string[]));
    }
    if ((orden as any)?.fotosEvidencia && (orden as any).fotosEvidencia.length > 0) {
      lista.push(...((orden as any).fotosEvidencia as string[]));
    }

    lista.push(
      (hojaServicio as any)?.fotoInicialUrl,
      orden?.fotoInicialUrl,
      (hojaServicio as any)?.fotoFinalUrl,
      orden?.fotoFinalUrl
    );

    return Array.from(
      new Set(
        lista.filter((f): f is string => Boolean(f && typeof f === 'string' && f.trim() && !isMockUrl(f)))
      )
    );
  }, [ordenDetalle, hojaServicio, orden]);

  /* ─── Detecta especialidad activa ─── */
  const tipoNorm = tipoServicio.toLowerCase();
  const especialidadMatch = (e: string) => tipoNorm.includes(e.toLowerCase());

  /* ─── Materiales en dos columnas para la tabla ─── */
  const mitad = Math.ceil(materiales.length / 2);
  const colIzq = materiales.slice(0, mitad);
  const colDer = materiales.slice(mitad);
  const filasMat = Math.max(colIzq.length, colDer.length, 1);

  const navToOrdenes = () =>
    navigate('/tecnico/ordenes', {
      state: {
        ordenActualizada: {
          ...(orden || {}),
          id: Number(id) || orden?.id || 1,
          estado: 'FINALIZADA',
        },
      },
    });

  return (
    <TecnicoLayout activeTab="ordenes">
      <div className="px-5 pt-5 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          <button
            onClick={navToOrdenes}
            className="p-1 -ml-1 text-slate-800 hover:text-[#0ea5e9] transition-colors"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            {codigo}
          </h1>
        </div>

        {/* Stepper (Todos los 4 pasos completados en cian con checks) */}
        <OrderStepper currentStep={4} />

        {/* Tarjeta Principal de Éxito */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-sm ring-8 ring-emerald-50">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            ¡Servicio Finalizado con Éxito!
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
            La hoja de servicio fue generada y enviada al afiliado.
          </p>

          {/* Tarjeta Resumen con Borde */}
          <div className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 mt-6 text-left space-y-2.5 text-sm">
            {/* Orden / OT */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Orden:</span>
              <span className="font-bold text-slate-900 tracking-tight">
                {orden?.numeroOt || codigo}
              </span>
            </div>

            {/* Afiliado: separación y alineación protegida */}
            <div className="flex justify-between items-start gap-4 pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium shrink-0 pt-0.5">Afiliado:</span>
              <span className="font-semibold text-slate-800 text-right leading-snug break-words uppercase">
                {nombreAfiliado}
              </span>
            </div>

            {/* Duración */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Duración:</span>
              <span className="font-bold text-slate-900">{duracion}</span>
            </div>

            {/* Calificación */}
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Calificación:</span>
              <div className="flex text-amber-400 gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= calificacion ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de Evidencias Fotográficas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 text-left">
          <EvidenciasGaleria
            fotos={fotosEvidencia}
            titulo="Evidencias Fotográficas del Servicio"
          />
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={navToOrdenes}
            className="w-full py-4 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center"
          >
            Volver al Listado de Órdenes
          </button>

          <button
            type="button"
            onClick={() => setModalPdfOpen(true)}
            className="w-full py-3.5 px-4 border border-sky-300 text-[#0ea5e9] bg-sky-50/50 hover:bg-sky-100/60 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4 text-[#0ea5e9]" />
            <span>Ver Hoja de Servicio</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════  MODAL HOJA DE SERVICIO OFICIAL  ═══════════════════════ */}
      {modalPdfOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-2 print:p-0 print:bg-white">
          {/* Contenedor modal — en print ocupa toda la página */}
          <div className="bg-white rounded-2xl max-w-[540px] w-full max-h-[92vh] overflow-y-auto shadow-2xl print:max-w-none print:max-h-none print:rounded-none print:shadow-none print:overflow-visible no-print-hide">

            {/* Barra de herramientas del modal (se oculta en impresión) */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 print:hidden sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <FileText className="w-4 h-4 text-[#0ea5e9]" />
                <span>Hoja de Servicio {codigoLimpio}</span>
              </div>
              <button
                onClick={() => setModalPdfOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* ── HOJA DE SERVICIO IMPRIMIBLE (Formato Físico Original) ── */}
            <div id="hoja-servicio-print" className="px-5 py-4 text-[10px] leading-[1.45] text-gray-900 space-y-2.5 print:px-6 print:py-4 print:text-[9.5px]">

              {/* ===== CABECERA ===== */}
              <div className="flex items-start gap-3 border-b-2 border-[#0284c7] pb-2">
                {/* Logo institucional */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <img src={logo247} alt="24/7 Asistencias" className="h-[100px] w-auto object-contain" />
                </div>

                {/* Título central */}
                <div className="flex-1 flex items-center justify-center pt-2">
                  <h2 className="text-[15px] font-black text-[#0284c7] tracking-wider underline underline-offset-4 decoration-[#0284c7]">
                    HOJA DE SERVICIO
                  </h2>
                </div>

                {/* Datos de contacto */}
                <div className="flex flex-col items-end space-y-1 text-xs text-sky-600 print:text-sky-700">
                  {/* Fila 1: WhatsApp */}
                  <div className="flex items-center gap-1.5 font-medium">
                    {/* SVG WhatsApp */}
                    <svg className="w-3.5 h-3.5 fill-current text-slate-800 shrink-0" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.181 0 5.767-2.586 5.767-5.766.001-3.182-2.585-5.767-5.767-5.767zm0 10.42c-.93 0-1.745-.27-2.483-.732l-.178-.106-1.579.414.421-1.54-.117-.187c-.504-.805-.77-1.488-.77-2.503 0-2.617 2.129-4.747 4.747-4.747 2.617 0 4.746 2.129 4.746 4.747 0 2.618-2.129 4.746-4.747 4.746zm0-11.825C6.088 4.767 1.233 9.622 1.233 15.565c0 1.957.518 3.864 1.503 5.541L1 26.653l5.688-1.492c1.614.887 3.433 1.354 5.343 1.354 5.943 0 10.798-4.855 10.798-10.798 0-5.943-4.855-10.798-10.798-10.798z"/>
                    </svg>
                    <span>988 888 141 / 989 567 795 / 914 279 170</span>
                  </div>

                  {/* Fila 2: Correo Gmail */}
                  <div className="flex items-center gap-1.5 font-medium">
                    {/* SVG Gmail / Mail */}
                    <svg className="w-3.5 h-3.5 fill-current text-slate-800 shrink-0" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    <span>247asistencias.peru@gmail.com</span>
                  </div>

                  {/* Fila 3: Redes Sociales */}
                  <div className="flex items-center gap-3 font-medium">
                    {/* Instagram */}
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 fill-current text-slate-800 shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span>247asistencias</span>
                    </div>

                    {/* Facebook */}
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 fill-current text-slate-800 shrink-0" viewBox="0 0 24 24">
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                      </svg>
                      <span>247asistencias.pe</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== DATOS DEL AFILIADO ===== */}
              <div>
                <h3 className="font-bold text-gray-900 underline text-xs tracking-wider mb-1.5 uppercase">
                  DATOS DEL AFILIADO:
                </h3>
                <div className="text-[10px] space-y-1 text-gray-900">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <span className="font-bold">NOMBRES Y APELLIDOS: </span>
                      <span className="border-b border-gray-300 pb-0.5">{nombreAfiliado}</span>
                    </div>
                    <div>
                      <span className="font-bold">FECHA: </span>
                      <span className="border-b border-gray-300 pb-0.5">{formatFechaHoy()}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <span className="font-bold">CUENTA: </span>
                      <span className="border-b border-gray-300 pb-0.5">{nombreCuenta}</span>
                    </div>
                    <div>
                      <span className="font-bold">D.N.I. N°: </span>
                      <span className="border-b border-gray-300 pb-0.5">{dniAfiliado || '—'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold">DIRECCIÓN: </span>
                    <span className="border-b border-gray-300 pb-0.5">{direccion}{orden?.distrito ? `, ${orden.distrito}` : ''}</span>
                  </div>
                  <div>
                    <span className="font-bold">OT: </span>
                    <span className="border-b border-gray-300 pb-0.5">{numeroOt}</span>
                  </div>
                </div>
              </div>

              {/* ===== DATOS DEL SERVICIO ===== */}
              <div>
                <h3 className="font-bold text-gray-900 underline text-xs tracking-wider mb-1.5 uppercase">
                  DATOS DEL SERVICIO:
                </h3>
                <div className="flex flex-wrap items-center gap-y-1 text-gray-900 py-0.5">
                  {listaEspecialidades.map((esp) => (
                    <CheckBox key={esp} label={esp} checked={especialidadMatch(esp)} />
                  ))}
                </div>
              </div>

              {/* ===== EVALUACIÓN ===== */}
              <div>
                <h3 className="font-bold text-gray-900 underline text-xs tracking-wider mb-1 uppercase">
                  EVALUACIÓN
                </h3>
                <RenglonesTexto texto={evaluacion} minLineas={2} />
              </div>

              {/* ===== DETALLE DE SOLUCIÓN ===== */}
              <div>
                <h3 className="font-bold text-gray-900 underline text-xs tracking-wider mb-1 uppercase">
                  DETALLE DE SOLUCIÓN
                </h3>
                <RenglonesTexto texto={detalleSolucion} minLineas={2} />
              </div>

              {/* ===== MATERIALES EMPLEADOS ===== */}
              <div>
                <h3 className="font-bold text-gray-900 underline text-xs tracking-wider mb-1.5 uppercase">
                  MATERIALES EMPLEADOS
                </h3>
                <div className="border border-gray-300 rounded-sm overflow-hidden">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="bg-[#0284c7] text-white">
                        <th className="text-left px-2 py-1 font-bold border-r border-sky-600/70 w-[45%]">DESCRIPCIÓN</th>
                        <th className="text-center px-1 py-1 font-bold border-r border-sky-600/70 w-[8%]">CANT.</th>
                        <th className="text-left px-2 py-1 font-bold border-r border-sky-600/70 w-[39%]">DESCRIPCIÓN</th>
                        <th className="text-center px-1 py-1 font-bold w-[8%]">CANT.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: filasMat }).map((_, i) => {
                        const izq = colIzq[i];
                        const der = colDer[i];
                        return (
                          <tr key={i} className="border-t border-gray-200">
                            <td className="px-2 py-1 border-r border-gray-200">{izq?.descripcion || (izq?.materialId ? `Material #${izq.materialId}` : '')}</td>
                            <td className="text-center px-1 py-1 border-r border-gray-200 font-semibold">{izq ? izq.cantidad : ''}</td>
                            <td className="px-2 py-1 border-r border-gray-200">{der?.descripcion || (der?.materialId ? `Material #${der.materialId}` : '')}</td>
                            <td className="text-center px-1 py-1 font-semibold">{der ? der.cantidad : ''}</td>
                          </tr>
                        );
                      })}
                      {materiales.length === 0 && (
                        <tr className="border-t border-gray-200">
                          <td colSpan={4} className="px-2 py-2 text-center text-gray-400 italic">Sin materiales registrados</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ===== SUGERENCIA / RECOMENDACIÓN PARA GARANTÍA DEL SERVICIO ===== */}
              <div>
                <h3 className="font-bold text-gray-900 underline text-xs tracking-wider mb-1 uppercase">
                  SUGERENCIA / RECOMENDACIÓN PARA GARANTÍA DEL SERVICIO
                </h3>
                <RenglonesTexto texto={sugerencias} minLineas={2} />
              </div>

              {/* ===== DATOS DEL TÉCNICO ===== */}
              <div>
                <h3 className="font-bold text-gray-900 underline text-xs tracking-wider mb-1.5 uppercase">
                  DATOS DEL TÉCNICO
                </h3>
                <div className="text-[10px] space-y-1 text-gray-900">
                  <div>
                    <span className="font-bold">NOMBRE DEL TÉCNICO: </span>
                    <span className="border-b border-gray-300 pb-0.5">{tecnicoNombre}</span>
                  </div>

                  {/* Calificación Presentación */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold mr-1">Presentación y Puntualidad:</span>
                    {(['Excelente', 'Regular', 'Malo'] as const).map((lbl) => (
                      <CheckBox key={`pres-${lbl}`} label={lbl} checked={calificacionLabel(califPuntualidad) === lbl} />
                    ))}
                  </div>

                  {/* Calificación Trabajo */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold mr-1">Trabajo Realizado:</span>
                    {(['Excelente', 'Regular', 'Malo'] as const).map((lbl) => (
                      <CheckBox key={`trab-${lbl}`} label={lbl} checked={calificacionLabel(califSolucion) === lbl} />
                    ))}
                  </div>

                  <div>
                    <span className="font-bold">Observaciones: </span>
                    <span className="border-b border-gray-300 pb-0.5 inline-block min-w-[200px]">&nbsp;</span>
                  </div>
                </div>
              </div>

              {/* ===== FIRMAS ===== */}
              <div className="grid grid-cols-2 gap-8 pt-4 pb-2">
                {/* Firma del Técnico */}
                <div className="flex flex-col items-center">
                  <div className="h-16 w-full flex items-end justify-center relative pb-0.5">
                    {tecnicoFirmaUrl ? (
                      <img
                        src={tecnicoFirmaUrl}
                        alt="Firma del técnico"
                        className="max-h-14 md:max-h-16 w-auto object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="h-14" />
                    )}
                  </div>
                  <div className="w-full border-t border-gray-800 pt-1 text-center">
                    <p className="font-bold text-[9px] text-gray-900 tracking-wider">FIRMA DEL TÉCNICO</p>
                  </div>
                </div>

                {/* Firma del Afiliado */}
                <div className="flex flex-col items-center">
                  <div className="h-16 w-full flex items-end justify-center relative pb-0.5">
                    {firmaClienteUrl ? (
                      <img
                        src={firmaClienteUrl}
                        alt="Firma Afiliado"
                        className="h-14 md:h-16 object-contain mx-auto"
                      />
                    ) : (
                      <div className="h-14 md:h-16" />
                    )}
                  </div>
                  <div className="w-full border-t border-gray-800 pt-1 text-center">
                    <p className="font-bold text-[9px] text-gray-900 tracking-wider">FIRMA AFILIADO</p>
                    {dniAfiliado && (
                      <p className="text-[8px] text-gray-600 mt-0.5">D.N.I. N°: {dniAfiliado}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* FIN HOJA IMPRIMIBLE */}

            {/* Evidencias fotográficas complementarias */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 print:hidden text-left">
              <EvidenciasGaleria
                fotos={fotosEvidencia}
                titulo="EVIDENCIAS DEL SERVICIO (FOTOS)"
              />
            </div>

            {/* Botones de acción (ocultos en impresión) */}
            <div className="flex gap-2 px-4 pb-4 pt-2 print:hidden sticky bottom-0 bg-white rounded-b-2xl border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#0ea5e9] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <Download className="w-3.5 h-3.5" /> Descargar / Imprimir
              </button>
              <button
                onClick={() => setModalPdfOpen(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </TecnicoLayout>
  );
};
