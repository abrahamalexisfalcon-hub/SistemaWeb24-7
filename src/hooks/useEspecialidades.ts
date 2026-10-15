import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api';
import type { Especialidad } from '../types';

export function useEspecialidades() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEspecialidades = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await adminApi.getEspecialidades();
      setEspecialidades(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al cargar especialidades:', err);
      setError(err?.response?.data?.message || 'Error al cargar especialidades.');
      setEspecialidades([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEspecialidades();
  }, [cargarEspecialidades]);

  const crearEspecialidad = useCallback(async (nombre: string): Promise<Especialidad> => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) throw new Error('El nombre de la especialidad es obligatorio.');
    const creada = await adminApi.crearEspecialidad(nombreLimpio);
    setEspecialidades((prev) => {
      if (prev.some((e) => e.id === creada.id || e.nombre.toLowerCase() === creada.nombre.toLowerCase())) {
        return prev;
      }
      return [...prev, creada];
    });
    return creada;
  }, []);

  return {
    especialidades,
    cargando,
    error,
    recargar: cargarEspecialidades,
    crearEspecialidad,
    setEspecialidades,
  };
}
