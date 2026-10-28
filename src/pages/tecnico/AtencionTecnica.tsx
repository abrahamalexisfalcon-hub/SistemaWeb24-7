import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { catalogoApi, materialApi, tecnicoApi } from '../../api';
import { useOrdenes } from '../../context/OrdenesContext';
import { TecnicoLayout, OrderStepper } from '../../components/tecnico';
import type { OrdenResumenTecnico, MaterialCatalogo, MaterialConsumido } from '../../types';
import { ChevronLeft, Plus, Trash2, Minus, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatearHoraLocal } from '../../utils/dateFormatter';

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

  // DNI opcional: se recupera del borrador o de la orden ya registrada
  const [dniAfiliado, setDniAfiliado] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`borrador_atencion_${id || '1'}`);
      if (saved) {
        const parsed: BorradorAtencion = JSON.parse(saved);
        if (parsed.dniAfiliado) return parsed.dniAfiliado;
      }
    } catch (e) {
      console.error('Error cargando borrador de DNI:', e);
    }
    return orden?.dniAfiliado || '';
  });
  const dniEditadoRef = React.useRef(false);

  useEffect(() => {
    if (!dniEditadoRef.current && !dniAfiliado && orden?.dniAfiliado) {
      setDniAfiliado(orden.dniAfiliado);
    }
  }, [orden?.dniAfiliado, dniAfiliado]);

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
      dniAfiliado,
      materialesSeleccionados,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    } catch (e) {
      console.error('Error guardando borrador en localStorage:', e);
    }
  }, [evaluacion, solucion, sugerencias, dniAfiliado, materialesSeleccionados, DRAFT_KEY]);

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

      // Fallback a catalogo general
      catalogoApi
        .getMaterialesActivos()
        .then((data) => {
          setCatalogo(data);
        })
        .catch((err) => {
          console.warn('Usando catálogo inicial local:', err);
          setCatalogo([
            { id: 1, nombre: 'Cable eléctrico 2.5mm (metro)' },
            { id: 2, nombre: 'Interruptor termomagnético 20A' },
            { id: 3, nombre: 'Cinta aislante 3M' },
            { id: 4, nombre: 'Toma corriente doble' },
            { id: 5, nombre: 'Tubo conduit 1/2' },
            { id: 6, nombre: 'Empaque de jebe para grifería' },
          ]);
        });
    };

    fetchMateriales();
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
      setMaterialesSeleccionados((prev) => [
        ...prev,
        {
          materialId: null,
          descripcion: '',
          cantidad: 1,
          esPersonalizado: true,
        },
      ]);
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
    updated[index] = { ...updated[index], descripcion };
    setMaterialesSeleccionados(updated);
  };

  const handleTogglePersonalizado = (index: number, esPersonalizado: boolean) => {
    if (!esPersonalizado) {
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

      if (!primerDisponible && catalogo.length > 0) {
        toast.info('Todos los ítems del catálogo ya están seleccionados en la lista.');
        return;
      }

      const updated = [...materialesSeleccionados];
      updated[index] = {
        ...updated[index],
        esPersonalizado: false,
        materialId: primerDisponible ? primerDisponible.id : (catalogo[0]?.id ?? null),
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

    setSubmitting(true);

    // Sanitizar cualquier duplicado residual antes de procesar
    const materialesLimpios = sanitizarMateriales(materialesSeleccionados, catalogo);
    if (materialesLimpios.length !== materialesSeleccionados.length) {
      setMaterialesSeleccionados(materialesLimpios);
    }

    // Estructurar array de materiales para Spring Boot
    const listaMateriales: MaterialConsumido[] = materialesLimpios.map((m) => {
      if (m.esPersonalizado) {
        return {
          materialId: null,
          descripcion: m.descripcion || 'Material personalizado',
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
          dniAfiliado: dniAfiliado.trim() || undefined,
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

            {/* DNI OPCIONAL DEL CLIENTE */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  DNI DEL CLIENTE <span className="text-slate-400 font-normal lowercase"></span>
                </label>
                {dniAfiliado.trim() && (
                  <span className="text-[10px] text-emerald-600 font-semibold">Registrado</span>
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={15}
                value={dniAfiliado}
                onChange={(e) => {
                  dniEditadoRef.current = true;
                  setDniAfiliado(e.target.value);
                }}
                placeholder="Ej. 70920543 (si el cliente lo proporciona)"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Puedes dejarlo en blanco si el cliente prefiere no brindarlo o no lo tiene a la mano.
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  MATERIALES EMPLEADOS
                </label>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0ea5e9] hover:underline active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Ítem
                </button>
              </div>

              {/* Lista de Tarjetas Individuales de Materiales */}
              {materialesSeleccionados.length > 0 ? (
                <div className="space-y-1">
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

                    // Validar si la descripción manual coincide con otro ítem
                    const dupInfo = item.esPersonalizado
                      ? findDuplicateIndex(idx, item.descripcion)
                      : null;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border mb-2.5 space-y-2.5 transition-all ${
                          dupInfo
                            ? 'bg-rose-50/50 border-rose-300'
                            : 'bg-gray-50/70 border-gray-200'
                        }`}
                      >
                        {/* Fila superior: Selector de material o input si es "Otro", y botón de eliminar */}
                        <div className="flex items-center justify-between gap-2">
                          {item.esPersonalizado ? (
                            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <input
                                  type="text"
                                  required
                                  placeholder="Describe el material personalizado..."
                                  value={item.descripcion}
                                  onChange={(e) => handleUpdateDescripcion(idx, e.target.value)}
                                  onBlur={() => {
                                    if (dupInfo) {
                                      handleFusionarDuplicado(idx, dupInfo.targetIndex);
                                    }
                                  }}
                                  className={`flex-1 bg-white border ${
                                    dupInfo
                                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/30 text-rose-900'
                                      : 'border-gray-300 focus:ring-2 focus:ring-[#0ea5e9] text-gray-800'
                                  } rounded-lg px-2.5 py-1.5 text-xs placeholder:text-gray-400 focus:outline-none transition-colors`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleTogglePersonalizado(idx, false)}
                                  className="text-[11px] text-[#0ea5e9] hover:underline font-semibold whitespace-nowrap px-1"
                                  title="Elegir del catálogo"
                                >
                                  Catálogo
                                </button>
                              </div>

                              {/* Alerta interactiva de duplicado */}
                              {dupInfo && (
                                <div className="flex items-center justify-between bg-rose-100/90 border border-rose-200 rounded-lg px-2.5 py-1 text-[11px] text-rose-800">
                                  <span className="font-medium">
                                    ⚠️ Este material ya está registrado en la lista.
                                  </span>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleFusionarDuplicado(idx, dupInfo.targetIndex);
                                    }}
                                    className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900 ml-1.5 whitespace-nowrap"
                                  >
                                    Sumar (+{item.cantidad})
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <select
                              value={item.materialId ?? ''}
                              onChange={(e) => {
                                if (e.target.value === 'OTRO') {
                                  handleTogglePersonalizado(idx, true);
                                } else {
                                  handleUpdateMaterialId(idx, Number(e.target.value));
                                }
                              }}
                              className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
                            >
                              {opcionesDisponibles.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.nombre}
                                </option>
                              ))}
                              <option value="OTRO">Personalizado...</option>
                            </select>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveMaterial(idx)}
                            title="Eliminar material"
                            className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Fila inferior: Control de Cantidad Stepper */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                          <span className="text-xs text-gray-500 font-medium">
                            Cantidad:
                          </span>

                          <div className="inline-flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                            <button
                              type="button"
                              disabled={item.cantidad <= 1}
                              onClick={() => handleCambiarCantidad(idx, item.cantidad - 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 disabled:opacity-30 rounded-l-lg"
                              title="Disminuir cantidad"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="w-10 text-center font-bold text-gray-800 select-none text-sm">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCambiarCantidad(idx, item.cantidad + 1)}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 rounded-r-lg"
                              title="Aumentar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Estado vacío limpio cuando no se han registrado materiales */
                <div className="space-y-2 py-1">
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="w-full py-3.5 border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-xl flex items-center justify-center gap-2 text-sky-600 bg-sky-50/50 hover:bg-sky-50 text-sm font-semibold transition-all active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span> Agregar Material Utilizado</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    No se han registrado materiales para este servicio
                  </p>
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

