import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, X, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import logo247 from '../assets/Logo_negro.png';
import { tecnicoApi } from '../api';
import { useEspecialidades } from '../hooks';
import type { OrdenDetalleAdmin, OrdenResumenTecnico, MaterialConsumido } from '../types';
import { EvidenciasGaleria } from './EvidenciasGaleria';

/* ─────────────── Props ─────────────── */
export interface HojaServicioModalProps {
  orden: OrdenDetalleAdmin | OrdenResumenTecnico | any;
  onClose: () => void;
}

function calificacionLabel(value: number): 'Excelente' | 'Regular' | 'Malo' {
  if (value >= 4) return 'Excelente';
  if (value >= 3) return 'Regular';
  return 'Malo';
}

function formatFecha(fechaStr?: string): string {
  try {
    const d = fechaStr ? new Date(fechaStr) : new Date();
    if (isNaN(d.getTime())) return fechaStr || '';
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return fechaStr || '';
  }
}

/* ─────────────── Componente Checkbox visual ─────────────── */
const CheckBox: React.FC<{ checked: boolean; label: string }> = ({ checked, label }) => (
  <span className="inline-flex items-center gap-1.5 mr-3 text-[9.5px] leading-none whitespace-nowrap text-gray-800">
    <span
      className={`inline-flex items-center justify-center w-[11px] h-[11px] border border-gray-700 rounded-sm text-[8px] font-bold ${
        checked ? 'bg-[#0284c7] text-white border-[#0284c7]' : 'bg-white'
      }`}
    >
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
export const HojaServicioModal: React.FC<HojaServicioModalProps> = ({ orden, onClose }) => {
  const [detalleExtra, setDetalleExtra] = useState<OrdenResumenTecnico | null>(null);
  const [compartiendoWa, setCompartiendoWa] = useState(false);
  const { especialidades: espObjs } = useEspecialidades();

  const listaEspecialidades = useMemo(() => {
    const nombres = espObjs.map((e) => e.nombre);
    if (orden?.tipoServicio && !nombres.some((n) => n.toLowerCase() === orden.tipoServicio?.toLowerCase())) {
      return [...nombres, orden.tipoServicio];
    }
    return nombres;
  }, [espObjs, orden?.tipoServicio]);

  // Consulta el detalle de la orden si faltan datos de la hoja de servicio o firmas
  useEffect(() => {
    if (orden?.id) {
      tecnicoApi
        .getDetalleOrden(orden.id)
        .then((data) => {
          if (data) setDetalleExtra(data);
        })
        .catch(() => {
          // Si falla, el modal sigue funcionando con las propiedades iniciales de `orden`
        });
    }
  }, [orden?.id]);

  // Unificación de datos para soportar tanto OrdenDetalleAdmin como OrdenResumenTecnico
  const codigoRaw = orden?.codigoOrden || detalleExtra?.codigoOrden || 'ORD-2026-001';
  const codigoLimpio = codigoRaw.startsWith('#') ? codigoRaw : `#${codigoRaw}`;

  const nombreAfiliado =
    orden?.afiliadoNombre ||
    orden?.nombreAfiliado ||
    detalleExtra?.nombreAfiliado ||
    'Carlos Mendoza P.';

  const direccion =
    orden?.afiliadoDireccion ||
    orden?.direccion ||
    detalleExtra?.direccion ||
    'Av. Central 120';

  const distrito =
    orden?.afiliadoDistrito ||
    orden?.distrito ||
    detalleExtra?.distrito ||
    '';

  const ordenExtendida = orden as (typeof orden & {
    dni?: string;
    numeroCuentaAfiliado?: string;
    nombreTecnico?: string;
    tecnico?: { firmaUrl?: string | null } | null;
  }) | null;

  const dniAfiliado =
    orden?.dniAfiliado ||
    ordenExtendida?.dni ||
    detalleExtra?.dniAfiliado ||
    '';

  const telefonoAfiliadoRaw =
    orden?.afiliadoTelefono ||
    (orden as any)?.telefonoAfiliado ||
    orden?.cliente?.telefono ||
    (orden as any)?.afiliado?.telefono ||
    '';

  const rawNombreCuenta =
    orden?.cuenta?.nombre ||
    orden?.cuentaNombre ||
    (orden as any)?.nombreCuenta ||
    detalleExtra?.cuentaNombre ||
    orden?.codigoCuenta ||
    detalleExtra?.codigoCuenta ||
    '';

  const nombreCuenta =
    rawNombreCuenta && !String(rawNombreCuenta).trim().toUpperCase().startsWith('CTA-')
      ? String(rawNombreCuenta).trim()
      : 'Particular';

  const numeroOt =
    orden?.numeroOt ||
    detalleExtra?.numeroOt ||
    '-';

  const tecnicoNombre =
    orden?.tecnicoNombre ||
    ordenExtendida?.nombreTecnico ||
    detalleExtra?.tecnicoNombre ||
    'Técnico 24/7';

  const tipoServicio =
    orden?.tipoServicio ||
    detalleExtra?.tipoServicio ||
    '';

  const fechaMostrar = formatFecha(
    orden?.fechaFinalizacion ||
    orden?.fechaAsignacion ||
    detalleExtra?.fechaProgramada
  );

  // Hoja de Servicio: Textos de evaluación y solución
  const evaluacion =
    orden?.hojaServicio?.evaluacionAveria ||
    orden?.evaluacionAveria ||
    detalleExtra?.evaluacionAveria ||
    '';

  const detalleSolucion =
    orden?.hojaServicio?.detalleSolucion ||
    orden?.detalleSolucion ||
    detalleExtra?.detalleSolucion ||
    '';

  const sugerencias =
    orden?.hojaServicio?.sugerencias ||
    orden?.sugerencias ||
    detalleExtra?.sugerencias ||
    '';

  // Materiales consumidos unificados
  const materialesCrudos: Array<{
    id?: number;
    materialId?: number | null;
    materialCatalogoId?: number | null;
    descripcion?: string;
    materialNombre?: string | null;
    nombreCatalogo?: string | null;
    cantidad?: number;
  }> =
    orden?.hojaServicio?.materiales ||
    orden?.materiales ||
    detalleExtra?.materiales ||
    [];

  const materiales: MaterialConsumido[] = materialesCrudos.map((m) => ({
    materialId: m.materialId || m.materialCatalogoId || m.id || 0,
    descripcion: m.descripcion || m.materialNombre || m.nombreCatalogo || 'Material de servicio',
    cantidad: m.cantidad || 1,
  }));

  // Calificaciones
  const calificacionNum =
    orden?.hojaServicio?.calificacion ||
    orden?.calificacion ||
    detalleExtra?.calificacion ||
    5;

  // URLs de Firmas Digitales en Cloudinary
  const firmaClienteUrl =
    orden?.hojaServicio?.firmaDigitalUrl ||
    orden?.hojaServicio?.firmaAfiliadoUrl ||
    orden?.firmaDigitalUrl ||
    orden?.firmaAfiliadoUrl ||
    detalleExtra?.firmaDigitalUrl ||
    detalleExtra?.firmaAfiliadoUrl ||
    '';

  const tecnicoFirmaUrl =
    orden?.tecnicoFirmaUrl ||
    ordenExtendida?.tecnico?.firmaUrl ||
    detalleExtra?.tecnicoFirmaUrl ||
    '';

  // Detección de especialidad activa
  const tipoNorm = tipoServicio.toLowerCase();
  const especialidadMatch = (e: string) => tipoNorm.includes(e.toLowerCase());

  // Materiales en dos columnas para la tabla de 4 campos
  const mitad = Math.ceil(materiales.length / 2);
  const colIzq = materiales.slice(0, mitad);
  const colDer = materiales.slice(mitad);
  const filasMat = Math.max(colIzq.length, colDer.length, 1);

  const generarArchivoHojaServicio = async (codigoSinHash: string): Promise<File | null> => {
    const elemento = document.getElementById('hoja-servicio-print');
    if (!elemento) return null;

    const codigoSanitizado = codigoSinHash.replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const xOffset = (pageWidth - imgWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, margin, imgWidth, imgHeight);

      const pdfBlob = pdf.output('blob');
      const nombrePdf = `Hoja_Servicio_${codigoSanitizado}.pdf`;
      return new File([pdfBlob], nombrePdf, { type: 'application/pdf' });
    } catch {
      return null;
    }
  };

  const descargarArchivoLocal = (archivo: File) => {
    const blobUrl = URL.createObjectURL(archivo);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = archivo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  };

  const handleCompartirWhatsApp = async () => {
    if (compartiendoWa) return;
    setCompartiendoWa(true);

    try {
      const soloDigitos = String(telefonoAfiliadoRaw || '').replace(/\D/g, '');
      const telefonoDestino =
        soloDigitos.length === 9
          ? `51${soloDigitos}`
          : soloDigitos.length === 11 && soloDigitos.startsWith('51')
            ? soloDigitos
            : soloDigitos;

      const codigoSinHash = codigoLimpio.replace(/^#+/, '');
      const otReferencia =
        numeroOt && numeroOt !== '-' ? `OT N° ${numeroOt} (${codigoLimpio})` : codigoLimpio;
      const especialidadAtendida = tipoServicio || 'Asistencia Técnica Domiciliaria';
      const pdfActaUrl =
        orden?.hojaServicio?.pdfActaUrl || (orden as any)?.pdfActaUrl || '';
      const enlaceDirectoHoja =
        pdfActaUrl ||
        `${window.location.origin}/?orden=${encodeURIComponent(codigoSinHash)}`;

      const construirMensaje = (incluirEnlace: boolean) => {
        const lineas = [
          `*24/7 ASISTENCIAS GENERALES* 🛠️`,
          ``,
          `Estimado(a) *${nombreAfiliado}*, reciba un cordial saludo.`,
          ``,
          `Le informamos que su atención de *${especialidadAtendida}* correspondiente a la orden *${otReferencia}* ha sido *FINALIZADA CON ÉXITO* con fecha *${fechaMostrar}*.`,
          ...(detalleSolucion
            ? [``, `*Detalle del trabajo realizado:*`, `${detalleSolucion.trim()}`]
            : []),
          ``,
          `*Técnico asignado:* ${tecnicoNombre}`,
          ...(nombreCuenta && nombreCuenta !== 'Particular'
            ? [`*Cuenta / Convenio:* ${nombreCuenta}`]
            : []),
          ...(incluirEnlace
            ? [
                ``,
                `📄 *Constancia Digital (Hoja de Servicio):*`,
                `${enlaceDirectoHoja}`,
              ]
            : [
                ``,
                `📄 Adjuntamos a este mensaje el archivo de su *Hoja de Servicio Digital*.`,
              ]),
          ``,
          `Agradecemos su confianza en *24/7 Asistencias Generales*. Quedamos a su disposición las 24 horas ante cualquier consulta.`,
        ];
        return lineas.join('\n');
      };

      // 1. Generar el archivo físico (PDF) en memoria
      const archivoPdf = await generarArchivoHojaServicio(codigoSinHash);

      // 2. En dispositivos móviles que soportan Web Share API con archivos (`navigator.canShare({ files })`)
      const esDispositivoMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (
        esDispositivoMovil &&
        archivoPdf &&
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [archivoPdf] })
      ) {
        try {
          await navigator.share({
            files: [archivoPdf],
            title: `Hoja de Servicio ${codigoLimpio} - 24/7 Asistencias Generales`,
            text: construirMensaje(Boolean(pdfActaUrl)),
          });
          return;
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            return;
          }
          // Si falla el share nativo, continúa al fallback de descarga + WhatsApp Web
        }
      }

      // 3. Fallback en Escritorio o navegadores sin soporte de compartir archivos en WhatsApp:
      //    a) Descargar automáticamente el archivo PDF en el equipo del usuario
      if (archivoPdf) {
        descargarArchivoLocal(archivoPdf);
      }

      //    b) Construir el mensaje incluyendo el enlace directo de consulta
      const mensajeFallback = construirMensaje(true);

      //    c) Abrir WhatsApp Web con el mensaje y el teléfono del afiliado precargados
      const waUrl = telefonoDestino
        ? `https://wa.me/${telefonoDestino}?text=${encodeURIComponent(mensajeFallback)}`
        : `https://wa.me/?text=${encodeURIComponent(mensajeFallback)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      //    d) Mostrar toast informativo
      toast.success(
        'Hoja de servicio descargada. Puedes adjuntarla directamente en el chat abierto de WhatsApp'
      );
    } finally {
      setCompartiendoWa(false);
    }
  };

  const fotosEvidencia: string[] = useMemo(() => {
    const isMockUrl = (url?: string | null) =>
      !url ||
      url.includes('images.unsplash.com') ||
      url.includes('placeholder');

    const lista: (string | null | undefined)[] = [];

    // 1. Evidencias del servidor (detalleExtra o orden)
    if (detalleExtra?.fotosEvidencia && detalleExtra.fotosEvidencia.length > 0) {
      lista.push(...detalleExtra.fotosEvidencia);
    }
    if (orden?.hojaServicio?.fotosEvidencia && orden.hojaServicio.fotosEvidencia.length > 0) {
      lista.push(...orden.hojaServicio.fotosEvidencia);
    }
    if (orden?.fotosEvidencia && orden.fotosEvidencia.length > 0) {
      lista.push(...orden.fotosEvidencia);
    }

    lista.push(
      detalleExtra?.fotoInicialUrl,
      orden?.hojaServicio?.fotoInicialUrl,
      orden?.fotoInicialUrl,
      detalleExtra?.fotoFinalUrl,
      orden?.hojaServicio?.fotoFinalUrl,
      orden?.fotoFinalUrl
    );

    return Array.from(
      new Set(
        lista.filter((f): f is string => Boolean(f && typeof f === 'string' && f.trim() && !isMockUrl(f)))
      )
    );
  }, [detalleExtra, orden]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-2 print:p-0 print:bg-white animate-in fade-in">
      {/* Contenedor modal — en print ocupa toda la página */}
      <div className="bg-white rounded-2xl max-w-[540px] w-full max-h-[92vh] overflow-y-auto shadow-2xl print:max-w-none print:max-h-none print:rounded-none print:shadow-none print:overflow-visible no-print-hide">
        
        {/* Barra de herramientas del modal (se oculta en impresión) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 print:hidden sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <FileText className="w-4 h-4 text-[#0ea5e9]" />
            <span>Hoja de Servicio {codigoLimpio}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── HOJA DE SERVICIO IMPRIMIBLE (Formato Oficial Físico) ── */}
        <div
          id="hoja-servicio-print"
          className="px-5 py-4 text-[10px] leading-[1.45] text-gray-900 space-y-2.5 print:px-6 print:py-4 print:text-[9.5px]"
        >
          {/* ===== CABECERA ===== */}
          <div className="flex items-center justify-between w-full pb-3 border-b-2 border-sky-600 mb-4">
            {/* Logo institucional (15% de ancho, alineado a la izquierda) */}
            <div className="w-[15%] flex items-center justify-start">
              <img src={logo247} alt="24/7 Asistencias" className="h-[100px] w-auto object-contain" />
            </div>

            {/* Título central (acercado al logo, sin margen/padding izquierdo) */}
            <div className="flex-1 flex items-center justify-center pl-0 ml-0">
              <h2 className="text-[15px] font-black text-[#0284c7] tracking-wider underline underline-offset-4 decoration-[#0284c7] whitespace-nowrap">
                HOJA DE SERVICIO
              </h2>
            </div>

            {/* Datos de contacto con logos oficiales locales */}
            <div className="flex flex-col items-end space-y-1.5 text-s text-sky-600 print:text-sky-700">
              {/* Fila 1: WhatsApp */}
              <div className="flex items-center gap-1.5 font-medium">
                <img 
                  src="/icons/whatsapp.svg" 
                  alt="WhatsApp" 
                  className="w-3.5 h-3.5 object-contain"
                  crossOrigin="anonymous"
                />
                <span>988 888 141 / 914 279 170</span>
              </div>

              {/* Fila 2: Redes Sociales */}
              <div className="flex items-center gap-3 font-medium">
                {/* Instagram */}
                <div className="flex items-center gap-1">
                  <img 
                    src="/icons/instagram.svg" 
                    alt="Instagram" 
                    className="w-3.5 h-3.5 object-contain"
                    crossOrigin="anonymous"
                  />
                  <span>247asistencias</span>
                </div>
              </div>

              {/* Fila 3: Correo Gmail*/}
              <div className="flex items-center gap-1.5 font-medium">
                <img 
                  src="/icons/gmail.svg" 
                  alt="Gmail" 
                  className="w-3.5 h-3.5 object-contain"
                  crossOrigin="anonymous"
                />
                <span>247asistencias.peru@gmail.com</span>
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
                  <span className="font-bold">APELLIDOS Y NOMBRES: </span>
                  <span className="border-b border-gray-300 pb-0.5">{nombreAfiliado}</span>
                </div>
                <div>
                  <span className="font-bold">FECHA: </span>
                  <span className="border-b border-gray-300 pb-0.5">{fechaMostrar}</span>
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
                <span className="border-b border-gray-300 pb-0.5">
                  {direccion}{distrito ? `, ${distrito}` : ''}
                </span>
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
                    <th className="text-left px-2 py-1 font-bold border-r border-sky-600/70 w-[45%]">
                      DESCRIPCIÓN
                    </th>
                    <th className="text-center px-1 py-1 font-bold border-r border-sky-600/70 w-[8%]">
                      CANT.
                    </th>
                    <th className="text-left px-2 py-1 font-bold border-r border-sky-600/70 w-[39%]">
                      DESCRIPCIÓN
                    </th>
                    <th className="text-center px-1 py-1 font-bold w-[8%]">
                      CANT.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: filasMat }).map((_, i) => {
                    const izq = colIzq[i];
                    const der = colDer[i];
                    return (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-2 py-1 border-r border-gray-200">
                          {izq?.descripcion || ''}
                        </td>
                        <td className="text-center px-1 py-1 border-r border-gray-200 font-semibold">
                          {izq ? izq.cantidad : ''}
                        </td>
                        <td className="px-2 py-1 border-r border-gray-200">
                          {der?.descripcion || ''}
                        </td>
                        <td className="text-center px-1 py-1 font-semibold">
                          {der ? der.cantidad : ''}
                        </td>
                      </tr>
                    );
                  })}
                  {materiales.length === 0 && (
                    <tr className="border-t border-gray-200">
                      <td colSpan={4} className="px-2 py-2 text-center text-gray-400 italic">
                        Sin materiales registrados
                      </td>
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
                  <CheckBox
                    key={`pres-${lbl}`}
                    label={lbl}
                    checked={calificacionLabel(calificacionNum) === lbl}
                  />
                ))}
              </div>

              {/* Calificación Trabajo */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold mr-1">Trabajo Realizado:</span>
                {(['Excelente', 'Regular', 'Malo'] as const).map((lbl) => (
                  <CheckBox
                    key={`trab-${lbl}`}
                    label={lbl}
                    checked={calificacionLabel(calificacionNum) === lbl}
                  />
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
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 print:hidden">
          <EvidenciasGaleria
            fotos={fotosEvidencia}
            titulo="EVIDENCIAS DEL SERVICIO (FOTOS)"
          />
        </div>

        {/* Barra de acción inferior destacada (oculta en impresión) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-4 pb-4 pt-3 print:hidden sticky bottom-0 bg-white/95 backdrop-blur-xs z-20 rounded-b-2xl border-t border-slate-100">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 py-2.5 px-3 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Descargar / Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleCompartirWhatsApp}
            disabled={compartiendoWa}
            className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-70 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#25D366]/25 transition-all cursor-pointer"
            title="Enviar Hoja de Servicio (PDF) al Afiliado por WhatsApp"
          >
            {compartiendoWa ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <svg
                className="w-4 h-4 fill-current shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            )}
            <span>{compartiendoWa ? 'Generando PDF...' : 'Compartir por WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HojaServicioModal;
