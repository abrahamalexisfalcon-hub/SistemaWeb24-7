import {
  comprimirImagen as comprimirImagenNativa,
  comprimirImagenConDetalle,
  type CompresionResultado,
} from './imageCompression';

export type { CompresionResultado };
export { comprimirImagenNativa };

/**
 * Comprime imágenes en el cliente antes de subirlas al servidor o convertirlas a base64.
 * - Resolución máxima: 1280 px
 * - Calidad: 0.80 (JPEG)
 * - Peso objetivo: < 800 KB (garantizado < 1 MB)
 */
export async function comprimirImagen(archivo: File): Promise<CompresionResultado> {
  return comprimirImagenConDetalle(archivo, 1280, 1280, 0.80);
}
