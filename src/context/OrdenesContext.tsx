import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { tecnicoApi } from '../api';
import type { OrdenResumenTecnico, PerfilTecnico } from '../types';
import { notificarNuevaOrden } from '../utils/notifications';
import { toast } from 'sonner';

interface OrdenesContextType {
  ordenes: OrdenResumenTecnico[];
  perfil: PerfilTecnico | null;
  loading: boolean;
  isFetching: boolean;
  hasError: boolean;
  errorMessage: string | null;
  lastFetched: number | null;
  cargarOrdenes: (force?: boolean) => Promise<void>;
  refrescar: () => Promise<void>;
  invalidarCache: () => void;
  actualizarOrdenLocal: (ordenActualizada: Partial<OrdenResumenTecnico> & { id: number }) => void;
  getOrdenById: (id: number) => OrdenResumenTecnico | undefined;
}

const OrdenesContext = createContext<OrdenesContextType | undefined>(undefined);

// 5 minutos de tiempo de frescura (staleTime) para navegación instantánea (0 ms)
const STALE_TIME = 5 * 60 * 1000;

export const OrdenesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [ordenes, setOrdenes] = useState<OrdenResumenTecnico[]>([]);
  const [perfil, setPerfil] = useState<PerfilTecnico | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Referencias para evitar condiciones de carrera en peticiones concurrentes
  const fetchingRef = useRef(false);
  const lastFetchedRef = useRef<number | null>(null);
  const lastUserIdRef = useRef<number | null>(null);
  const knownOrderIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);
  const ordenesRef = useRef<OrdenResumenTecnico[]>([]);
  ordenesRef.current = ordenes;

  const getFinalizadasIds = (userId?: number): number[] => {
    try {
      if (userId) {
        const userScoped = localStorage.getItem(`ordenes_finalizadas_ids_${userId}`);
        if (userScoped) return JSON.parse(userScoped);
      }
      return JSON.parse(localStorage.getItem('ordenes_finalizadas_ids') || '[]');
    } catch {
      return [];
    }
  };

  const cargarOrdenes = useCallback(
    async (force: boolean = false) => {
      // 1. Si no hay usuario autenticado, no procesar
      if (!user) {
        setLoading(false);
        return;
      }

      // Si cambió el usuario activo, resetear inmediatamente la memoria para aislamiento estricto
      if (lastUserIdRef.current !== user.usuarioId) {
        lastUserIdRef.current = user.usuarioId;
        setOrdenes([]);
        setPerfil(null);
        lastFetchedRef.current = null;
        setLastFetched(null);
        knownOrderIdsRef.current = new Set();
        isFirstLoadRef.current = true;
        setHasError(false);
        setErrorMessage(null);
        force = true;
      }

      const now = Date.now();
      const yaCargado = ordenesRef.current.length > 0;
      const datosFrescos = lastFetchedRef.current !== null && now - lastFetchedRef.current < STALE_TIME;

      // 2. Si no es forzado y los datos en memoria están vigentes, responder en 0 ms
      if (!force && yaCargado && datosFrescos) {
        setLoading(false);
        return;
      }

      // 3. Evitar peticiones paralelas simultáneas
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      // 4. Solo mostrar loading inicial cuando no existen datos previos en memoria
      if (!yaCargado) {
        setLoading(true);
      } else {
        setIsFetching(true);
      }

      const finalizadasIds = getFinalizadasIds(user.usuarioId);

      try {
        const tecnicoId = user.usuarioId || 1;
        const [resOrdenes, resPerfil] = await Promise.allSettled([
          tecnicoApi.getOrdenes(tecnicoId),
          tecnicoApi.getPerfil(),
        ]);

        if (resOrdenes.status === 'fulfilled' && Array.isArray(resOrdenes.value)) {
          const nuevasOrdenes = resOrdenes.value;
          // Asignar fielmente las órdenes del técnico autenticado
          const mapeadas = nuevasOrdenes.map((o) =>
            finalizadasIds.includes(o.id) ? { ...o, estado: 'FINALIZADA' as const } : o
          );

          // Detectar nuevas órdenes asignadas para emitir toast visible + chime
          if (!isFirstLoadRef.current) {
            nuevasOrdenes.forEach((orden) => {
              if (
                !knownOrderIdsRef.current.has(orden.id) &&
                (orden.estado === 'PENDIENTE' || (orden.estado as string) === 'ASIGNADA')
              ) {
                notificarNuevaOrden(orden.codigoOrden, orden.tipoServicio);
              }
            });
          } else {
            isFirstLoadRef.current = false;
          }

          // Registrar identificadores conocidos
          nuevasOrdenes.forEach((o) => knownOrderIdsRef.current.add(o.id));

          setOrdenes(mapeadas);
          setHasError(false);
          setErrorMessage(null);
        } else if (resOrdenes.status === 'rejected') {
          setHasError(true);
          setErrorMessage('No pudimos sincronizar la información');
          if (yaCargado) {
            toast.warning('Modo fuera de línea: Mostrando órdenes guardadas en memoria.', {
              id: 'offline-warning',
              duration: 3500,
            });
          } else {
            setOrdenes([]);
          }
        }

        if (resPerfil.status === 'fulfilled' && resPerfil.value) {
          setPerfil(resPerfil.value);
        }

        lastFetchedRef.current = Date.now();
        setLastFetched(lastFetchedRef.current);
      } catch (err: unknown) {
        console.warn('Carga de órdenes en segundo plano:', err);
        setHasError(true);
        setErrorMessage('No pudimos sincronizar la información');
        if (!yaCargado) {
          setOrdenes([]);
        }
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setIsFetching(false);
      }
    },
    [user]
  );

  // Recarga manual explícita (invalida y fuerza llamada a backend)
  const refrescar = useCallback(async () => {
    lastFetchedRef.current = null;
    setLastFetched(null);
    await cargarOrdenes(true);
  }, [cargarOrdenes]);

  // Invalidación puntual de la caché
  const invalidarCache = useCallback(() => {
    lastFetchedRef.current = null;
    setLastFetched(null);
  }, []);

  // Actualización optimista inmediata en memoria de una orden
  const actualizarOrdenLocal = useCallback(
    (ordenActualizada: Partial<OrdenResumenTecnico> & { id: number }) => {
      setOrdenes((prev) =>
        prev.map((o) => (o.id === ordenActualizada.id ? { ...o, ...ordenActualizada } : o))
      );
    },
    []
  );

  // Consulta puntual en memoria
  const getOrdenById = useCallback(
    (id: number) => {
      return ordenesRef.current.find((o) => o.id === id);
    },
    []
  );

  // Carga inicial al autenticar o cambiar de usuario
  useEffect(() => {
    if (user) {
      if (lastUserIdRef.current !== user.usuarioId) {
        lastUserIdRef.current = user.usuarioId;
        setOrdenes([]);
        setPerfil(null);
        lastFetchedRef.current = null;
        setLastFetched(null);
      }
      cargarOrdenes(false);
    } else {
      setOrdenes([]);
      setPerfil(null);
      setLastFetched(null);
      lastFetchedRef.current = null;
      lastUserIdRef.current = null;
      setLoading(false);
    }
  }, [user, cargarOrdenes]);

  // Sondeo en segundo plano (polling cada 35 segundos si la pestaña está activa)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        cargarOrdenes(true);
      }
    }, 35000);

    return () => clearInterval(interval);
  }, [user, cargarOrdenes]);

  return (
    <OrdenesContext.Provider
      value={{
        ordenes,
        perfil,
        loading,
        isFetching,
        hasError,
        errorMessage,
        lastFetched,
        cargarOrdenes,
        refrescar,
        invalidarCache,
        actualizarOrdenLocal,
        getOrdenById,
      }}
    >
      {children}
    </OrdenesContext.Provider>
  );
};

export const useOrdenes = (): OrdenesContextType => {
  const context = useContext(OrdenesContext);
  if (!context) {
    throw new Error('useOrdenes debe ser utilizado dentro de un OrdenesProvider');
  }
  return context;
};
