import type { Afiliado, AfiliadoDireccion } from '../types';

/**
 * Devuelve la lista normalizada de direcciones de un afiliado.
 * Si el backend aún no retorna `direcciones`, construye 1 entrada principal
 * a partir de los campos raíz (`direccion`, `distrito`, `referencia`).
 */
export function obtenerDireccionesAfiliado(afiliado?: Afiliado | null): AfiliadoDireccion[] {
  if (!afiliado) return [];
  if (afiliado.direcciones && afiliado.direcciones.length > 0) {
    return afiliado.direcciones;
  }
  if (!afiliado.direccion && !afiliado.distrito) {
    return [];
  }
  return [
    {
      id: 0,
      etiqueta: 'Principal',
      direccion: afiliado.direccion || '',
      distrito: afiliado.distrito || '',
      referencia: afiliado.referencia || '',
      esPrincipal: true,
    },
  ];
}

/**
 * Obtiene la dirección principal de un afiliado (o la primera disponible).
 */
export function obtenerDireccionPrincipal(afiliado?: Afiliado | null): AfiliadoDireccion | null {
  const lista = obtenerDireccionesAfiliado(afiliado);
  if (lista.length === 0) return null;
  return lista.find((d) => d.esPrincipal) || lista[0];
}
