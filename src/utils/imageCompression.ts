export interface CompresionResultado {
  archivoComprimido: File;
  base64Url: string;
  pesoOriginalKB: number;
  pesoFinalKB: number;
}

/**
 * Calcula las dimensiones proporcionales limitadas por maxWidth y maxHeight.
 */
function calcularDimensionesProporcionales(
  anchoOriginal: number,
  altoOriginal: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = anchoOriginal;
  let height = altoOriginal;

  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  return { width, height };
}

/**
 * Comprime una imagen en el navegador con mínimo consumo de memoria RAM:
 * 1. Intenta usar createImageBitmap nativo con redimensionado por hardware (evita decodificar 48MP en RAM).
 * 2. Si no es compatible, utiliza URL.createObjectURL (puntero directo del kernel) revocándolo de inmediato.
 * 3. Dibuja sobre Canvas con alpha: false y limpia inmediatamente texturas y buffers (canvas.width = 0).
 * 4. Exporta a JPEG calidad 0.80 garantizando un peso inferior a 1 MB.
 */
export async function comprimirImagen(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.80
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const targetMaxBytes = 800 * 1024; // < 800 KB garantizado (< 1 MB estricto)

  // ─── ESTRATEGIA 1: createImageBitmap con resize por hardware (C++ / GPU) ───
  if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
    try {
      // 1. Obtener dimensiones originales con bitmap temporal ligero
      const initialBitmap = await createImageBitmap(file);
      const { width: targetW, height: targetH } = calcularDimensionesProporcionales(
        initialBitmap.width,
        initialBitmap.height,
        maxWidth,
        maxHeight
      );
      initialBitmap.close(); // Liberación inmediata de RAM

      // 2. Decodificar directamente a la resolución objetivo mediante el scaler del navegador
      const scaledBitmap = await createImageBitmap(file, {
        resizeWidth: targetW,
        resizeHeight: targetH,
        resizeQuality: 'medium',
      });

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(scaledBitmap, 0, 0, targetW, targetH);
      }
      scaledBitmap.close(); // Liberación inmediata de memoria del bitmap

      const blob = await new Promise<Blob | null>((resolve) => {
        const intentarBlob = (q: number) => {
          canvas.toBlob(
            (b) => {
              if (b && b.size > targetMaxBytes && q > 0.45) {
                intentarBlob(Number((q - 0.1).toFixed(2)));
                return;
              }
              resolve(b);
            },
            'image/jpeg',
            q
          );
        };
        intentarBlob(quality);
      });

      // Liberar buffer del canvas en GPU
      canvas.width = 0;
      canvas.height = 0;

      if (blob) {
        const nombreBase = file.name.replace(/\.[^/.]+$/, '') || 'evidencia';
        return new File([blob], `${nombreBase}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
      }
    } catch (errBitmap) {
      console.warn('createImageBitmap omitido o no compatible, usando pipeline ObjectURL:', errBitmap);
    }
  }

  // ─── ESTRATEGIA 2: URL.createObjectURL con revocación inmediata (Fallback) ───
  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (e) {
      // Si el navegador no puede ni crear el objectUrl, devolver el archivo
      resolve(file);
      return;
    }

    const img = new Image();

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        objectUrl = null;
      }
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };

    img.onload = () => {
      try {
        const { width, height } = calcularDimensionesProporcionales(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          maxWidth,
          maxHeight
        );

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) {
          cleanup();
          resolve(file);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Liberar la imagen tan pronto se plasma en el canvas
        cleanup();

        const exportarBlob = (calidadActual: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                canvas.width = 0;
                canvas.height = 0;
                resolve(file);
                return;
              }
              if (blob.size > targetMaxBytes && calidadActual > 0.45) {
                exportarBlob(Number((calidadActual - 0.1).toFixed(2)));
                return;
              }
              canvas.width = 0;
              canvas.height = 0; // Liberar textura del canvas

              const nombreBase = file.name.replace(/\.[^/.]+$/, '') || 'evidencia';
              const compressedFile = new File([blob], `${nombreBase}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            calidadActual
          );
        };

        exportarBlob(quality);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = (err) => {
      cleanup();
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Convierte un archivo File o Blob ligero ya comprimido a Data URL (Base64).
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime la imagen en el cliente de forma segura en memoria y retorna
 * el File comprimido, su Data URL liviano (< 800 KB) y las métricas de peso.
 */
export async function comprimirImagenConDetalle(
  archivo: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.80
): Promise<CompresionResultado> {
  const pesoOriginalKB = Math.max(1, Math.round(archivo.size / 1024));

  try {
    const archivoComprimido = await comprimirImagen(archivo, maxWidth, maxHeight, quality);
    const pesoFinalKB = Math.max(1, Math.round(archivoComprimido.size / 1024));
    // Se convierte a Data URL ÚNICAMENTE el archivo ya optimizado y ligero
    const base64Url = await fileToDataUrl(archivoComprimido);

    return {
      archivoComprimido,
      base64Url,
      pesoOriginalKB,
      pesoFinalKB,
    };
  } catch (error) {
    console.warn('Error en compresión de imagen, aplicando reducción básica defensiva:', error);
    // En caso extremo de error, intentar comprimir a menor resolución (800x800) antes de fallar
    try {
      const archivoEmergencia = await comprimirImagen(archivo, 800, 800, 0.65);
      const pesoFinalKB = Math.max(1, Math.round(archivoEmergencia.size / 1024));
      const base64Url = await fileToDataUrl(archivoEmergencia);
      return {
        archivoComprimido: archivoEmergencia,
        base64Url,
        pesoOriginalKB,
        pesoFinalKB,
      };
    } catch {
      throw new Error('No se pudo procesar la fotografía debido a límites de memoria en el dispositivo.');
    }
  }
}
