import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { adminApi } from '../../api';
import { useEspecialidades, useAutoRefresh } from '../../hooks';
import type {
  OrdenDetalleAdmin,
  Afiliado,
  TecnicoResumen,
  CrearTecnicoRequest,
  ActualizarTecnicoRequest,
  CrearOrdenRequest,
  ReaperturarOrdenRequest,
  CrearAfiliadoRequest,
  ActualizarAfiliadoRequest,
  Cuenta,
} from '../../types';
import type { AdminTab } from '../../components/admin';
import type { FiltroOrdenes } from './tabs';

export const obtenerFechaHoraActualLocal = (): string => {
  const ahora = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
};

export function useAdminDashboard() {
  // Tabs y Filtros
  const [activeTab, setActiveTab] = useState<AdminTab>('ordenes');
  const [filtroActivo, setFiltroActivo] = useState<FiltroOrdenes>('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Datos principales
  const [ordenes, setOrdenes] = useState<OrdenDetalleAdmin[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoResumen[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cargandoCuentas, setCargandoCuentas] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Estados de Modales
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenDetalleAdmin | null>(null);
  const [mostrarHojaServicio, setMostrarHojaServicio] = useState<boolean>(false);
  const [modalPerfilAdmin, setModalPerfilAdmin] = useState<boolean>(false);
  const [modalNuevoAfiliado, setModalNuevoAfiliado] = useState<boolean>(false);
  const [afiliadoAEditar, setAfiliadoAEditar] = useState<Afiliado | null>(null);
  const [modalAnularOrden, setModalAnularOrden] = useState<boolean>(false);
  const [anulando, setAnulando] = useState<boolean>(false);
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null);
  const [modalReaperturarOrden, setModalReaperturarOrden] = useState<boolean>(false);
  const [ordenAReaperturar, setOrdenAReaperturar] = useState<OrdenDetalleAdmin | null>(null);
  const [reaperturando, setReaperturando] = useState<boolean>(false);
  const [errorReapertura, setErrorReapertura] = useState<string | null>(null);

  // Modales de Técnicos
  const [modalNuevoTecnico, setModalNuevoTecnico] = useState<boolean>(false);
  const [modalEditarTecnico, setModalEditarTecnico] = useState<boolean>(false);
  const [tecnicoAEditar, setTecnicoAEditar] = useState<TecnicoResumen | null>(null);
  const [togglingTecnicoId, setTogglingTecnicoId] = useState<number | null>(null);

  // Modales de Especialidades, Materiales y Cuentas
  const [modalNuevaEspecialidad, setModalNuevaEspecialidad] = useState<boolean>(false);
  const [guardandoEspecialidad, setGuardandoEspecialidad] = useState<boolean>(false);
  const [modalGestionMateriales, setModalGestionMateriales] = useState<boolean>(false);
  const [modalGestionCuentas, setModalGestionCuentas] = useState<boolean>(false);

  // Hook centralizado para Especialidades dinámicas
  const {
    especialidades: especialidadesObj,
    cargando: cargandoEspecialidades,
    crearEspecialidad,
    recargar: recargarEspecialidades,
  } = useEspecialidades();

  const especialidades = useMemo(
    () => especialidadesObj.map((e) => e.nombre),
    [especialidadesObj]
  );

  // Formulario Nueva Orden
  const [nuevaOrden, setNuevaOrden] = useState<CrearOrdenRequest>({
    tipoServicio: '',
    afiliadoId: 0,
    tecnicoId: 0,
    cuentaId: 0,
    numeroCaso: '',
    numeroOt: '',
    fechaPactada: obtenerFechaHoraActualLocal(),
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formExito, setFormExito] = useState<string | null>(null);

  // Sincronizar especialidad por defecto en nuevaOrden
  useEffect(() => {
    if (especialidades.length > 0 && !nuevaOrden.tipoServicio) {
      setNuevaOrden((prev) => (prev.tipoServicio ? prev : { ...prev, tipoServicio: especialidades[0] }));
    }
  }, [especialidades, nuevaOrden.tipoServicio]);

  const recargarCuentas = useCallback(async () => {
    setCargandoCuentas(true);
    try {
      const lista = await adminApi.getCuentas(false);
      const activas = Array.isArray(lista) ? lista.filter((c) => c.activo !== false) : [];
      setCuentas(activas);
      if (activas.length > 0) {
        setNuevaOrden((prev) => ({
          ...prev,
          cuentaId: prev.cuentaId && activas.some((c) => c.id === prev.cuentaId) ? prev.cuentaId : activas[0].id,
        }));
      }
    } catch (err) {
      console.warn('Error al cargar cuentas:', err);
    } finally {
      setCargandoCuentas(false);
    }
  }, []);

  // Seguimiento de estados previos de órdenes para notificaciones de finalización en tiempo real
  const estadosOrdenesPreviosRef = useRef<Map<number, string>>(new Map());
  const cargaInicialCompletadaRef = useRef<boolean>(false);

  // Carga y sincronización silenciosa de datos (inicial, manual y polling cada 20s)
  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setIsFetching(true);

    try {
      const [ordenesRes, afiliadosRes, tecnicosRes, cuentasRes] = await Promise.allSettled([
        adminApi.getOrdenes(),
        adminApi.getAfiliados(),
        adminApi.getTecnicos(),
        adminApi.getCuentas(false),
      ]);

      if (ordenesRes.status === 'fulfilled') {
        const nuevasOrdenes = ordenesRes.value || [];

        if (cargaInicialCompletadaRef.current) {
          nuevasOrdenes.forEach((o) => {
            if (!o || typeof o.id !== 'number') return;
            const estadoPrevio = estadosOrdenesPreviosRef.current.get(o.id);
            if (estadoPrevio && estadoPrevio !== 'FINALIZADA' && o.estado === 'FINALIZADA') {
              const etiquetaOrden = o.numeroOt || o.numeroCaso || `#${o.codigoOrden}`;
              toast.success(`Orden ${etiquetaOrden} ha sido finalizada por el técnico.`);
            }
          });
        }

        const nuevoMapa = new Map<number, string>();
        nuevasOrdenes.forEach((o) => {
          if (o && typeof o.id === 'number') {
            nuevoMapa.set(o.id, o.estado);
          }
        });
        estadosOrdenesPreviosRef.current = nuevoMapa;
        cargaInicialCompletadaRef.current = true;

        setOrdenes(nuevasOrdenes);
        setOrdenSeleccionada((prev) =>
          prev ? nuevasOrdenes.find((o) => o.id === prev.id) || prev : null
        );
      }

      if (afiliadosRes.status === 'fulfilled') {
        setAfiliados(afiliadosRes.value || []);
        if ((afiliadosRes.value || []).length > 0) {
          setNuevaOrden((prev) => ({ ...prev, afiliadoId: prev.afiliadoId || afiliadosRes.value[0].id }));
        }
      }

      if (tecnicosRes.status === 'fulfilled') {
        setTecnicos(tecnicosRes.value || []);
        if ((tecnicosRes.value || []).length > 0) {
          setNuevaOrden((prev) => ({ ...prev, tecnicoId: prev.tecnicoId || tecnicosRes.value[0].id }));
        }
      }

      if (cuentasRes.status === 'fulfilled') {
        const activas = (cuentasRes.value || []).filter((c) => c.activo !== false);
        setCuentas(activas);
        if (activas.length > 0) {
          setNuevaOrden((prev) => ({ ...prev, cuentaId: prev.cuentaId || activas[0].id }));
        }
      }

      if (!silencioso) {
        recargarEspecialidades();
      }
    } catch (err) {
      console.warn('Error cargando datos de administración:', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [recargarEspecialidades]);

  const refrescarManual = useCallback(async () => {
    await cargarDatos(true);
    recargarEspecialidades();
  }, [cargarDatos, recargarEspecialidades]);

  useEffect(() => {
    void cargarDatos(false);
  }, [cargarDatos]);

  // Polling inteligente centralizado cada 20 segundos con pausa en pestaña oculta
  useAutoRefresh(() => cargarDatos(true), { intervalMs: 20000, enabled: true });

  // Handlers
  const handleCrearOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormExito(null);

    const casoLimpio = (nuevaOrden.numeroCaso || '').trim();
    const otLimpio = (nuevaOrden.numeroOt || '').trim();

    if (!nuevaOrden.cuentaId) {
      setFormError('Por favor selecciona una Cuenta / Aseguradora para la orden.');
      return;
    }

    if (!casoLimpio) {
      setFormError('El Número de Caso es obligatorio.');
      return;
    }

    if (!otLimpio) {
      setFormError('El Número de OT es obligatorio.');
      return;
    }

    if (!nuevaOrden.fechaPactada) {
      setFormError('La Fecha y Hora Pactada del servicio es obligatoria.');
      return;
    }

    const fechaSeleccionada = new Date(nuevaOrden.fechaPactada);
    const ahoraMinuto = new Date();
    ahoraMinuto.setSeconds(0, 0);
    if (isNaN(fechaSeleccionada.getTime()) || fechaSeleccionada < ahoraMinuto) {
      setFormError('La fecha y hora pactada no puede estar en el pasado.');
      return;
    }

    if (!nuevaOrden.afiliadoId || !nuevaOrden.tecnicoId) {
      setFormError('Por favor selecciona un afiliado y un técnico para la orden.');
      return;
    }

    const fechaIsoPayload =
      nuevaOrden.fechaPactada.length === 16
        ? `${nuevaOrden.fechaPactada}:59`
        : nuevaOrden.fechaPactada;

    setSubmitting(true);
    try {
      const creada = await adminApi.crearOrden({
        ...nuevaOrden,
        numeroCaso: casoLimpio,
        numeroOt: otLimpio,
        fechaPactada: fechaIsoPayload,
      });
      setOrdenes((prev) => [creada, ...prev]);
      setNuevaOrden((prev) => ({
        ...prev,
        numeroCaso: '',
        numeroOt: '',
        fechaPactada: obtenerFechaHoraActualLocal(),
      }));
      setFormExito(`¡Orden #${creada.codigoOrden} (Caso: ${creada.numeroCaso || casoLimpio}) creada exitosamente!`);
      setTimeout(() => {
        setFormExito(null);
        setActiveTab('ordenes');
      }, 1500);
    } catch (err: any) {
      const validaciones = Array.isArray(err?.response?.data?.validaciones)
        ? err.response.data.validaciones.join(' | ')
        : null;
      setFormError(
        validaciones ||
          err?.response?.data?.message ||
          'Error al crear la orden. Verifica que el Número de Caso y OT no estén duplicados.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrearAfiliado = async (nuevoAfiliado: CrearAfiliadoRequest) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const creado = await adminApi.crearAfiliado(nuevoAfiliado);
      setAfiliados((prev) => [creado, ...prev]);
      setNuevaOrden((prev) => ({ ...prev, afiliadoId: creado.id }));
      setModalNuevoAfiliado(false);
      setAfiliadoAEditar(null);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al registrar el afiliado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuardarEditarAfiliado = async (id: number, datos: ActualizarAfiliadoRequest) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const actualizado = await adminApi.actualizarAfiliado(id, datos);
      setAfiliados((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...actualizado } : a))
      );
      setModalNuevoAfiliado(false);
      setAfiliadoAEditar(null);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al actualizar el afiliado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminarAfiliado = async (id: number) => {
    try {
      await adminApi.eliminarAfiliado(id);
      setAfiliados((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al dar de baja al afiliado.');
    }
  };

  const handleConfirmarAnulacion = async (motivoAnulacion: string) => {
    if (!ordenSeleccionada || motivoAnulacion.trim().length < 5) return;
    setAnulando(true);
    setErrorAnulacion(null);
    try {
      const ordenActualizada = await adminApi.cancelarOrden(ordenSeleccionada.id, motivoAnulacion.trim());
      setOrdenes((prev) =>
        prev.map((o) =>
          o.id === ordenSeleccionada.id
            ? {
                ...o,
                ...ordenActualizada,
                estado: 'CANCELADA',
                motivoCancelacion: motivoAnulacion.trim(),
                fechaCancelacion: ordenActualizada.fechaCancelacion || new Date().toISOString(),
              }
            : o
        )
      );
      setModalAnularOrden(false);
      setOrdenSeleccionada(null);
    } catch (err: any) {
      setErrorAnulacion(
        err?.response?.data?.message || 'Error al anular la orden. Intente nuevamente.'
      );
    } finally {
      setAnulando(false);
    }
  };

  const handleActualizarObservacionCancelacion = async (ordenId: number, nuevaObservacion: string) => {
    const observacionLimpia = nuevaObservacion.trim();
    if (!observacionLimpia) return;
    const actualizada = await adminApi.actualizarObservacionCancelacion(ordenId, observacionLimpia);
    setOrdenes((prev) =>
      prev.map((o) =>
        o.id === ordenId
          ? {
              ...o,
              ...actualizada,
              motivoCancelacion: actualizada.motivoCancelacion || observacionLimpia,
            }
          : o
      )
    );
    setOrdenSeleccionada((prev) =>
      prev && prev.id === ordenId
        ? {
            ...prev,
            ...actualizada,
            motivoCancelacion: actualizada.motivoCancelacion || observacionLimpia,
          }
        : prev
    );
  };

  const handleAbrirReaperturarOrden = useCallback((orden: OrdenDetalleAdmin) => {
    setErrorReapertura(null);
    setOrdenAReaperturar(orden);
    setModalReaperturarOrden(true);
  }, []);

  const handleConfirmarReapertura = async (ordenId: number, data: ReaperturarOrdenRequest) => {
    setReaperturando(true);
    setErrorReapertura(null);
    try {
      const ordenReaperturada = await adminApi.reaperturarOrden(ordenId, data);
      setOrdenes((prev) =>
        prev.map((o) =>
          o.id === ordenId
            ? {
                ...o,
                ...ordenReaperturada,
                estado: 'PENDIENTE',
                fechaLlegada: undefined,
                fechaFinalizacion: undefined,
                fechaCancelacion: undefined,
              }
            : o
        )
      );
      setOrdenSeleccionada((prev) =>
        prev && prev.id === ordenId
          ? {
              ...prev,
              ...ordenReaperturada,
              estado: 'PENDIENTE',
              fechaLlegada: undefined,
              fechaFinalizacion: undefined,
              fechaCancelacion: undefined,
            }
          : prev
      );
      setModalReaperturarOrden(false);
      setOrdenAReaperturar(null);
      toast.success(
        `¡Orden #${ordenReaperturada.codigoOrden || ordenId} reaperturada y asignada exitosamente!`
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.mensaje ||
        'Error al reaperturar la orden. Verifica que la fecha sea futura e inténtalo de nuevo.';
      setErrorReapertura(msg);
      toast.error(msg);
    } finally {
      setReaperturando(false);
    }
  };

  const handleCrearTecnico = async (nuevoTecnico: CrearTecnicoRequest) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const creado = await adminApi.crearTecnico(nuevoTecnico);
      setTecnicos((prev) => [creado, ...prev]);
      setModalNuevoTecnico(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al registrar técnico.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstadoTecnico = async (tecnico: TecnicoResumen) => {
    setTogglingTecnicoId(tecnico.id);
    const nuevoEstado = !tecnico.activo;
    setTecnicos((prev) =>
      prev.map((t) => (t.id === tecnico.id ? { ...t, activo: nuevoEstado, disponible: nuevoEstado ? t.disponible : false } : t))
    );
    if (tecnicoAEditar && tecnicoAEditar.id === tecnico.id) {
      setTecnicoAEditar((prev) => (prev ? { ...prev, activo: nuevoEstado, disponible: nuevoEstado ? prev.disponible : false } : null));
    }
    try {
      const res = await adminApi.actualizarEstadoTecnico(tecnico.id, nuevoEstado);
      setTecnicos((prev) =>
        prev.map((t) => (t.id === tecnico.id ? { ...t, ...res } : t))
      );
      if (tecnicoAEditar && tecnicoAEditar.id === tecnico.id) {
        setTecnicoAEditar((prev) => (prev ? { ...prev, ...res } : null));
      }
    } catch (err: any) {
      setTecnicos((prev) =>
        prev.map((t) => (t.id === tecnico.id ? { ...t, activo: tecnico.activo } : t))
      );
      if (tecnicoAEditar && tecnicoAEditar.id === tecnico.id) {
        setTecnicoAEditar((prev) => (prev ? { ...prev, activo: tecnico.activo } : null));
      }
      alert(err?.response?.data?.message || 'Error al actualizar el estado del técnico.');
    } finally {
      setTogglingTecnicoId(null);
    }
  };

  const handleGuardarEditarTecnico = async (datos: ActualizarTecnicoRequest) => {
    if (!tecnicoAEditar) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const actualizado = await adminApi.actualizarTecnico(tecnicoAEditar.id, datos);
      setTecnicos((prev) =>
        prev.map((t) => (t.id === tecnicoAEditar.id ? { ...t, ...actualizado } : t))
      );
      setModalEditarTecnico(false);
      setTecnicoAEditar(null);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al actualizar datos del técnico.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrearEspecialidad = async (nombreLimpio: string) => {
    if (!nombreLimpio) return;
    setGuardandoEspecialidad(true);
    try {
      const creada = await crearEspecialidad(nombreLimpio);
      const nombreFinal = creada.nombre || nombreLimpio;
      setNuevaOrden((prev) => ({ ...prev, tipoServicio: nombreFinal }));
      setModalNuevaEspecialidad(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al crear la especialidad.');
    } finally {
      setGuardandoEspecialidad(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    busqueda,
    setBusqueda,
    filtroActivo,
    setFiltroActivo,
    ordenes,
    afiliados,
    tecnicos,
    cuentas,
    cargandoCuentas,
    recargarCuentas,
    loading,
    isFetching,
    refrescarManual,
    especialidades,
    cargandoEspecialidades,
    recargarEspecialidades,
    nuevaOrden,
    setNuevaOrden,
    submitting,
    formError,
    setFormError,
    formExito,
    ordenSeleccionada,
    setOrdenSeleccionada,
    mostrarHojaServicio,
    setMostrarHojaServicio,
    modalPerfilAdmin,
    setModalPerfilAdmin,
    modalNuevoAfiliado,
    setModalNuevoAfiliado,
    afiliadoAEditar,
    setAfiliadoAEditar,
    modalAnularOrden,
    setModalAnularOrden,
    anulando,
    errorAnulacion,
    setErrorAnulacion,
    modalReaperturarOrden,
    setModalReaperturarOrden,
    ordenAReaperturar,
    setOrdenAReaperturar,
    reaperturando,
    errorReapertura,
    setErrorReapertura,
    modalNuevoTecnico,
    setModalNuevoTecnico,
    modalEditarTecnico,
    setModalEditarTecnico,
    tecnicoAEditar,
    setTecnicoAEditar,
    togglingTecnicoId,
    modalNuevaEspecialidad,
    setModalNuevaEspecialidad,
    guardandoEspecialidad,
    modalGestionMateriales,
    setModalGestionMateriales,
    modalGestionCuentas,
    setModalGestionCuentas,
    handleCrearOrden,
    handleCrearAfiliado,
    handleGuardarEditarAfiliado,
    handleEliminarAfiliado,
    handleConfirmarAnulacion,
    handleActualizarObservacionCancelacion,
    handleAbrirReaperturarOrden,
    handleConfirmarReapertura,
    handleCrearTecnico,
    handleToggleEstadoTecnico,
    handleGuardarEditarTecnico,
    handleCrearEspecialidad,
  };
}
