import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSignatureChange?: (dataUrl: string | null) => void;
}

export interface SignaturePadRef {
  getSignature: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

// Recorte de bordes transparentes nativo (evita incompatibilidad ESM/CJS de trim-canvas en Vite)
function trimCanvasNatively(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return canvas;
  }

  try {
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX === -1 || maxY === -1) {
      return canvas;
    }

    const padding = 8;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
    const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

    const trimmed = document.createElement('canvas');
    trimmed.width = cropWidth;
    trimmed.height = cropHeight;
    const trimmedCtx = trimmed.getContext('2d');
    if (trimmedCtx) {
      trimmedCtx.drawImage(
        canvas,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
      return trimmed;
    }
  } catch (err) {
    console.warn('Fallback al recortar canvas nativamente:', err);
  }

  return canvas;
}

export const SignaturePad = React.forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSignatureChange }, ref) => {
    const sigCanvasRef = useRef<SignatureCanvas | null>(null);
    const [hasSignature, setHasSignature] = useState(false);

    const getSignatureDataUrl = (): string | null => {
      if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
        return null;
      }
      try {
        const rawCanvas = sigCanvasRef.current.getCanvas();
        const trimmed = trimCanvasNatively(rawCanvas);
        return trimmed.toDataURL('image/png');
      } catch (err) {
        console.warn('Fallback exportando canvas:', err);
        try {
          return sigCanvasRef.current.getCanvas().toDataURL('image/png');
        } catch {
          return null;
        }
      }
    };

    // Adaptador de métodos expuestos vía ref
    React.useImperativeHandle(ref, () => ({
      getSignature: () => {
        return getSignatureDataUrl();
      },
      clear: () => {
        handleClear();
      },
      isEmpty: () => {
        return !sigCanvasRef.current || sigCanvasRef.current.isEmpty();
      },
    }));

    const handleClear = () => {
      if (sigCanvasRef.current) {
        sigCanvasRef.current.clear();
        setHasSignature(false);
        onSignatureChange?.(null);
      }
    };

    const handleEnd = () => {
      if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        setHasSignature(true);
        const dataUrl = getSignatureDataUrl();
        onSignatureChange?.(dataUrl);
      }
    };

    // Redimensionar canvas manteniendo DPI en móvil
    useEffect(() => {
      const resizeCanvas = () => {
        if (sigCanvasRef.current) {
          const canvas = sigCanvasRef.current.getCanvas();
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          const width = canvas.parentElement?.clientWidth || 300;
          const height = 140;

          canvas.width = width * ratio;
          canvas.height = height * ratio;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(ratio, ratio);
          }
        }
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    return (
      <div className="relative w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="#111827"
          velocityFilterWeight={0.7}
          minWidth={1.5}
          maxWidth={3.5}
          canvasProps={{
            className: 'w-full h-[140px] touch-none cursor-crosshair',
          }}
          onEnd={handleEnd}
        />

        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs italic">
            Firme aquí con el dedo o lápiz táctil
          </div>
        )}

        <div className="absolute bottom-2.5 right-3">
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
          >
            Borrar
          </button>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
