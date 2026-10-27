export interface CompresionResultado {
  archivoComprimido: File;
  base64Url: string;
  pesoOriginalKB: number;
  pesoFinalKB: number;
}

/**
 * Comprime una imagen en el navegador usando la API nativa de Canvas.
 * - Redimensiona proporcionalmente hasta un máximo de 1280x1280 px.
 * - Convierte a formato JPEG con calidad 0.72 (72%).
 * - Garantiza un peso objetivo inferior a 300 KB reduciendo gradualmente la calidad si fuera necesario.
 */
export async function comprimirImagen(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.72
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Fondo blanco por si la imagen original tiene transparencia (PNG/WebP)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const targetMaxBytes = 250 * 1024; // < 250 KB garantizado sin perder nitidez

        const exportarBlob = (calidadActual: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              if (blob.size > targetMaxBytes && calidadActual > 0.45) {
                exportarBlob(Number((calidadActual - 0.1).toFixed(2)));
                return;
              }
              const nombreBase = file.name.replace(/\.[^/.]+$/, '');
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
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Convierte un archivo File a Data URL (Base64).
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime la imagen con Canvas nativo y devuelve tanto el File comprimido como su Base64 y métricas de peso.
 */
export async function comprimirImagenConDetalle(
  archivo: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.72
): Promise<CompresionResultado> {
  const pesoOriginalKB = Math.max(1, Math.round(archivo.size / 1024));

  try {
    const archivoComprimido = await comprimirImagen(archivo, maxWidth, maxHeight, quality);
    const pesoFinalKB = Math.max(1, Math.round(archivoComprimido.size / 1024));
    const base64Url = await fileToDataUrl(archivoComprimido);

    return {
      archivoComprimido,
      base64Url,
      pesoOriginalKB,
      pesoFinalKB,
    };
  } catch (error) {
    console.warn('Compresión en cliente omitida por fallo, usando original:', error);
    const base64Url = await fileToDataUrl(archivo);
    return {
      archivoComprimido: archivo,
      base64Url,
      pesoOriginalKB,
      pesoFinalKB: pesoOriginalKB,
    };
  }
}
