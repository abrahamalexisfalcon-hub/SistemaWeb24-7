import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { catalogoApi, materialApi, tecnicoApi } from '../../api';
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
  PenLine,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatearHoraLocal } from '../../utils/dateFormatter';
import { useModalBackButton } from '../../hooks';

interface BorradorAtencion {
  evaluacion: string;
  solucion: string;
  sugerencias: string;
  dniAfiliado?: string;
  descripcionMateriales?: string;
  materialesSeleccionados: Array<{
    materialId: number | null;
    descripcion: string;
    cantidad: number;
    esPersonalizado: boolean;
  }>;
}

// Normaliza texto para comparaciones sin diferencias de mayúsculas, espacios ni acentos
const normalizar = (texto: string): string => {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Sanitiza una lista de materiales unificando duplicados y sumando sus cantidades
const sanitizarMateriales = (
  items: Array<{ materialId: number | null; descripcion: string; cantidad: number; esPersonalizado: boolean }>,
  catalogoList: MaterialCatalogo[] = []
) => {
  const resultado: Array<{ materialId: number | null; descripcion: string; cantidad: number; esPersonalizado: boolean }> = [];

  for (const item of items) {
    if (item.esPersonalizado) {
      const normDesc = normalizar(item.descripcion);
      if (!normDesc) {
        resultado.push({ ...item });
        continue;
      }
      // Verificar si ya existe en resultado como ítem manual
      const existingManual = resultado.find(
        (r) => r.esPersonalizado && normalizar(r.descripcion) === normDesc
      );
      if (existingManual) {
        existingManual.cantidad += item.cantidad;
        continue;
      }
      // O si coincide con un ítem del catálogo ya seleccionado
      const existingCat = resultado.find((r) => {
        if (r.esPersonalizado || r.materialId === null) return false;
        const catItem = catalogoList.find((c) => c.id === r.materialId);
        return catItem ? normalizar(catItem.nombre) === normDesc : false;
      });
      if (existingCat) {
        existingCat.cantidad += item.cantidad;
        continue;
      }
      resultado.push({ ...item });
    } else {
      if (item.materialId === null) {
        resultado.push({ ...item });
        continue;
      }
      const existing = resultado.find((r) => !r.esPersonalizado && r.materialId === item.materialId);
      if (existing) {
        existing.cantidad += item.cantidad;
      } else {
        resultado.push({ ...item });
      }
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
    const fetchMateriales = async () => {
      try {
        const data = await materialApi.getMateriales(undefined, orden?.tipoServicio);
        if (data && data.length > 0) {
          setCatalogo(
            data.map((m) => ({
              id: m.id,
              nombre: `${m.nombre} (${m.unidad || 'Unidad'})`,
              activo: m.activo,
            }))
          );
          return;
        }
      } catch (err) {
        console.warn('Error al obtener materiales por especialidad:', err);
      }

      // Segundo intento: catálogo general de materiales activos (/api/materiales sin filtro)
      try {
        const todosMateriales = await materialApi.getMateriales();
        if (todosMateriales && todosMateriales.length > 0) {
          setCatalogo(
            todosMateriales.map((m) => ({
              id: m.id,
              nombre: `${m.nombre} (${m.unidad || 'Unidad'})`,
              activo: m.activo,
            }))
          );
          return;
        }
      } catch (err) {
        console.warn('Error al obtener catálogo general de materiales:', err);
      }

      // Fallback final a endpoint legado
      catalogoApi
        .getMaterialesActivos()
        .then((data) => {
          setCatalogo(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setCatalogo([]);
        });
    };

    void fetchMateriales();
  }, [orden?.tipoServicio]);

  const getCatalogoNombre = (materialId: number | null): string => {
    if (materialId === null) return '';
    const item = catalogo.find((c) => c.id === materialId);
    return item ? item.nombre : '';
  };

  // Detecta si una descripción manual coincide con un ítem del catálogo o manual ya agregado
  const findDuplicateIndex = (
    currentIndex: number,
    descripcion: string
  ): { targetIndex: number; targetName: string } | null => {
    const norm = normalizar(descripcion);
    if (!norm) return null;

    for (let i = 0; i < materialesSeleccionados.length; i++) {
      if (i === currentIndex) continue;
      const other = materialesSeleccionados[i];

      if (other.esPersonalizado) {
        if (normalizar(other.descripcion) === norm) {
          return {
            targetIndex: i,
            targetName: other.descripcion.trim() || 'Ítem personalizado',
          };
        }
      } else if (other.materialId !== null) {
        const nombreCat = getCatalogoNombre(other.materialId);
        if (normalizar(nombreCat) === norm) {
          return {
            targetIndex: i,
            targetName: nombreCat,
          };
        }
      }
    }

    return null;
  };

  // Incrementa la cantidad en la tarjeta existente y elimina la fila duplicada
  const handleFusionarDuplicado = (fromIndex: number, targetIndex: number) => {
    const itemOrigen = materialesSeleccionados[fromIndex];
    if (!itemOrigen) return;

    const targetName =
      materialesSeleccionados[targetIndex].esPersonalizado
        ? materialesSeleccionados[targetIndex].descripcion.trim() || 'Ítem existente'
        : getCatalogoNombre(materialesSeleccionados[targetIndex].materialId);

    const cantASumar = itemOrigen.cantidad;

    setMaterialesSeleccionados((prev) => {
      return prev
        .map((item, idx) => {
          if (idx === targetIndex) {
            return { ...item, cantidad: item.cantidad + cantASumar };
          }
          return item;
        })
        .filter((_, idx) => idx !== fromIndex);
    });

    toast.info(`Se sumaron ${cantASumar} unidad(es) a "${targetName}" para evitar duplicados.`);
  };

  const handleAddMaterialPersonalizado = () => {
    setMaterialesSeleccionados((prev) => [
      ...prev,
      {
        materialId: null,
        descripcion: '',
        cantidad: 1,
        esPersonalizado: true,
      },
    ]);
  };

  const handleQuickAddCatalogo = (catId: number) => {
    const catObj = catalogo.find((c) => c.id === catId);
    if (!catObj) return;

    setMaterialesSeleccionados((prev) => {
      const idxExistente = prev.findIndex(
        (m) =>
          (!m.esPersonalizado && m.materialId === catId) ||
          (m.esPersonalizado && normalizar(m.descripcion) === normalizar(catObj.nombre))
      );
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
    const selectedCatIds = new Set(
      materialesSeleccionados
        .filter((m) => !m.esPersonalizado && m.materialId !== null)
        .map((m) => m.materialId)
    );
    const manualNormalizedNames = new Set(
      materialesSeleccionados
        .filter((m) => m.esPersonalizado && m.descripcion.trim())
        .map((m) => normalizar(m.descripcion))
    );

    const primerDisponible = catalogo.find(
      (cat) => !selectedCatIds.has(cat.id) && !manualNormalizedNames.has(normalizar(cat.nombre))
    );

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
      // Si todos los del catálogo ya están seleccionados, agregar como personalizado
      handleAddMaterialPersonalizado();
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

  const handleUpdateDescripcion = (index: number, descripcion: string) => {
    const updated = [...materialesSeleccionados];
    updated[index] = {
      ...updated[index],
      descripcion,
      esPersonalizado: true,
      materialId: null,
    };
    setMaterialesSeleccionados(updated);
  };

  const handleTogglePersonalizado = (index: number, esPersonalizado: boolean) => {
    if (!esPersonalizado) {
      if (catalogo.length === 0) {
        toast.info('No hay materiales en el catálogo para esta especialidad.');
        return;
      }

      const selectedCatIds = new Set(
        materialesSeleccionados
          .filter((m, i) => i !== index && !m.esPersonalizado && m.materialId !== null)
          .map((m) => m.materialId)
      );
      const manualNormalizedNames = new Set(
        materialesSeleccionados
          .filter((m, i) => i !== index && m.esPersonalizado && m.descripcion.trim())
          .map((m) => normalizar(m.descripcion))
      );

      const primerDisponible = catalogo.find(
        (cat) => !selectedCatIds.has(cat.id) && !manualNormalizedNames.has(normalizar(cat.nombre))
      );

      if (!primerDisponible) {
        toast.info('Todos los ítems del catálogo ya están seleccionados en la lista.');
        return;
      }

      const updated = [...materialesSeleccionados];
      updated[index] = {
        ...updated[index],
        esPersonalizado: false,
        materialId: primerDisponible.id,
        descripcion: '',
      };
      setMaterialesSeleccionados(updated);
    } else {
      const updated = [...materialesSeleccionados];
      updated[index] = {
        ...updated[index],
        esPersonalizado: true,
        materialId: null,
        descripcion: updated[index].descripcion || '',
      };
      setMaterialesSeleccionados(updated);
    }
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

    // Validar que ningún material personalizado haya quedado vacío o solo con espacios
    const tieneMaterialPersonalizadoVacio = materialesSeleccionados.some(
      (m) => (m.esPersonalizado || m.materialId === null) && !m.descripcion.trim()
    );
    if (tieneMaterialPersonalizadoVacio) {
      toast.error('Por favor escribe el nombre del material personalizado o elimínalo de la lista.');
      return;
    }

    setSubmitting(true);

    // Sanitizar cualquier duplicado residual antes de procesar
    const materialesLimpios = sanitizarMateriales(materialesSeleccionados, catalogo);
    if (materialesLimpios.length !== materialesSeleccionados.length) {
      setMaterialesSeleccionados(materialesLimpios);
    }

    // Estructurar array de materiales para Spring Boot
    const listaMateriales: MaterialConsumido[] = materialesLimpios.map((m) => {
      if (m.esPersonalizado || m.materialId === null) {
        return {
          materialId: null,
          descripcion: m.descripcion.trim() || 'Material personalizado',
          cantidad: m.cantidad,
        };
      }
      return {
        materialId: m.materialId,
        descripcion: null,
        cantidad: m.cantidad,
      };
    });

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

            {/* MATERIALES EMPLEADOS */}
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
                        ? 'Opcional — registra repuestos o insumos usados'
                        : `${materialesSeleccionados.length} ${
                            materialesSeleccionados.length === 1 ? 'material registrado' : 'materiales registrados'
                          }`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {catalogo.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200/80 text-[11px] font-bold active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Catálogo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddMaterialPersonalizado}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 text-[11px] font-bold active:scale-95 transition-all"
                  >
                    <PenLine className="w-3 h-3" />
                    <span>{catalogo.length > 0 ? 'Otro' : '+ Agregar'}</span>
                  </button>
                </div>
              </div>

              {/* Chips rápidos del catálogo en 1 toque */}
              {catalogo.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/70 space-y-1.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
                    Toque rápido para agregar o sumar (+1):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {catalogo.slice(0, 8).map((cat) => {
                      const seleccionado = materialesSeleccionados.find(
                        (m) => !m.esPersonalizado && m.materialId === cat.id
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
                          <span className="truncate max-w-[180px]">{nombreCorto}</span>
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

              {/* Lista de Tarjetas Individuales de Materiales */}
              {materialesSeleccionados.length > 0 ? (
                <div className="space-y-2.5">
                  {materialesSeleccionados.map((item, idx) => {
                    // Filtrar opciones del catálogo excluyendo las ya seleccionadas en otras filas
                    const opcionesDisponibles = catalogo.filter((cat) => {
                      if (item.materialId === cat.id) return true;
                      const yaEnCatalogo = materialesSeleccionados.some(
                        (m, otherIdx) => otherIdx !== idx && !m.esPersonalizado && m.materialId === cat.id
                      );
                      if (yaEnCatalogo) return false;

                      const yaEnManual = materialesSeleccionados.some(
                        (m, otherIdx) =>
                          otherIdx !== idx &&
                          m.esPersonalizado &&
                          normalizar(m.descripcion) === normalizar(cat.nombre)
                      );
                      if (yaEnManual) return false;

                      return true;
                    });

                    // Si no hay opciones de catálogo disponibles o no tiene materialId válido, forzar vista manual para evitar <select> vacío con "Personalizado..."
                    const usarVistaPersonalizada =
                      item.esPersonalizado || opcionesDisponibles.length === 0 || item.materialId === null;

                    // Extraer unidad de medida si está en el nombre del catálogo "Material (Unidad)"
                    const catActual = !usarVistaPersonalizada
                      ? catalogo.find((c) => c.id === item.materialId)
                      : null;
                    const matchUnidad = catActual?.nombre.match(/\(([^)]+)\)\s*$/);
                    const unidadTexto = matchUnidad ? matchUnidad[1] : 'Unid.';

                    // Validar si la descripción manual coincide con otro ítem
                    const dupInfo = usarVistaPersonalizada
                      ? findDuplicateIndex(idx, item.descripcion)
                      : null;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border space-y-2.5 transition-all shadow-2xs ${
                          dupInfo
                            ? 'bg-rose-50/60 border-rose-300'
                            : 'bg-white border-slate-200/90'
                        }`}
                      >
                        {/* Fila 1: Cabecera de tarjeta (Índice + Modo + Cambio de Modo + Eliminar) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="inline-flex items-center justify-center px-2 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-extrabold">
                              #{idx + 1}
                            </span>
                            {usarVistaPersonalizada ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/70 text-[10px] font-bold">
                                <PenLine className="w-2.5 h-2.5" />
                                Personalizado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/70 text-[10px] font-bold">
                                <Package className="w-2.5 h-2.5" />
                                Catálogo
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {usarVistaPersonalizada && opcionesDisponibles.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleTogglePersonalizado(idx, false)}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200/80 text-[11px] font-bold transition-colors active:scale-95"
                              >
                                Usar catálogo
                              </button>
                            )}
                            {!usarVistaPersonalizada && (
                              <button
                                type="button"
                                onClick={() => handleTogglePersonalizado(idx, true)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200 text-[11px] font-semibold transition-colors active:scale-95"
                              >
                                Escribir otro
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(idx)}
                              title="Eliminar material"
                              aria-label="Eliminar material"
                              className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition-colors active:scale-95 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Fila 2: Input o Select a 100% de ancho (sin recortes en móvil) */}
                        {usarVistaPersonalizada ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              required
                              placeholder="Ej: Tomacorriente doble, Cinta teflón..."
                              value={item.descripcion}
                              onChange={(e) => handleUpdateDescripcion(idx, e.target.value)}
                              onBlur={() => {
                                if (dupInfo) {
                                  handleFusionarDuplicado(idx, dupInfo.targetIndex);
                                }
                              }}
                              className={`w-full min-h-[44px] bg-slate-50/70 focus:bg-white border ${
                                dupInfo
                                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20 bg-rose-50/30 text-rose-900'
                                  : 'border-slate-200 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] text-slate-800'
                              } rounded-xl px-3.5 py-2.5 text-sm font-medium placeholder:text-slate-400 focus:outline-none transition-all`}
                            />

                            {/* Alerta interactiva de duplicado */}
                            {dupInfo && (
                              <div className="flex items-center justify-between gap-2 bg-rose-100/90 border border-rose-200 rounded-xl px-3 py-2 text-[11px] text-rose-800">
                                <span className="font-medium">
                                  ⚠️ Este material ya está en la lista.
                                </span>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleFusionarDuplicado(idx, dupInfo.targetIndex);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-700 text-white text-[11px] font-bold whitespace-nowrap active:scale-95"
                                >
                                  Sumar (+{item.cantidad})
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={item.materialId ?? ''}
                              onChange={(e) => {
                                if (e.target.value === 'OTRO') {
                                  handleTogglePersonalizado(idx, true);
                                } else {
                                  handleUpdateMaterialId(idx, Number(e.target.value));
                                }
                              }}
                              className="w-full min-h-[44px] appearance-none bg-slate-50/70 focus:bg-white border border-slate-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] transition-all"
                            >
                              {opcionesDisponibles.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.nombre}
                                </option>
                              ))}
                              <option value="OTRO">✏️ Escribir otro material...</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        )}

                        {/* Fila 3: Control de Cantidad Stepper Ergonómico */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500 font-semibold">
                              Cantidad
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
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

                  {/* Botón inferior para agregar otro material sin subir el scroll */}
                  <button
                    type="button"
                    onClick={handleAddMaterialPersonalizado}
                    className="w-full py-2.5 border border-dashed border-slate-300 hover:border-sky-400 rounded-xl flex items-center justify-center gap-1.5 text-slate-600 hover:text-[#0284c7] bg-slate-50/50 hover:bg-sky-50/40 text-xs font-bold transition-all active:scale-[0.99]"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Agregar otro material</span>
                  </button>
                </div>
              ) : (
                /* Estado vacío limpio cuando no se han registrado materiales */
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center space-y-2.5">
                  <p className="text-xs text-slate-500 font-medium">
                    No se han registrado materiales para este servicio
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {catalogo.length > 0 && (
                      <button
                        type="button"
                        onClick={handleAddMaterial}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold shadow-xs shadow-sky-500/20 transition-all active:scale-95"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Elegir del Catálogo</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddMaterialPersonalizado}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        catalogo.length > 0
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          : 'w-full py-3 bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200'
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Agregar Material Utilizado</span>
                    </button>
                  </div>
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

