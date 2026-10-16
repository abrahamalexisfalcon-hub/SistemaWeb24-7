import imageCompression from 'browser-image-compression';

export interface CompresionResultado {
  archivoComprimido: File;
  base64Url: string;
  pesoOriginalKB: number;
  pesoFinalKB: number;
}

/**
 * Comprime imágenes en el cliente antes de subirlas al servidor o convertirlas a base64.
 * - maxSizeMB: 0.6 (máx 600 KB)
 * - maxWidthOrHeight: 1600 (alta resolución legible para auditorías)
 * - useWebWorker: true (evita congelar el hilo principal en móviles)
 */
export async function comprimirImagen(archivo: File): Promise<CompresionResultado> {
  const pesoOriginalKB = Math.round(archivo.size / 1024);

  const opciones = {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  };

  try {
    const archivoComprimido = await imageCompression(archivo, opciones);
    const pesoFinalKB = Math.round(archivoComprimido.size / 1024);
    const base64Url = await imageCompression.getDataUrlFromFile(archivoComprimido);

    return {
      archivoComprimido,
      base64Url,
      pesoOriginalKB,
      pesoFinalKB,
    };
  } catch (error) {
    console.warn('Compresión en cliente omitida por fallo, usando original:', error);
    const base64Url = await imageCompression.getDataUrlFromFile(archivo);
    return {
      archivoComprimido: archivo,
      base64Url,
      pesoOriginalKB,
      pesoFinalKB: pesoOriginalKB,
    };
  }
}
