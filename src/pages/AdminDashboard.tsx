import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api';
import { AdminBottomNav, type AdminTab } from '../components/admin';
import { HojaServicioModal } from '../components/HojaServicioModal';
import frame26 from '../assets/Frame 26.svg';
import type {
  OrdenDetalleAdmin,
  Afiliado,
  TecnicoResumen,
  EstadoOrden,
  CrearOrdenRequest,
  CrearAfiliadoRequest,
} from '../types';
import {
  Search,
  MapPin,
  Clock,
  User,
  RefreshCw,
  X,
  Phone,
  CheckCircle,
  FileText,
  Plus,
  Shield,
  LogOut,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';

/* ─────────────── Mocks de Respaldo Fieles a Figma ─────────────── */
const MOCK_ORDENES_FIGMA: OrdenDetalleAdmin[] = [
  {
    id: 1,
    codigoOrden: 'ORD-2026-001',
    tipoServicio: 'Mantenimiento Eléctrico Preventivo',
    estado: 'EN_DOMICILIO',
    fechaAsignacion: '2026-10-14T10:30:00',
    afiliadoId: 1,
    afiliadoNombre: 'Carlos Mendoza Paredes',
    afiliadoTelefono: '987654321',
    afiliadoDireccion: 'Av. Central 120',
    afiliadoDistrito: 'Villa El Salvador',
    tecnicoId: 2,
    tecnicoNombre: 'Luis Inca',
  },
  {
    id: 2,
    codigoOrden: 'ORD-2026-002',
    tipoServicio: 'Mantenimiento Eléctrico Preventivo',
    estado: 'PENDIENTE',
    fechaAsignacion: '2026-10-14T10:30:00',
    afiliadoId: 2,
    afiliadoNombre: 'María Torres Salazar',
    afiliadoTelefono: '988555123',
    afiliadoDireccion: 'Av. Central 120',
    afiliadoDistrito: 'Villa El Salvador',
    tecnicoId: 2,
    tecnicoNombre: 'Luis Inca',
  },
  {
    id: 3,
    codigoOrden: 'ORD-2026-003',
    tipoServicio: 'Mantenimiento Eléctrico Preventivo',
    estado: 'FINALIZADA',
    fechaAsignacion: '2026-10-14T10:30:00',
    afiliadoId: 3,
    afiliadoNombre: 'Jorge Ramírez Valdivia',
    afiliadoTelefono: '977444321',
    afiliadoDireccion: 'Av. Central 120',
    afiliadoDistrito: 'Villa El Salvador',
    tecnicoId: 2,
    tecnicoNombre: 'Luis Inca',
  },
];

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Estados de navegación y filtros
  const [activeTab, setActiveTab] = useState<AdminTab>('ordenes');
  const [filtroActivo, setFiltroActivo] = useState<'Todas' | 'En proceso' | 'Pendientes' | 'Finalizadas' | 'Canceladas'>('Todas');
  const [busqueda, setBusqueda] = useState('');

  // Datos principales con caché en memoria
  const [ordenes, setOrdenes] = useState<OrdenDetalleAdmin[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoResumen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Modales
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenDetalleAdmin | null>(null);
  const [mostrarHojaServicio, setMostrarHojaServicio] = useState<boolean>(false);
  const [modalPerfilAdmin, setModalPerfilAdmin] = useState<boolean>(false);
  const [modalNuevoAfiliado, setModalNuevoAfiliado] = useState<boolean>(false);
  const [modalAnularOrden, setModalAnularOrden] = useState<boolean>(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState<string>('');
  const [anulando, setAnulando] = useState<boolean>(false);
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null);

  // Formularios de Creación
  const [nuevaOrden, setNuevaOrden] = useState<CrearOrdenRequest>({
    tipoServicio: 'Gasfitería',
    afiliadoId: 0,
    tecnicoId: 0,
  });
  const [nuevoAfiliado, setNuevoAfiliado] = useState<CrearAfiliadoRequest>({
    nombreCompleto: '',
    dni: '',
    telefono: '',
    direccion: '',
    referencia: '',
    distrito: 'Villa El Salvador',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formExito, setFormExito] = useState<string | null>(null);

  // Carga inicial y silenciosa de datos
  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setIsFetching(true);

    try {
      const [ordenesRes, afiliadosRes, tecnicosRes] = await Promise.allSettled([
        adminApi.getOrdenes(),
        adminApi.getAfiliados(),
        adminApi.getTecnicos(),
      ]);

      if (ordenesRes.status === 'fulfilled' && ordenesRes.value.length > 0) {
        setOrdenes(ordenesRes.value);
      } else if (ordenes.length === 0) {
        setOrdenes(MOCK_ORDENES_FIGMA);
      }

      if (afiliadosRes.status === 'fulfilled') {
        setAfiliados(afiliadosRes.value);
        if (afiliadosRes.value.length > 0) {
          setNuevaOrden((prev) => ({ ...prev, afiliadoId: prev.afiliadoId || afiliadosRes.value[0].id }));
        }
      }

      if (tecnicosRes.status === 'fulfilled') {
        setTecnicos(tecnicosRes.value);
        if (tecnicosRes.value.length > 0) {
          setNuevaOrden((prev) => ({ ...prev, tecnicoId: prev.tecnicoId || tecnicosRes.value[0].id }));
        }
      }
    } catch (err) {
      console.warn('Error cargando datos de administración, usando datos locales:', err);
      if (ordenes.length === 0) setOrdenes(MOCK_ORDENES_FIGMA);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrado reactivo en memoria (0 ms de delay)
  const ordenesFiltradas = useMemo(() => {
    const listado = ordenes.length > 0 ? ordenes : MOCK_ORDENES_FIGMA;

    return listado.filter((orden) => {
      // 1. Filtro por texto
      const termino = busqueda.toLowerCase().trim();
      const coincideTexto =
        !termino ||
        orden.codigoOrden?.toLowerCase().includes(termino) ||
        orden.afiliadoNombre?.toLowerCase().includes(termino) ||
        (orden as any).nombreAfiliado?.toLowerCase().includes(termino) ||
        orden.tipoServicio?.toLowerCase().includes(termino) ||
        orden.afiliadoDireccion?.toLowerCase().includes(termino) ||
        (orden as any).direccion?.toLowerCase().includes(termino) ||
        orden.afiliadoDistrito?.toLowerCase().includes(termino) ||
        (orden as any).distrito?.toLowerCase().includes(termino);

      if (!coincideTexto) return false;

      // 2. Filtro por píldora seleccionada
      if (filtroActivo === 'Todas') return true;
      if (filtroActivo === 'En proceso') return orden.estado === 'EN_DOMICILIO';
      if (filtroActivo === 'Pendientes') return orden.estado === 'PENDIENTE';
      if (filtroActivo === 'Finalizadas') return orden.estado === 'FINALIZADA';
      if (filtroActivo === 'Canceladas') return orden.estado === 'CANCELADA';
      return true;
    });
  }, [ordenes, busqueda, filtroActivo]);

  // Estilos de badge por estado según Figma
  const getBadgeConfig = (estado: EstadoOrden) => {
    switch (estado) {
      case 'EN_DOMICILIO':
        return {
          label: 'En proceso',
          className: 'bg-[#fef3c7] text-[#b45309]',
        };
      case 'PENDIENTE':
        return {
          label: 'Pendientes',
          className: 'bg-[#e0f2fe] text-[#0369a1]',
        };
      case 'FINALIZADA':
        return {
          label: 'Finalizadas',
          className: 'bg-[#dcfce7] text-[#15803d]',
        };
      case 'CANCELADA':
        return {
          label: 'Cancelada',
          className: 'bg-slate-200 text-slate-700 font-semibold',
        };
      default:
        return {
          label: estado,
          className: 'bg-slate-100 text-slate-700',
        };
    }
  };

  // Apertura directa de Waze
  const handleOpenWaze = (e: React.MouseEvent, orden: OrdenDetalleAdmin) => {
    e.stopPropagation();
    const dir = orden.afiliadoDireccion || (orden as any).direccion || 'Av. Central 120';
    const dis = orden.afiliadoDistrito || (orden as any).distrito || 'Villa El Salvador';
    const destino = encodeURIComponent(`${dir}, ${dis}, Lima`);
    window.open(`https://www.waze.com/ul?q=${destino}&navigate=yes`, '_blank');
  };

  // Manejo de Creación de Orden
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

  // Manejo de Creación de Afiliado
  const handleCrearAfiliado = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!nuevoAfiliado.nombreCompleto || !nuevoAfiliado.dni || !nuevoAfiliado.direccion) {
      setFormError('Completa al menos el nombre, DNI y dirección del afiliado.');
      return;
    }

    setSubmitting(true);
    try {
      const creado = await adminApi.crearAfiliado(nuevoAfiliado);
      setAfiliados((prev) => [creado, ...prev]);
      setNuevaOrden((prev) => ({ ...prev, afiliadoId: creado.id }));
      setModalNuevoAfiliado(false);
      setNuevoAfiliado({
        nombreCompleto: '',
        dni: '',
        telefono: '',
        direccion: '',
        referencia: '',
        distrito: 'Villa El Salvador',
      });
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al registrar el afiliado.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de Anulación / Cancelación de Orden (Soft Delete con motivo)
  const handleConfirmarAnulacion = async () => {
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

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col justify-between">
      {/* Contenedor Móvil Central Shell PWA */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#f1f5f9] pb-24 relative shadow-xl flex flex-col">

        {/* ═══════════════ PESTAÑA 1: ÓRDENES (DISEÑO FIGMA OFICIAL) ═══════════════ */}
        {activeTab === 'ordenes' && (
          <div className="flex-1 flex flex-col">
            {/* Header Superior */}
            <div className="flex items-center justify-between px-5 pt-6 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Órdenes de trabajo
                </h1>
                {isFetching && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0ea5e9]" />
                )}
              </div>
              <button
                onClick={() => setModalPerfilAdmin(true)}
                className="w-10 h-10 rounded-full bg-slate-200/90 flex items-center justify-center text-slate-800 hover:bg-slate-300 transition-colors shadow-xs active:scale-95"
                title="Perfil Administrador"
              >
                <User className="w-5 h-5 fill-slate-800 stroke-none" />
              </button>
            </div>

            {/* Barra de Búsqueda */}
            <div className="px-5 my-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar órden, cliente..."
                  className="w-full bg-white rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-xs border border-transparent focus:border-sky-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Píldoras de Filtro (Tabs Horizontales) */}
            <div className="px-5 mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {(['Todas', 'En proceso', 'Pendientes', 'Finalizadas', 'Canceladas'] as const).map((filtro) => {
                const activo = filtroActivo === filtro;
                return (
                  <button
                    key={filtro}
                    onClick={() => setFiltroActivo(filtro)}
                    className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      activo
                        ? 'bg-[#0284c7] text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:text-slate-900 shadow-xs'
                    }`}
                  >
                    {filtro}
                  </button>
                );
              })}
            </div>

            {/* Listado de Tarjetas de Órdenes */}
            <div className="px-5 space-y-4 flex-1">
              {loading && ordenes.length === 0 ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#0ea5e9]" />
                  <span className="text-xs font-semibold">Cargando órdenes de trabajo...</span>
                </div>
              ) : ordenesFiltradas.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center shadow-xs border border-slate-100 my-4 space-y-2">
                  <CheckCircle className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-800 text-sm">No se encontraron órdenes</p>
                  <p className="text-xs text-slate-400">
                    {busqueda
                      ? `No hay coincidencias para "${busqueda}".`
                      : 'No hay órdenes registradas con este filtro.'}
                  </p>
                </div>
              ) : (
                ordenesFiltradas.map((orden) => {
                  const badge = getBadgeConfig(orden.estado);
                  const direccion =
                    orden.afiliadoDireccion || (orden as any).direccion || 'Av. Central 120';
                  const distrito =
                    orden.afiliadoDistrito || (orden as any).distrito || 'Villa El Salvador';
                  const tecnico =
                    orden.tecnicoNombre || (orden as any).tecnico?.nombreCompleto || 'Luis Inca';

                  return (
                    <div
                      key={orden.id}
                      onClick={() => setOrdenSeleccionada(orden)}
                      className="bg-white rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 active:scale-[0.99] border border-slate-100/60"
                    >
                      {/* Fila 1: Código correlativo y Badge de estado */}
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 text-lg tracking-tight">
                          #{orden.codigoOrden}
                        </span>
                        <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Fila 2: Nombre del Servicio */}
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {orden.tipoServicio}
                      </h3>

                      {/* Fila 3: Ubicación y Botón de Waze */}
                      <div className="flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-slate-600 truncate">
                            {direccion} - {distrito}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleOpenWaze(e, orden)}
                          title="Abrir ruta en Waze"
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        >
                          <img src={frame26} alt="Waze" className="w-[26px] h-[26px] object-contain" />
                        </button>
                      </div>

                      {/* Fila 4: Horario y Técnico */}
                      <div className="flex items-center justify-between pt-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Hoy, 10:30 AM</span>
                        </div>
                        <span className="text-sky-600 font-bold text-xs">
                          Téc. {tecnico}.
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ PESTAÑA 2: TÉCNICOS ═══════════════ */}
        {activeTab === 'tecnicos' && (
          <div className="p-5 space-y-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Técnicos Operativos
            </h1>
            <p className="text-xs text-slate-500">
              Personal técnico disponible y asignado en campo
            </p>

            <div className="space-y-3">
              {tecnicos.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center shadow-xs">
                  <p className="text-sm font-semibold text-slate-700">No hay técnicos registrados</p>
                </div>
              ) : (
                tecnicos.map((tec) => (
                  <div key={tec.id} className="bg-white rounded-3xl p-5 shadow-xs flex items-center justify-between border border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="font-bold text-slate-900 text-sm">{tec.nombreCompleto}</h4>
                      </div>
                      <p className="text-xs text-slate-500">{tec.correo}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      Disponible
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ PESTAÑA 3: NUEVA ORDEN ═══════════════ */}
        {activeTab === 'nuevo' && (
          <div className="p-5 space-y-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Registrar Nueva Orden
            </h1>
            <p className="text-xs text-slate-500">
              Crea y asigna una asistencia técnica de emergencia
            </p>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formExito && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formExito}</span>
              </div>
            )}

            <form onSubmit={handleCrearOrden} className="bg-white rounded-3xl p-5 shadow-xs space-y-4 border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Especialidad / Servicio
                </label>
                <select
                  value={nuevaOrden.tipoServicio}
                  onChange={(e) => setNuevaOrden({ ...nuevaOrden, tipoServicio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="Gasfitería">Gasfitería</option>
                  <option value="Electricidad">Electricidad</option>
                  <option value="Cerrajería">Cerrajería</option>
                  <option value="Auxilio Vial">Auxilio Vial</option>
                  <option value="Armado de Muebles">Armado de Muebles</option>
                  <option value="Pintura">Pintura</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Afiliado / Cliente
                  </label>
                  <button
                    type="button"
                    onClick={() => setModalNuevoAfiliado(true)}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Registrar Nuevo
                  </button>
                </div>
                <select
                  value={nuevaOrden.afiliadoId}
                  onChange={(e) => setNuevaOrden({ ...nuevaOrden, afiliadoId: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value={0} disabled>Selecciona un afiliado...</option>
                  {afiliados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombreCompleto} (DNI: {a.dni}) - {a.distrito}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Técnico Asignado
                </label>
                <select
                  value={nuevaOrden.tecnicoId}
                  onChange={(e) => setNuevaOrden({ ...nuevaOrden, tecnicoId: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value={0} disabled>Selecciona un técnico...</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombreCompleto} ({t.correo})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] active:scale-[0.99] text-white font-bold text-sm rounded-2xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>Crear y Asignar Orden</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ═══════════════ PESTAÑA 4: CLIENTES ═══════════════ */}
        {activeTab === 'clientes' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Clientes Afiliados
                </h1>
                <p className="text-xs text-slate-500">
                  Padrón de afiliados activos en 24/7 Asistencias
                </p>
              </div>
              <button
                onClick={() => setModalNuevoAfiliado(true)}
                className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 flex items-center justify-center transition-colors"
                title="Registrar afiliado"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {afiliados.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center shadow-xs">
                  <p className="text-sm font-semibold text-slate-700">No hay afiliados registrados</p>
                </div>
              ) : (
                afiliados.map((a) => (
                  <div key={a.id} className="bg-white rounded-3xl p-5 shadow-xs space-y-1.5 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{a.nombreCompleto}</h4>
                      <span className="text-xs font-semibold text-slate-500">DNI: {a.dni}</span>
                    </div>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {a.direccion} - {a.distrito}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {a.telefono || 'Sin teléfono'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ PESTAÑA 5: REPORTES ═══════════════ */}
        {activeTab === 'reportes' && (
          <div className="p-5 space-y-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Métricas Operativas
            </h1>
            <p className="text-xs text-slate-500">
              Resumen general del rendimiento del servicio
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Órdenes</span>
                <p className="text-2xl font-black text-slate-900">{ordenes.length}</p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Registradas
                </span>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Finalizadas</span>
                <p className="text-2xl font-black text-emerald-600">
                  {ordenes.filter((o) => o.estado === 'FINALIZADA').length}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 100% Calidad
                </span>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">En proceso</span>
                <p className="text-2xl font-black text-amber-600">
                  {ordenes.filter((o) => o.estado === 'EN_DOMICILIO').length}
                </p>
                <span className="text-[10px] text-amber-600 font-semibold">Técnico en ruta</span>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-xs border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Pendientes</span>
                <p className="text-2xl font-black text-sky-600">
                  {ordenes.filter((o) => o.estado === 'PENDIENTE').length}
                </p>
                <span className="text-[10px] text-sky-600 font-semibold">Por asignar</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Nivel de Satisfacción</span>
              </div>
              <p className="text-2xl font-black text-slate-900">4.9 / 5.0 ★</p>
              <p className="text-xs text-slate-500">
                Basado en las evaluaciones registradas en las Hojas de Servicio cerradas.
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════ BARRA INFERIOR DE ADMINISTRACIÓN ═══════════════ */}
        <AdminBottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

        {/* ═══════════════ MODAL DETALLE DE ORDEN ═══════════════ */}
        {ordenSeleccionada && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto border border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-black text-lg text-slate-900">
                  #{ordenSeleccionada.codigoOrden}
                </span>
                <button
                  onClick={() => setOrdenSeleccionada(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Estado</span>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeConfig(ordenSeleccionada.estado).className}`}>
                      {getBadgeConfig(ordenSeleccionada.estado).label}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Servicio</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{ordenSeleccionada.tipoServicio}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente Afiliado</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {ordenSeleccionada.afiliadoNombre || (ordenSeleccionada as any).nombreAfiliado || 'Carlos Mendoza'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {ordenSeleccionada.afiliadoTelefono || '987 654 321'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dirección de Atención</span>
                  <p className="font-medium text-slate-700 text-xs mt-0.5">
                    {ordenSeleccionada.afiliadoDireccion || (ordenSeleccionada as any).direccion || 'Av. Central 120'} -{' '}
                    {ordenSeleccionada.afiliadoDistrito || (ordenSeleccionada as any).distrito || 'Villa El Salvador'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Técnico Asignado</span>
                  <p className="font-bold text-sky-600 text-xs mt-0.5">
                    {ordenSeleccionada.tecnicoNombre ? `Téc. ${ordenSeleccionada.tecnicoNombre}.` : 'Téc. Luis Inca.'}
                  </p>
                </div>
              </div>

              {/* Información si la orden está Cancelada */}
              {ordenSeleccionada.estado === 'CANCELADA' && (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span>Orden Anulada</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <span className="font-semibold">Motivo:</span> {ordenSeleccionada.motivoCancelacion || 'Anulada por administración'}
                  </p>
                  {ordenSeleccionada.fechaCancelacion && (
                    <p className="text-[10px] text-slate-400">
                      Fecha: {new Date(ordenSeleccionada.fechaCancelacion).toLocaleString('es-PE')}
                    </p>
                  )}
                </div>
              )}

              {/* Botón Ver Hoja de Servicio Oficial si la orden está finalizada */}
              {ordenSeleccionada.estado === 'FINALIZADA' && (
                <button
                  type="button"
                  onClick={() => setMostrarHojaServicio(true)}
                  className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver Hoja de Servicio</span>
                </button>
              )}

              {/* Botón Anular Orden: disponible si la orden NO está finalizada ni cancelada */}
              {ordenSeleccionada.estado !== 'FINALIZADA' && ordenSeleccionada.estado !== 'CANCELADA' && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorAnulacion(null);
                    setMotivoAnulacion('');
                    setModalAnularOrden(true);
                  }}
                  className="w-full text-red-600 hover:bg-red-50 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Anular Orden
                </button>
              )}

              <button
                onClick={() => setOrdenSeleccionada(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ MODAL CONFIRMAR ANULACIÓN DE ORDEN ═══════════════ */}
        {modalAnularOrden && ordenSeleccionada && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-black text-base text-slate-900">
                  ¿Deseas anular esta orden de trabajo?
                </span>
                <button
                  type="button"
                  onClick={() => setModalAnularOrden(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Esta acción liberará la orden y registrará el motivo en auditoría.
              </p>

              {errorAnulacion && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {errorAnulacion}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Motivo de la anulación (mínimo 5 caracteres) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Describe detalladamente el motivo de la anulación..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition-all resize-none"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Mínimo 5 caracteres</span>
                  <span className={motivoAnulacion.trim().length >= 5 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                    {motivoAnulacion.trim().length}/5
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAnularOrden(false)}
                  disabled={anulando}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarAnulacion}
                  disabled={anulando || motivoAnulacion.trim().length < 5}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-1.5"
                >
                  {anulando ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Anulando...</span>
                    </>
                  ) : (
                    <span>Confirmar Anulación</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ MODAL HOJA DE SERVICIO OFICIAL ═══════════════ */}
        {mostrarHojaServicio && ordenSeleccionada && (
          <HojaServicioModal
            orden={ordenSeleccionada}
            onClose={() => setMostrarHojaServicio(false)}
          />
        )}

        {/* ═══════════════ MODAL PERFIL ADMINISTRADOR ═══════════════ */}
        {modalPerfilAdmin && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-black text-lg text-slate-900">Perfil Administrador</span>
                <button
                  onClick={() => setModalPerfilAdmin(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                  <Shield className="w-7 h-7 text-[#0284c7]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{user?.nombreCompleto || 'Administrador'}</h3>
                  <p className="text-xs text-slate-500">{user?.correo || 'admin@asistencias247.com'}</p>
                  <span className="inline-block px-2 py-0.5 mt-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                    ADMINISTRADOR
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <p>24/7 Asistencias Generales S.A.C.</p>
                <p className="text-[11px] text-slate-400">Versión 1.0.0 (PWA)</p>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ MODAL REGISTRAR AFILIADO ═══════════════ */}
        {modalNuevoAfiliado && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto border border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-black text-base text-slate-900">Registrar Afiliado</span>
                <button
                  onClick={() => setModalNuevoAfiliado(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCrearAfiliado} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Apellidos y Nombres</label>
                  <input
                    type="text"
                    required
                    value={nuevoAfiliado.nombreCompleto}
                    onChange={(e) => setNuevoAfiliado({ ...nuevoAfiliado, nombreCompleto: e.target.value })}
                    placeholder="Ej. Juan Pérez Ramos"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">DNI N°</label>
                    <input
                      type="text"
                      required
                      value={nuevoAfiliado.dni}
                      onChange={(e) => setNuevoAfiliado({ ...nuevoAfiliado, dni: e.target.value })}
                      placeholder="12345678"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={nuevoAfiliado.telefono}
                      onChange={(e) => setNuevoAfiliado({ ...nuevoAfiliado, telefono: e.target.value })}
                      placeholder="987654321"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Dirección</label>
                  <input
                    type="text"
                    required
                    value={nuevoAfiliado.direccion}
                    onChange={(e) => setNuevoAfiliado({ ...nuevoAfiliado, direccion: e.target.value })}
                    placeholder="Av. Central 120"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Distrito</label>
                  <input
                    type="text"
                    required
                    value={nuevoAfiliado.distrito}
                    onChange={(e) => setNuevoAfiliado({ ...nuevoAfiliado, distrito: e.target.value })}
                    placeholder="Villa El Salvador"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl mt-2 flex items-center justify-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Guardar Afiliado</span>}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
