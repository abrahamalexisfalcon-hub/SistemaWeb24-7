import type { TecnicoResumen } from '../types';

/**
 * Obtiene la lista normalizada y sin duplicados de especialidades de un técnico,
 * priorizando el arreglo `especialidades` y usando la cadena separada por comas
 * `especialidad` como respaldo.
 */
export function obtenerEspecialidadesTecnico(
  tecnico?: Pick<TecnicoResumen, 'especialidad' | 'especialidades'> | null,
  fallback: string[] = ['General']
): string[] {
  if (!tecnico) return fallback;

  const desdeLista = (tecnico.especialidades || [])
    .map((s) => s.trim())
    .filter(Boolean);
  if (desdeLista.length > 0) {
    return Array.from(new Set(desdeLista));
  }

  const desdeTexto = tecnico.especialidad
    ? tecnico.especialidad
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  if (desdeTexto.length > 0) {
    return Array.from(new Set(desdeTexto));
  }

  return fallback;
}
