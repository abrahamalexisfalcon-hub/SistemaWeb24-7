import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../api';
import { useEspecialidades } from '../../hooks';
import type {
  OrdenDetalleAdmin,
  Afiliado,
  TecnicoResumen,
  CrearTecnicoRequest,
  ActualizarTecnicoRequest,
  CrearOrdenRequest,
  CrearAfiliadoRequest,
  ActualizarAfiliadoRequest,
} from '../../types';
import type { AdminTab } from '../../components/admin';
import type { FiltroOrdenes } from './tabs';

export function useAdminDashboard() {
  // Tabs y Filtros
  const [activeTab, setActiveTab] = useState<AdminTab>('ordenes');
  const [filtroActivo, setFiltroActivo] = useState<FiltroOrdenes>('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Datos principales
  const [ordenes, setOrdenes] = useState<OrdenDetalleAdmin[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoResumen[]>([]);
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

  // Modales de Técnicos
  const [modalNuevoTecnico, setModalNuevoTecnico] = useState<boolean>(false);
  const [modalEditarTecnico, setModalEditarTecnico] = useState<boolean>(false);
  const [tecnicoAEditar, setTecnicoAEditar] = useState<TecnicoResumen | null>(null);
  const [togglingTecnicoId, setTogglingTecnicoId] = useState<number | null>(null);

  // Modales de Especialidades y Materiales
  const [modalNuevaEspecialidad, setModalNuevaEspecialidad] = useState<boolean>(false);
  const [guardandoEspecialidad, setGuardandoEspecialidad] = useState<boolean>(false);
  const [modalGestionMateriales, setModalGestionMateriales] = useState<boolean>(false);

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

  // Carga inicial de datos
  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setIsFetching(true);

    try {
      const [ordenesRes, afiliadosRes, tecnicosRes] = await Promise.allSettled([
        adminApi.getOrdenes(),
        adminApi.getAfiliados(),
        adminApi.getTecnicos(),
      ]);

      if (ordenesRes.status === 'fulfilled') {
        setOrdenes(ordenesRes.value || []);
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

      recargarEspecialidades();
    } catch (err) {
      console.warn('Error cargando datos de administración:', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Handlers
  const handleCrearOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormExito(null);

    if (!nuevaOrden.afiliadoId || !nuevaOrden.tecnicoId) {
      setFormError('Por favor selecciona un afiliado y un técnico para la orden.');
      return;
    }

    setSubmitting(true);
    try {
      const creada = await adminApi.crearOrden(nuevaOrden);
      setOrdenes((prev) => [creada, ...prev]);
      setFormExito(`¡Orden #${creada.codigoOrden} creada exitosamente!`);
      setTimeout(() => {
        setFormExito(null);
        setActiveTab('ordenes');
      }, 1500);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al crear la orden. Verifica los datos.');
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
    loading,
    isFetching,
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
    handleCrearOrden,
    handleCrearAfiliado,
    handleGuardarEditarAfiliado,
    handleEliminarAfiliado,
    handleConfirmarAnulacion,
    handleCrearTecnico,
    handleToggleEstadoTecnico,
    handleGuardarEditarTecnico,
    handleCrearEspecialidad,
  };
}
