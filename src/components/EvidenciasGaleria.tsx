import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ZoomIn, X, RotateCw, Download, ChevronLeft, ChevronRight, Share2, RefreshCw } from 'lucide-react';

export interface EvidenciasGaleriaProps {
  fotos?: (string | null | undefined)[];
  titulo?: string;
  emptyMessage?: string;
  className?: string;
}

export const EvidenciasGaleria: React.FC<EvidenciasGaleriaProps> = ({
  fotos = [],
  titulo,
  emptyMessage = 'No se adjuntaron evidencias del trabajo',
  className = '',
}) => {
  const esUrlMock = (url: string) => {
    return (
      url.includes('images.unsplash.com') ||
      url.includes('placeholder') ||
      url.includes('via.placeholder') ||
      url.includes('picsum.photos')
    );
  };

  // Filtrar URLs válidas (no nulas, no vacías y sin fotos mock/placeholder)
  const fotosValidas = (fotos || []).filter(
    (f): f is string => typeof f === 'string' && f.trim().length > 0 && !esUrlMock(f)
  );

  const [fotoActivaIndex, setFotoActivaIndex] = useState<number | null>(null);
  const [rotacion, setRotacion] = useState(0);
  const [descargando, setDescargando] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);

  const fotoActual = fotoActivaIndex !== null ? fotosValidas[fotoActivaIndex] : null;

  const cerrarLightbox = useCallback(() => {
    setFotoActivaIndex(null);
    setRotacion(0);
  }, []);

  const fotoSiguiente = useCallback(() => {
    if (fotoActivaIndex === null || fotosValidas.length <= 1) return;
    setFotoActivaIndex((prev) => (prev! + 1) % fotosValidas.length);
    setRotacion(0);
  }, [fotoActivaIndex, fotosValidas.length]);

  const fotoAnterior = useCallback(() => {
    if (fotoActivaIndex === null || fotosValidas.length <= 1) return;
    setFotoActivaIndex((prev) => (prev! - 1 + fotosValidas.length) % fotosValidas.length);
    setRotacion(0);
  }, [fotoActivaIndex, fotosValidas.length]);

  const rotarFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotacion((prev) => (prev + 90) % 360);
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      setDescargando(true);
      let blobUrl = imageUrl;
      let shouldRevoke = false;

      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        blobUrl = window.URL.createObjectURL(blob);
        shouldRevoke = true;
      } else {
        const response = await fetch(imageUrl, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const blob = await response.blob();
        blobUrl = window.URL.createObjectURL(blob);
        shouldRevoke = true;
      }

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'evidencia_servicio.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (shouldRevoke) {
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      // Fallback por si hay bloqueo CORS u error de fetch: abrir en nueva ventana
      window.open(imageUrl, '_blank');
    } finally {
      setDescargando(false);
    }
  };

  const handleShare = async (imageUrl: string, title: string) => {
    try {
      setCompartiendo(true);

      let blob: Blob;
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        blob = await response.blob();
      } else {
        const response = await fetch(imageUrl, { mode: 'cors' });
        blob = await response.blob();
      }

      const extension = blob.type.includes('png') ? 'png' : 'jpg';
      const file = new File([blob], `evidencia_servicio.${extension}`, {
        type: blob.type || 'image/jpeg',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title || 'Evidencia de Servicio',
          text: 'Adjunto evidencia del servicio realizado - 24/7 Asistencias',
        });
      } else if (navigator.share && !imageUrl.startsWith('data:')) {
        await navigator.share({
          title: title || 'Evidencia de Servicio',
          text: 'Adjunto evidencia del servicio realizado - 24/7 Asistencias',
          url: imageUrl,
        });
      } else {
        // Fallback: Abrir WhatsApp Web con el enlace de la imagen
        const text = imageUrl.startsWith('data:')
          ? encodeURIComponent('Hola, aquí te comparto la evidencia del servicio realizado - 24/7 Asistencias')
          : encodeURIComponent(`Hola, aquí te comparto la evidencia del servicio: ${imageUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      }
    } catch (error: unknown) {
      const errObj = error as { name?: string } | null;
      if (errObj?.name !== 'AbortError') {
        console.error('Error al compartir la imagen:', error);
      }
    } finally {
      setCompartiendo(false);
    }
  };

  // Manejo de teclado: Escape, flechas izquierda y derecha
  useEffect(() => {
    if (fotoActivaIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrarLightbox();
      } else if (e.key === 'ArrowRight') {
        fotoSiguiente();
      } else if (e.key === 'ArrowLeft') {
        fotoAnterior();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fotoActivaIndex, cerrarLightbox, fotoSiguiente, fotoAnterior]);

  // Prevenir scroll en el fondo cuando el visor de evidencias está abierto
  useEffect(() => {
    if (!fotoActual) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [fotoActual]);

  const obtenerEtiquetaFoto = (index: number) => {
    if (fotosValidas.length === 2) {
      return index === 0 ? 'Foto Inicial' : 'Foto Final';
    }
    return `Evidencia ${index + 1}`;
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {titulo && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
          <Camera className="w-3.5 h-3.5 text-sky-600" />
          <span>{titulo}</span>
          <span className="text-slate-400 font-normal">({fotosValidas.length})</span>
        </div>
      )}

      {fotosValidas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
          <p className="text-sm font-medium text-slate-500">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {fotosValidas.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              onClick={() => {
                setFotoActivaIndex(idx);
                setRotacion(0);
              }}
              className="rounded-xl overflow-hidden border border-slate-200 aspect-square group relative cursor-pointer bg-slate-100 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all"
            >
              <img
                src={url}
                alt={obtenerEtiquetaFoto(idx)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />

              {/* Etiqueta tipo badge en esquina inferior */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-semibold truncate block text-center">
                  {obtenerEtiquetaFoto(idx)}
                </span>
              </div>

              {/* Overlay en hover */}
              <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity duration-150">
                <ZoomIn className="w-6 h-6 stroke-[2.5]" />
                <span className="text-[11px] font-bold tracking-tight">Ver ampliada</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL VISOR LIGHTBOX ─── */}
      {fotoActual && typeof document !== 'undefined' && createPortal(
        <div
          onClick={cerrarLightbox}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-[121] bg-slate-950 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Barra superior de herramientas */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">
                  {obtenerEtiquetaFoto(fotoActivaIndex!)}
                </span>
                <span className="text-xs text-slate-400">
                  ({fotoActivaIndex! + 1} de {fotosValidas.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={rotarFoto}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Girar 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={compartiendo}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!fotoActual) return;
                    handleShare(
                      fotoActual,
                      `${obtenerEtiquetaFoto(fotoActivaIndex!)} - 24/7 Asistencias`
                    );
                  }}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  title="Compartir fotografía (WhatsApp / Dispositivo)"
                >
                  {compartiendo ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={descargando}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!fotoActual) return;
                    handleDownload(
                      fotoActual,
                      `evidencia_${(fotoActivaIndex ?? 0) + 1}.jpg`
                    );
                  }}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  title="Descargar imagen en el dispositivo"
                >
                  {descargando ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={cerrarLightbox}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-rose-600/80 transition-colors cursor-pointer ml-1"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Contenedor de la fotografía en alta resolución */}
            <div className="relative flex-1 min-h-[300px] max-h-[70vh] sm:max-h-[75vh] flex items-center justify-center bg-black/60 p-4 overflow-hidden">
              <img
                src={fotoActual}
                alt={obtenerEtiquetaFoto(fotoActivaIndex!)}
                style={{ transform: `rotate(${rotacion}deg)` }}
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg transition-transform duration-200 select-none"
              />

              {/* Botón Navegación Anterior */}
              {fotosValidas.length > 1 && (
                <button
                  type="button"
                  onClick={fotoAnterior}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Foto anterior (←)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Botón Navegación Siguiente */}
              {fotosValidas.length > 1 && (
                <button
                  type="button"
                  onClick={fotoSiguiente}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-sky-600 text-white shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Foto siguiente (→)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Pie con selector de miniaturas si hay más de 1 foto */}
            {fotosValidas.length > 1 && (
              <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-center gap-2 overflow-x-auto">
                {fotosValidas.map((thumb, idx) => (
                  <button
                    key={`thumb-${idx}`}
                    type="button"
                    onClick={() => {
                      setFotoActivaIndex(idx);
                      setRotacion(0);
                    }}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                      idx === fotoActivaIndex
                        ? 'border-sky-400 ring-2 ring-sky-400/40 scale-105'
                        : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={thumb} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
