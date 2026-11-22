import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { materialApi, tecnicoApi } from '../../api';
import { useOrdenes } from '../../context/OrdenesContext';
import { TecnicoLayout, OrderStepper } from '../../components/tecnico';
import type { OrdenResumenTecnico, MaterialCatalogo, MaterialConsumido } from '../../types';
import {
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  Minus,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatearHoraLocal } from '../../utils/dateFormatter';
import { useModalBackButton } from '../../hooks';

interface BorradorAtencion {
  evaluacion: string;
  solucion: string;
  sugerencias: string;
  dniAfiliado?: string;
  materialesSeleccionados: Array<{
    materialId: number | null;
    descripcion: string;
    cantidad: number;
    esPersonalizado: boolean;
  }>;
}

// Sanitiza una lista de materiales conservando únicamente ítems del catálogo del administrador y unificando duplicados
const sanitizarMateriales = (
  items: Array<{ materialId: number | null; descripcion: string; cantidad: number; esPersonalizado: boolean }>
) => {
  const resultado: Array<{ materialId: number | null; descripcion: string; cantidad: number; esPersonalizado: boolean }> = [];

  for (const item of items) {
    if (item.esPersonalizado || item.materialId === null || item.materialId <= 0) {
      continue;
    }
    const existing = resultado.find((r) => r.materialId === item.materialId);
    if (existing) {
      existing.cantidad += Math.max(1, item.cantidad || 1);
    } else {
      resultado.push({
        materialId: item.materialId,
        descripcion: '',
        cantidad: Math.max(1, item.cantidad || 1),
        esPersonalizado: false,
      });
    }
  }

  return resultado;
};

export const AtencionTecnica: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { actualizarOrdenLocal, invalidarCache } = useOrdenes();

  const [orden, setOrden] = useState<OrdenResumenTecnico | null>(
    (location.state as { orden?: OrdenResumenTecnico })?.orden || null
  );

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    tecnicoApi
      .getDetalleOrden(Number(id))
      .then((data) => {
        if (!mounted || !data) return;
        setOrden((prev) => ({
          ...prev,
          ...data,
          fechaLlegada: data.fechaLlegada || data.horaLlegada || prev?.fechaLlegada,
          horaLlegada: formatearHoraLocal(data.fechaLlegada || data.horaLlegada || prev?.fechaLlegada || prev?.horaLlegada),
        }));
        actualizarOrdenLocal(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [id]);

  const [catalogo, setCatalogo] = useState<MaterialCatalogo[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState<boolean>(true);
  const [modalAnulacionOpen, setModalAnulacionOpen] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);

  useModalBackButton(modalAnulacionOpen, () => {
    if (!anulando) setModalAnulacionOpen(false);
  });

  // 1 & 2. Clave dinámica por orden y carga del estado inicial desde localStorage
  const ordenId = id || orden?.id || '1';
  const DRAFT_KEY = `borrador_atencion_${ordenId}`;

  const [evaluacion, setEvaluacion] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`borrador_atencion_${id || '1'}`);
      if (saved) {
        const parsed: BorradorAtencion = JSON.parse(saved);
        return parsed.evaluacion || '';
      }
    } catch (e) {
      console.error('Error cargando borrador de evaluación:', e);
    }
    return '';
  });

  const [solucion, setSolucion] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`borrador_atencion_${id || '1'}`);
      if (saved) {
        const parsed: BorradorAtencion = JSON.parse(saved);
        return parsed.solucion || '';
      }
    } catch (e) {
      console.error('Error cargando borrador de solución:', e);
    }
    return '';
  });

  const [sugerencias, setSugerencias] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`borrador_atencion_${id || '1'}`);
      if (saved) {
        const parsed: BorradorAtencion = JSON.parse(saved);
        return parsed.sugerencias || '';
      }
    } catch (e) {
      console.error('Error cargando borrador de sugerencias:', e);
    }
    return '';
  });

  const [evaluacionTouched, setEvaluacionTouched] = useState<boolean>(false);
  const [solucionTouched, setSolucionTouched] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const evaluacionError = useMemo(() => {
    if (!evaluacionTouched) return null;
    if (!evaluacion.trim()) return 'La evaluación de la avería es obligatoria.';
    if (evaluacion.trim().length < 8) return 'Ingresa una descripción más detallada (mínimo 8 caracteres).';
    return null;
  }, [evaluacion, evaluacionTouched]);

  const solucionError = useMemo(() => {
    if (!solucionTouched) return null;
    if (!solucion.trim()) return 'El detalle de la solución aplicada es obligatorio.';
    if (solucion.trim().length < 8) return 'Ingresa una descripción más detallada (mínimo 8 caracteres).';
    return null;
  }, [solucion, solucionTouched]);

  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<
    Array<{ materialId: number | null; descripcion: string; cantidad: number; esPersonalizado: boolean }>
  >(() => {
    try {
      const saved = localStorage.getItem(`borrador_atencion_${id || '1'}`);
      if (saved) {
        const parsed: BorradorAtencion = JSON.parse(saved);
        if (Array.isArray(parsed.materialesSeleccionados)) {
          return sanitizarMateriales(parsed.materialesSeleccionados);
        }
      }
    } catch (e) {
      console.error('Error cargando borrador de materiales seleccionados:', e);
    }
    return [];
  });


  // 3. Auto-guardado en tiempo real en localStorage (persiste array vacío [] sin cadenas fantasma)
  useEffect(() => {
    const draftData: BorradorAtencion = {
      evaluacion,
      solucion,
      sugerencias,
      materialesSeleccionados,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    } catch (e) {
      console.error('Error guardando borrador en localStorage:', e);
    }
  }, [evaluacion, solucion, sugerencias, materialesSeleccionados, DRAFT_KEY]);

  useEffect(() => {
    let cancelado = false;
    const fetchMateriales = async () => {
      setCargandoCatalogo(true);
      try {
        const data = await materialApi.getMateriales(undefined, orden?.tipoServicio);
        if (!cancelado && data && data.length > 0) {
          const mapeados = data
            .filter((m) => m.activo !== false)
            .map((m) => ({
              id: m.id,
              nombre: `${m.nombre} (${m.unidad || 'Unidad'})`,
              activo: m.activo,
            }));
          setCatalogo(mapeados);
          setCargandoCatalogo(false);
          return;
        }
      } catch (err) {
        console.warn('Error al obtener materiales por especialidad:', err);
      }

      // Si no hay filtro por especialidad o devolvió vacío, consultar materiales activos creados por el admin
      try {
        const todosMateriales = await materialApi.getMateriales();
        if (!cancelado) {
          const mapeados = (todosMateriales || [])
            .filter((m) => m.activo !== false)
            .map((m) => ({
              id: m.id,
              nombre: `${m.nombre} (${m.unidad || 'Unidad'})`,
              activo: m.activo,
            }));
          setCatalogo(mapeados);
        }
      } catch (err) {
        console.warn('Error al obtener catálogo de materiales del administrador:', err);
        if (!cancelado) {
          setCatalogo([]);
        }
      } finally {
        if (!cancelado) {
          setCargandoCatalogo(false);
        }
      }
    };

    void fetchMateriales();
    return () => {
      cancelado = true;
    };
  }, [orden?.tipoServicio]);

  // Limpiar cualquier material seleccionado cuyo ID ya no exista en el catálogo del administrador
  useEffect(() => {
    if (cargandoCatalogo) return;
    const validIds = new Set(catalogo.map((c) => c.id));
    setMaterialesSeleccionados((prev) => {
      const filtrados = prev.filter(
        (m) => !m.esPersonalizado && m.materialId !== null && validIds.has(m.materialId)
      );
      return filtrados.length === prev.length ? prev : filtrados;
    });
  }, [catalogo, cargandoCatalogo]);

  const handleQuickAddCatalogo = (catId: number) => {
    const catObj = catalogo.find((c) => c.id === catId);
    if (!catObj) return;

    setMaterialesSeleccionados((prev) => {
      const idxExistente = prev.findIndex((m) => m.materialId === catId);
      if (idxExistente !== -1) {
        return prev.map((m, idx) =>
          idx === idxExistente ? { ...m, cantidad: m.cantidad + 1 } : m
        );
      }
      return [
        ...prev,
        {
          materialId: catId,
          descripcion: '',
          cantidad: 1,
          esPersonalizado: false,
        },
      ];
    });
  };

  const handleAddMaterial = () => {
    if (catalogo.length === 0) {
      toast.info('El administrador aún no ha registrado materiales para esta especialidad.');
      return;
    }

    const selectedCatIds = new Set(
      materialesSeleccionados
        .filter((m) => m.materialId !== null)
        .map((m) => m.materialId)
    );

    const primerDisponible = catalogo.find((cat) => !selectedCatIds.has(cat.id));

    if (primerDisponible) {
      setMaterialesSeleccionados((prev) => [
        ...prev,
        {
          materialId: primerDisponible.id,
          descripcion: '',
          cantidad: 1,
          esPersonalizado: false,
        },
      ]);
    } else {
      toast.info('Ya agregaste todos los materiales disponibles del catálogo.');
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterialesSeleccionados(materialesSeleccionados.filter((_, i) => i !== index));
  };

  const handleCambiarCantidad = (index: number, nuevaCantidad: number) => {
    const cantidadFinal = Math.max(1, nuevaCantidad);
    const updated = [...materialesSeleccionados];
    updated[index] = { ...updated[index], cantidad: cantidadFinal };
    setMaterialesSeleccionados(updated);
  };

  const handleUpdateMaterialId = (index: number, materialId: number) => {
    const updated = [...materialesSeleccionados];
    updated[index] = {
      ...updated[index],
      materialId,
      esPersonalizado: false,
      descripcion: '',
    };
    setMaterialesSeleccionados(updated);
  };

  // 4. Navegación a la siguiente pantalla (Firma y Validación)
  const handleContinuar = (e: React.FormEvent) => {
    e.preventDefault();

    setEvaluacionTouched(true);
    setSolucionTouched(true);

    if (!evaluacion.trim() || evaluacion.trim().length < 8) {
      toast.error('Por favor completa la evaluación de la avería antes de continuar.');
      return;
    }

    if (!solucion.trim() || solucion.trim().length < 8) {
      toast.error('Por favor completa el detalle de la solución aplicada antes de continuar.');
      return;
    }

    setSubmitting(true);

    // Sanitizar cualquier duplicado residual antes de procesar
    const materialesLimpios = sanitizarMateriales(materialesSeleccionados);
    if (materialesLimpios.length !== materialesSeleccionados.length) {
      setMaterialesSeleccionados(materialesLimpios);
    }

    // Estructurar array de materiales del catálogo para Spring Boot
    const listaMateriales: MaterialConsumido[] = materialesLimpios
      .filter((m) => m.materialId !== null)
      .map((m) => ({
        materialId: m.materialId,
        descripcion: null,
        cantidad: m.cantidad,
      }));

    // Navegar al paso 5: Validación y Cierre garantizando la transferencia de datos
    navigate(`/tecnico/ordenes/${id}/cierre`, {
      state: {
        orden: orden || {
          id: Number(id),
          codigoOrden: 'ORD-2026-001',
          tipoServicio: 'Mantenimiento Eléctrico Preventivo',
          nombreAfiliado: 'Carlos Mendoza Paredes',
          direccion: 'Av. Central 120',
          distrito: 'Villa El Salvador',
          estado: 'EN_DOMICILIO',
        },
        formulario: {
          evaluacionAveria: evaluacion || 'Avería eléctrica identificada en el circuito principal.',
          detalleSolucion: solucion || 'Se realizó mantenimiento preventivo y reemplazo de componentes defectuosos.',
          sugerencias: sugerencias || 'Evitar sobrecargar las tomas y realizar revisión periódica.',
          dniAfiliado: orden?.dniAfiliado || undefined,
          materiales: listaMateriales,
        },
      },
    });
  };

  const handleConfirmarAsistidoNoRealizado = async (e: React.FormEvent) => {
    e.preventDefault();
    const motivoLimpio = motivoAnulacion.trim();
    if (!motivoLimpio) {
      toast.error('Por favor indica el motivo por el cual no se concretó el servicio.');
      return;
    }

    const numericId = Number(id || orden?.id || 1);
    setAnulando(true);
    try {
      const cancelada = await tecnicoApi.registrarAsistidoNoRealizado(numericId, motivoLimpio);
      actualizarOrdenLocal({
        id: numericId,
        estado: 'CANCELADA',
        motivoCancelacion: cancelada?.motivoCancelacion || motivoLimpio,
        fechaCancelacion: cancelada?.fechaCancelacion || new Date().toISOString(),
      });
      invalidarCache();
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(`borrador_atencion_${numericId}`);
      setModalAnulacionOpen(false);
      toast.success('Servicio registrado como Asistido No Realizado');
      navigate('/tecnico/ordenes', { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.mensaje ||
        'No se pudo anular la orden. Inténtalo nuevamente.';
      toast.error(msg);
    } finally {
      setAnulando(false);
    }
  };

  const codigo = orden ? `#${orden.codigoOrden}` : '#ORD-2026-001';
  const horaLlegada = formatearHoraLocal(orden?.fechaLlegada || orden?.horaLlegada);

  return (
    <TecnicoLayout activeTab="ordenes">
      <div className="px-5 pt-5 space-y-4">
        {/* Cabecera con botón atrás y código (los datos no se borran al presionar atrás) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/tecnico/ordenes/${id}`)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-800 hover:text-[#0ea5e9] transition-colors rounded-full focus:outline-none"
            aria-label="Volver"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            {codigo}
          </h1>
        </div>

        {/* Stepper (Paso 2: En atención técnica activo) */}
        <OrderStepper currentStep={2} />

        {/* Tarjeta Formulario de Atención */}
        <form onSubmit={handleContinuar} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            {/* Badge de Estado y Título */}
            <div>
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200/60">
                En atención técnica
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2 leading-snug">
                {orden?.tipoServicio || 'Mantenimiento Eléctrico Preventivo'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Llegada registrada: {horaLlegada}
              </p>
            </div>

            {/* EVALUACIÓN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  EVALUACIÓN <span className="text-rose-500">*</span>
                </label>
                {evaluacionError && (
                  <span className="text-[10px] text-rose-500 font-semibold">Obligatorio</span>
                )}
              </div>
              <textarea
                required
                rows={3}
                value={evaluacion}
                onChange={(e) => setEvaluacion(e.target.value)}
                onBlur={() => setEvaluacionTouched(true)}
                placeholder="Describe la avería ..."
                className={`w-full p-3 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none transition-all ${
                  evaluacionError
                    ? 'border-rose-400 ring-1 ring-rose-400 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-[#0ea5e9]'
                }`}
              />
              {evaluacionError && (
                <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{evaluacionError}</span>
                </p>
              )}
            </div>

            {/* DETALLE DE SOLUCIÓN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  DETALLE DE SOLUCIÓN <span className="text-rose-500">*</span>
                </label>
                {solucionError && (
                  <span className="text-[10px] text-rose-500 font-semibold">Obligatorio</span>
                )}
              </div>
              <textarea
                required
                rows={3}
                value={solucion}
                onChange={(e) => setSolucion(e.target.value)}
                onBlur={() => setSolucionTouched(true)}
                placeholder="Detalla la solución aplicada ..."
                className={`w-full p-3 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none transition-all ${
                  solucionError
                    ? 'border-rose-400 ring-1 ring-rose-400 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-[#0ea5e9]'
                }`}
              />
              {solucionError && (
                <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{solucionError}</span>
                </p>
              )}
            </div>

            {/* MATERIALES EMPLEADOS (Solo Catálogo del Administrador) */}
            <div className="space-y-3">
              {/* Cabecera de sección */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0ea5e9] shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 leading-tight">
                      MATERIALES EMPLEADOS
                    </label>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      {materialesSeleccionados.length === 0
                        ? 'Opcional — selecciona del catálogo si usaste materiales'
                        : `${materialesSeleccionados.length} ${
                            materialesSeleccionados.length === 1 ? 'material seleccionado' : 'materiales seleccionados'
                          }`}
                    </span>
                  </div>
                </div>

                {catalogo.length > materialesSeleccionados.length && (
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200/80 text-xs font-bold active:scale-95 transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Agregar</span>
                  </button>
                )}
              </div>

              {/* Chips rápidos del catálogo en 1 toque */}
              {catalogo.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 space-y-1.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
                    Catálogo disponible — toca para agregar o sumar (+1):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {catalogo.map((cat) => {
                      const seleccionado = materialesSeleccionados.find(
                        (m) => m.materialId === cat.id
                      );
                      const nombreCorto = cat.nombre.replace(/\s*\([^)]*\)\s*$/, '');
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleQuickAddCatalogo(cat.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                            seleccionado
                              ? 'bg-[#0ea5e9] text-white shadow-xs shadow-sky-500/20'
                              : 'bg-white text-slate-700 border border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/40'
                          }`}
                        >
                          <Plus className="w-3 h-3 stroke-[2.5] shrink-0" />
                          <span className="truncate max-w-[190px]">{nombreCorto}</span>
                          {seleccionado && (
                            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white/25 text-white text-[10px] font-extrabold">
                              x{seleccionado.cantidad}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista de Tarjetas de Materiales Seleccionados */}
              {cargandoCatalogo ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                  <span>Cargando catálogo de materiales...</span>
                </div>
              ) : catalogo.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    No hay materiales registrados en el catálogo para esta especialidad.
                  </p>
                </div>
              ) : materialesSeleccionados.length > 0 ? (
                <div className="space-y-2.5">
                  {materialesSeleccionados.map((item, idx) => {
                    // Filtrar opciones del catálogo excluyendo las ya seleccionadas en otras tarjetas
                    const opcionesDisponibles = catalogo.filter((cat) => {
                      if (item.materialId === cat.id) return true;
                      return !materialesSeleccionados.some(
                        (m, otherIdx) => otherIdx !== idx && m.materialId === cat.id
                      );
                    });

                    // Extraer unidad de medida del nombre "Material (Unidad)"
                    const catActual = catalogo.find((c) => c.id === item.materialId);
                    const matchUnidad = catActual?.nombre.match(/\(([^)]+)\)\s*$/);
                    const unidadTexto = matchUnidad ? matchUnidad[1] : 'Unidad';

                    return (
                      <div
                        key={`${item.materialId ?? idx}-${idx}`}
                        className="p-3.5 rounded-2xl border border-slate-200/90 bg-white space-y-2.5 transition-all shadow-2xs"
                      >
                        {/* Fila 1: Selector del Catálogo + Botón Eliminar */}
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center px-2 h-7 rounded-lg bg-sky-50 text-[#0284c7] border border-sky-100 text-[11px] font-extrabold shrink-0">
                            #{idx + 1}
                          </span>

                          <div className="relative flex-1 min-w-0">
                            <select
                              value={item.materialId ?? ''}
                              onChange={(e) => handleUpdateMaterialId(idx, Number(e.target.value))}
                              className="w-full min-h-[42px] appearance-none bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition-all"
                            >
                              {opcionesDisponibles.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.nombre}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(idx)}
                            title="Quitar material"
                            aria-label="Quitar material"
                            className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition-colors active:scale-95 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Fila 2: Control de Cantidad Stepper Ergonómico */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500 font-semibold">
                              Cantidad
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {unidadTexto}
                            </span>
                          </div>

                          <div className="inline-flex items-center bg-slate-100/80 border border-slate-200/80 rounded-xl p-0.5">
                            <button
                              type="button"
                              disabled={item.cantidad <= 1}
                              onClick={() => handleCambiarCantidad(idx, item.cantidad - 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-90 disabled:opacity-35 disabled:shadow-none transition-all"
                              title="Disminuir cantidad"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-4 h-4 stroke-[2.5]" />
                            </button>
                            <span className="min-w-[42px] px-2 text-center font-extrabold text-slate-900 select-none text-sm">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCambiarCantidad(idx, item.cantidad + 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0ea5e9] text-white shadow-2xs hover:bg-[#0284c7] active:scale-90 transition-all"
                              title="Aumentar cantidad"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Botón inferior para agregar otro material del catálogo si quedan disponibles */}
                  {catalogo.length > materialesSeleccionados.length && (
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      className="w-full py-2.5 border border-dashed border-sky-300 hover:border-sky-500 rounded-xl flex items-center justify-center gap-1.5 text-[#0284c7] bg-sky-50/40 hover:bg-sky-50 text-xs font-bold transition-all active:scale-[0.99]"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Agregar otro material del catálogo</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Estado vacío limpio cuando hay catálogo disponible pero aún no se ha elegido ningún material */
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center space-y-2.5">
                  <p className="text-xs text-slate-500 font-medium">
                    No se han seleccionado materiales para este servicio
                  </p>
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="w-full py-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Seleccionar Material del Catálogo</span>
                  </button>
                </div>
              )}
            </div>

            {/* SUGERENCIAS */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                SUGERENCIAS
              </label>
              <textarea
                rows={2}
                value={sugerencias}
                onChange={(e) => setSugerencias(e.target.value)}
                placeholder="Describe las recomendaciones para garantizar el servicio..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] resize-none"
              />
            </div>
          </div>

          {/* Acciones de Atención: Asistido No Realizado y Completar Servicio */}
          <div className="pt-2">
            <button
              type="button"
              disabled={submitting || anulando}
              onClick={() => setModalAnulacionOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-xl w-full mb-3 shadow-sm transition-all active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none"
            >
              ASISTIDO NO REALIZADO
            </button>

            <button
              type="submit"
              disabled={submitting || anulando}
              className="w-full min-h-[52px] py-4 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>Procesando...</span>
                </>
              ) : (
                'Completar Servicio e Ir a Firma'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal: Registrar Servicio Asistido No Realizado */}
      {modalAnulacionOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                  Registrar Servicio Asistido No Realizado
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Indica el motivo por el cual no se concretó el servicio:
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmarAsistidoNoRealizado} className="space-y-4">
              <div>
                <textarea
                  required
                  rows={4}
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Describe la razón (ej. Cliente desistió, problema estructural fuera de alcance, etc.)"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={anulando}
                  onClick={() => setModalAnulacionOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={anulando || !motivoAnulacion.trim()}
                  className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {anulando ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Anulando...</span>
                    </>
                  ) : (
                    'Confirmar Anulación'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TecnicoLayout>
  );
};

export const EnAtencionScreen = AtencionTecnica;

