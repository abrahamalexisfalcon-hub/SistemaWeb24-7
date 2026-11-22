import React, { useState, useEffect, useMemo } from 'react';
import type { CrearOrdenRequest, Afiliado, TecnicoResumen, Cuenta } from '../../../types';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Package,
  Layers,
  Building2,
  Calendar,
  Clock,
  Hash,
  MapPin,
  UserCheck,
  User,
  UserPlus,
  Wrench,
  Zap,
  Sun,
  Moon,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Phone,
  Sparkles,
  SlidersHorizontal,
  Send,
  Star,
  Home,
  Check,
  X,
} from 'lucide-react';
import { obtenerFechaHoraActualLocal } from '../useAdminDashboard';
import { obtenerEspecialidadesTecnico } from '../../../utils/tecnicoEspecialidades';
import {
  encontrarUbigeoPorDistrito,
  obtenerDepartamentos,
  obtenerProvincias,
  obtenerDistritos,
} from '../../../utils/ubigeoPeru';
import {
  obtenerDireccionesAfiliado,
  obtenerDireccionPrincipal,
} from '../../../utils/afiliadoDirecciones';

interface NuevaOrdenTabProps {
  nuevaOrden: CrearOrdenRequest;
  onNuevaOrdenChange: (val: CrearOrdenRequest) => void;
  especialidades: string[];
  cargandoEspecialidades: boolean;
  cuentas: Cuenta[];
  cargandoCuentas: boolean;
  afiliados: Afiliado[];
  tecnicos: TecnicoResumen[];
  submitting: boolean;
  formError: string | null;
  formExito: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onAbrirNuevoAfiliado: () => void;
  onAbrirMateriales: () => void;
  onAbrirEspecialidades: () => void;
  onAbrirCuentas: () => void;
  onOpenPerfil?: () => void;
}

const HORAS_12 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTOS_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const ATAJOS_RAPIDOS = [
  { label: 'Ahora', minutos: 5, icono: 'zap' as const },
  { label: '+30 min', minutos: 30, icono: 'clock' as const },
  { label: '+1 hora', minutos: 60, icono: 'clock' as const },
  { label: '+2 horas', minutos: 120, icono: 'clock' as const },
];

const calcularFechaHoraConMinutos = (minutosAdicionales: number): string => {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() + minutosAdicionales);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
};

const calcularManana9AM = (): string => {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${manana.getFullYear()}-${pad(manana.getMonth() + 1)}-${pad(manana.getDate())}T09:00`;
};

export const NuevaOrdenTab: React.FC<NuevaOrdenTabProps> = ({
  nuevaOrden,
  onNuevaOrdenChange,
  especialidades,
  cargandoEspecialidades,
  cuentas,
  cargandoCuentas,
  afiliados,
  tecnicos,
  submitting,
  formError,
  formExito,
  onSubmit,
  onAbrirNuevoAfiliado,
  onAbrirMateriales,
  onAbrirEspecialidades,
  onAbrirCuentas,
  onOpenPerfil,
}) => {
  const [minDateTime, setMinDateTime] = useState<string>(() => obtenerFechaHoraActualLocal());

  // Estado inline para "+ Usar otra dirección" en la orden
  const [mostrarOtraDireccion, setMostrarOtraDireccion] = useState<boolean>(false);
  const [otraEtiqueta, setOtraEtiqueta] = useState<string>('Casa 2');
  const [otraDireccion, setOtraDireccion] = useState<string>('');
  const [otraDepartamento, setOtraDepartamento] = useState<string>('Lima');
  const [otraProvincia, setOtraProvincia] = useState<string>('Lima');
  const [otraDistrito, setOtraDistrito] = useState<string>('Villa El Salvador');
  const [otraReferencia, setOtraReferencia] = useState<string>('');
  const [otraError, setOtraError] = useState<string | null>(null);

  const departamentosUbigeo = useMemo(() => obtenerDepartamentos(), []);
  const provinciasOtra = useMemo(() => obtenerProvincias(otraDepartamento), [otraDepartamento]);
  const distritosOtra = useMemo(
    () => obtenerDistritos(otraDepartamento, otraProvincia),
    [otraDepartamento, otraProvincia]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMinDateTime(obtenerFechaHoraActualLocal());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Descomponer nuevaOrden.fechaPactada ("YYYY-MM-DDTHH:mm") en Fecha + Hora 12h + Minutos + AM/PM
  const { fechaPart, hora12, minutoPart, periodo } = useMemo(() => {
    const raw =
      nuevaOrden.fechaPactada && nuevaOrden.fechaPactada.includes('T')
        ? nuevaOrden.fechaPactada
        : minDateTime;

    const [fechaStr, timeStr = '09:00'] = raw.split('T');
    const [hhStr = '09', mmStr = '00'] = timeStr.slice(0, 5).split(':');
    const hh24 = Number.isNaN(parseInt(hhStr, 10)) ? 9 : parseInt(hhStr, 10);
    const mm = MINUTOS_60.includes(mmStr) ? mmStr : '00';

    const per: 'AM' | 'PM' = hh24 >= 12 ? 'PM' : 'AM';
    const h12Num = hh24 % 12 === 0 ? 12 : hh24 % 12;
    const h12 = String(h12Num).padStart(2, '0');

    return {
      fechaPart: fechaStr,
      hora12: h12,
      minutoPart: mm,
      periodo: per,
    };
  }, [nuevaOrden.fechaPactada, minDateTime]);

  const minDateOnly = useMemo(() => minDateTime.split('T')[0], [minDateTime]);

  const actualizarFechaHora12 = (
    nuevaFecha: string,
    nuevaHora12: string,
    nuevoMinuto: string,
    nuevoPeriodo: 'AM' | 'PM'
  ) => {
    const h12 = parseInt(nuevaHora12, 10) || 12;
    let h24 = h12;
    if (nuevoPeriodo === 'AM') {
      h24 = h12 === 12 ? 0 : h12;
    } else {
      h24 = h12 === 12 ? 12 : h12 + 12;
    }
    const hh24Str = String(h24).padStart(2, '0');
    const fechaFinal = nuevaFecha || minDateOnly;
    onNuevaOrdenChange({
      ...nuevaOrden,
      fechaPactada: `${fechaFinal}T${hh24Str}:${nuevoMinuto}`,
    });
  };

  const aplicarAtajoTiempo = (minutosAdicionales: number) => {
    const isoLocal = calcularFechaHoraConMinutos(minutosAdicionales);
    setMinDateTime(obtenerFechaHoraActualLocal());
    onNuevaOrdenChange({
      ...nuevaOrden,
      fechaPactada: isoLocal,
    });
  };

  const aplicarManana9AM = () => {
    const isoLocal = calcularManana9AM();
    onNuevaOrdenChange({
      ...nuevaOrden,
      fechaPactada: isoLocal,
    });
  };

  // Vista previa legible de la fecha y hora pactada con AM / PM
  const resumenFechaPactada = useMemo(() => {
    if (!fechaPart) return '';
    const [anio, mes, dia] = fechaPart.split('-').map(Number);
    if (!anio || !mes || !dia) return `${hora12}:${minutoPart} ${periodo}`;
    const fechaObj = new Date(anio, mes - 1, dia);
    const [hoyAnio, hoyMes, hoyDia] = minDateOnly.split('-').map(Number);
    const hoy = new Date(hoyAnio, hoyMes - 1, hoyDia);
    const esHoy =
      fechaObj.getFullYear() === hoy.getFullYear() &&
      fechaObj.getMonth() === hoy.getMonth() &&
      fechaObj.getDate() === hoy.getDate();

    const manana = new Date(hoyAnio, hoyMes - 1, hoyDia + 1);
    const esManana =
      fechaObj.getFullYear() === manana.getFullYear() &&
      fechaObj.getMonth() === manana.getMonth() &&
      fechaObj.getDate() === manana.getDate();

    const fechaCorta = fechaObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const prefijoDia = esHoy ? 'Hoy, ' : esManana ? 'Mañana, ' : '';
    return `${prefijoDia}${fechaCorta} • ${hora12}:${minutoPart} ${periodo}`;
  }, [fechaPart, hora12, minutoPart, periodo, minDateOnly]);

  // Verificar si la fecha/hora seleccionada quedó en el pasado
  const esHorarioPasado = useMemo(() => {
    if (!nuevaOrden.fechaPactada) return false;
    const seleccionada = new Date(nuevaOrden.fechaPactada);
    const ahora = new Date(minDateTime);
    return !isNaN(seleccionada.getTime()) && !isNaN(ahora.getTime()) && seleccionada < ahora;
  }, [nuevaOrden.fechaPactada, minDateTime]);

  const cuentaSeleccionada = useMemo(
    () => (cuentas || []).find((c) => c.id === Number(nuevaOrden.cuentaId)) || null,
    [cuentas, nuevaOrden.cuentaId]
  );

  const afiliadoSeleccionado = useMemo(
    () => (afiliados || []).find((a) => a.id === Number(nuevaOrden.afiliadoId)) || null,
    [afiliados, nuevaOrden.afiliadoId]
  );

  const direccionesAfiliado = useMemo(
    () => obtenerDireccionesAfiliado(afiliadoSeleccionado),
    [afiliadoSeleccionado]
  );

  // Sincronización inicial si el afiliado está seleccionado y aún no se ha fijado dirección
  useEffect(() => {
    if (!afiliadoSeleccionado) return;
    if (
      nuevaOrden.direccionServicio === undefined &&
      nuevaOrden.direccionId === undefined &&
      !nuevaOrden.etiquetaDireccion
    ) {
      const principal = obtenerDireccionPrincipal(afiliadoSeleccionado);
      if (principal) {
        onNuevaOrdenChange({
          ...nuevaOrden,
          direccionId: principal.id && principal.id > 0 ? principal.id : undefined,
          direccionServicio: principal.direccion,
          distritoServicio: principal.distrito,
          referenciaServicio: principal.referencia || '',
          etiquetaDireccion: undefined,
        });
      }
    }
  }, [afiliadoSeleccionado, nuevaOrden, onNuevaOrdenChange]);

  const handleSeleccionarAfiliado = (nuevoId: number) => {
    const afiliadoObj = (afiliados || []).find((a) => a.id === nuevoId);
    const principal = obtenerDireccionPrincipal(afiliadoObj);
    onNuevaOrdenChange({
      ...nuevaOrden,
      afiliadoId: nuevoId,
      direccionId: principal?.id && principal.id > 0 ? principal.id : undefined,
      direccionServicio: principal?.direccion || '',
      distritoServicio: principal?.distrito || '',
      referenciaServicio: principal?.referencia || '',
      etiquetaDireccion: undefined,
    });
    setMostrarOtraDireccion(false);
    setOtraError(null);
  };

  const handleDepartamentoOtraChange = (nuevoDep: string) => {
    setOtraDepartamento(nuevoDep);
    const provs = obtenerProvincias(nuevoDep);
    const primeraProv = provs[0] || '';
    const dists = primeraProv ? obtenerDistritos(nuevoDep, primeraProv) : [];
    setOtraProvincia(primeraProv);
    setOtraDistrito(dists[0] || '');
  };

  const handleProvinciaOtraChange = (nuevaProv: string) => {
    setOtraProvincia(nuevaProv);
    const dists = obtenerDistritos(otraDepartamento, nuevaProv);
    setOtraDistrito(dists[0] || '');
  };

  const handleAplicarOtraDireccion = () => {
    if (!otraDireccion.trim()) {
      setOtraError('Ingresa la dirección exacta para este servicio.');
      return;
    }
    if (!otraDistrito.trim()) {
      setOtraError('Selecciona el distrito para este servicio.');
      return;
    }
    setOtraError(null);
    onNuevaOrdenChange({
      ...nuevaOrden,
      direccionId: undefined,
      direccionServicio: otraDireccion.trim(),
      distritoServicio: otraDistrito.trim(),
      referenciaServicio: otraReferencia.trim(),
      etiquetaDireccion: otraEtiqueta.trim() || 'Otra dirección',
    });
    setMostrarOtraDireccion(false);
  };

  const esCustomDireccionActiva = Boolean(
    !nuevaOrden.direccionId && nuevaOrden.etiquetaDireccion && nuevaOrden.direccionServicio
  );

  const abrirFormOtraDireccion = () => {
    setOtraError(null);
    if (esCustomDireccionActiva) {
      const ub = encontrarUbigeoPorDistrito(nuevaOrden.distritoServicio);
      setOtraEtiqueta(nuevaOrden.etiquetaDireccion || 'Casa 2');
      setOtraDireccion(nuevaOrden.direccionServicio || '');
      setOtraDepartamento(ub.departamento);
      setOtraProvincia(ub.provincia);
      setOtraDistrito(ub.distrito);
      setOtraReferencia(nuevaOrden.referenciaServicio || '');
    } else {
      setOtraEtiqueta('Casa 2');
      setOtraDireccion('');
      setOtraDepartamento('Lima');
      setOtraProvincia('Lima');
      setOtraDistrito('Villa El Salvador');
      setOtraReferencia('');
    }
    setMostrarOtraDireccion(true);
  };

  const tecnicoSeleccionado = useMemo(
    () => (tecnicos || []).find((t) => t.id === Number(nuevaOrden.tecnicoId)) || null,
    [tecnicos, nuevaOrden.tecnicoId]
  );

  const tecnicosActivos = useMemo(
    () => (tecnicos || []).filter((t) => t && t.activo !== false),
    [tecnicos]
  );

  const tecnicosCompatibles = useMemo(() => {
    const servicioActual = (nuevaOrden.tipoServicio || '').trim().toLowerCase();
    if (!servicioActual) return [];
    return tecnicosActivos
      .filter((t) =>
        obtenerEspecialidadesTecnico(t).some(
          (esp) => esp.trim().toLowerCase() === servicioActual
        )
      )
      .sort((a, b) => Number(Boolean(b.disponible)) - Number(Boolean(a.disponible)));
  }, [tecnicosActivos, nuevaOrden.tipoServicio]);

  const esConflictoCaso = Boolean(
    formError && formError.toLowerCase().includes('número de caso')
  );
  const esConflictoOt = Boolean(
    formError && formError.toLowerCase().includes('número de ot')
  );

  const seccion1CamposLlenos = useMemo(() => {
    let count = 0;
    if (Number(nuevaOrden.cuentaId) > 0) count += 1;
    if ((nuevaOrden.tipoServicio || '').trim()) count += 1;
    if ((nuevaOrden.numeroCaso || '').trim()) count += 1;
    if ((nuevaOrden.numeroOt || '').trim()) count += 1;
    return count;
  }, [
    nuevaOrden.cuentaId,
    nuevaOrden.tipoServicio,
    nuevaOrden.numeroCaso,
    nuevaOrden.numeroOt,
  ]);

  const seccion1Completa = seccion1CamposLlenos === 4;
  const seccion3Completa = Boolean(afiliadoSeleccionado && tecnicoSeleccionado);

  const camposCompletos = useMemo(() => {
    let total = seccion1CamposLlenos;
    if (Number(nuevaOrden.afiliadoId) > 0) total += 1;
    if (Number(nuevaOrden.tecnicoId) > 0) total += 1;
    return total;
  }, [seccion1CamposLlenos, nuevaOrden.afiliadoId, nuevaOrden.tecnicoId]);

  const gestionItems = useMemo(
    () => [
      {
        id: 'materiales',
        shortLabel: 'Materiales',
        title: 'Catálogo de Materiales',
        subtitle: 'Repuestos e insumos por especialidad',
        badge: null as string | null,
        shortBadge: null as number | null,
        onClick: onAbrirMateriales,
        Icon: Package,
        mobileBtnClass:
          'bg-sky-50/90 border-sky-200/80 text-sky-900 hover:bg-sky-100/80',
        mobileIconClass: 'bg-sky-100 text-sky-600',
        mobileBadgeClass: 'bg-sky-600 text-white',
        cardClass: 'border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/30',
        cardIconBoxClass: 'bg-sky-50 border-sky-100 text-sky-600',
        cardTitleHoverClass: 'group-hover:text-sky-700',
        cardBadgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      },
      {
        id: 'especialidades',
        shortLabel: 'Rubros',
        title: 'Especialidades y Rubros',
        subtitle: 'Rubros y tipos de servicio',
        badge: `${(especialidades || []).length} activas`,
        shortBadge: (especialidades || []).length,
        onClick: onAbrirEspecialidades,
        Icon: Layers,
        mobileBtnClass:
          'bg-indigo-50/90 border-indigo-200/80 text-indigo-900 hover:bg-indigo-100/80',
        mobileIconClass: 'bg-indigo-100 text-indigo-600',
        mobileBadgeClass: 'bg-indigo-600 text-white',
        cardClass: 'border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30',
        cardIconBoxClass: 'bg-indigo-50 border-indigo-100 text-indigo-600',
        cardTitleHoverClass: 'group-hover:text-indigo-700',
        cardBadgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      {
        id: 'cuentas',
        shortLabel: 'Cuentas',
        title: 'Cuentas y Aseguradoras',
        subtitle: 'Aseguradoras y convenios',
        badge: `${(cuentas || []).length} activas`,
        shortBadge: (cuentas || []).length,
        onClick: onAbrirCuentas,
        Icon: Building2,
        mobileBtnClass:
          'bg-emerald-50/90 border-emerald-200/80 text-emerald-900 hover:bg-emerald-100/80',
        mobileIconClass: 'bg-emerald-100 text-emerald-600',
        mobileBadgeClass: 'bg-emerald-600 text-white',
        cardClass: 'border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/30',
        cardIconBoxClass: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        cardTitleHoverClass: 'group-hover:text-emerald-700',
        cardBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      {
        id: 'afiliados',
        shortLabel: '+ Cliente',
        title: 'Directorio de Afiliados',
        subtitle: 'Registrar nuevo cliente o afiliado',
        badge: `${(afiliados || []).length} registrados`,
        shortBadge: null as number | null,
        onClick: onAbrirNuevoAfiliado,
        Icon: UserPlus,
        mobileBtnClass:
          'bg-amber-50/90 border-amber-200/80 text-amber-900 hover:bg-amber-100/80',
        mobileIconClass: 'bg-amber-100 text-amber-600',
        mobileBadgeClass: 'bg-amber-600 text-white',
        cardClass: 'border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/30',
        cardIconBoxClass: 'bg-amber-50 border-amber-100 text-amber-600',
        cardTitleHoverClass: 'group-hover:text-amber-700',
        cardBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      },
    ],
    [
      onAbrirMateriales,
      onAbrirEspecialidades,
      onAbrirCuentas,
      onAbrirNuevoAfiliado,
      especialidades,
      cuentas,
      afiliados,
    ]
  );

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      {/* Cabecera del Centro de Despacho */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-1">
        <div className="flex items-start justify-between gap-3 min-w-0 w-full lg:w-auto">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight lg:text-3xl">
              Registrar Nueva Orden
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Crea y asigna una asistencia técnica vinculada a su cuenta, caso, OT y horario pactado (AM / PM)
            </p>
          </div>
          {onOpenPerfil && (
            <button
              type="button"
              onClick={onOpenPerfil}
              className="lg:hidden inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100 transition-colors shadow-xs active:scale-95 shrink-0 cursor-pointer text-xs font-bold"
              title="Perfil Administrador"
              aria-label="Perfil Administrador"
            >
              <User className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Perfil</span>
            </button>
          )}
        </div>

        {/* Badge de estado del formulario (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <div
            className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-bold shadow-sm transition-colors ${
              camposCompletos === 6
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            {camposCompletos === 6 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <ClipboardList className="w-4 h-4 text-sky-600 flex-shrink-0" />
            )}
            <span>
              {camposCompletos === 6
                ? '6/6 campos listos para despacho'
                : `${camposCompletos}/6 campos completos`}
            </span>
            <div className="flex items-center gap-1 pl-1">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <span
                  key={step}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    step <= camposCompletos
                      ? camposCompletos === 6
                        ? 'bg-emerald-500'
                        : 'bg-sky-500'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Barra Rápida Mobile de "Gestión del Servicio" */}
      <div className="lg:hidden space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Gestión del Servicio
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {camposCompletos}/6 listos
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {gestionItems.map((item) => {
            const IconComponent = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-2xl border shadow-sm transition-all active:scale-95 cursor-pointer min-h-[64px] ${item.mobileBtnClass}`}
              >
                {item.shortBadge !== null && (
                  <span
                    className={`absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center leading-none ${item.mobileBadgeClass}`}
                  >
                    {item.shortBadge}
                  </span>
                )}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.mobileIconClass}`}
                >
                  <IconComponent className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold leading-tight text-center truncate max-w-full px-0.5">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-2xl flex items-center gap-2.5 shadow-sm animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {formExito && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-2xl flex items-center gap-2.5 shadow-sm animate-in fade-in duration-150">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{formExito}</span>
        </div>
      )}

      {/* Grid Principal de Centro de Despacho: Formulario Modular (8 cols) + Ticket & Gestión (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 lg:items-start">
        {/* Columna Izquierda: Formulario Modular en 3 Tarjetas */}
        <div className="lg:col-span-8 min-w-0">
          <form onSubmit={onSubmit} className="space-y-4 lg:space-y-5">
            {/* TARJETA 1: DATOS DE CUENTA Y EXPEDIENTE */}
            <section className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                    1
                  </span>
                  <Building2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 truncate">
                    DATOS DE CUENTA Y EXPEDIENTE
                  </h2>
                </div>

                {seccion1Completa ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold flex-shrink-0">
                    {seccion1CamposLlenos}/4 datos
                  </span>
                )}
              </div>

              {/* Fila 1: Cuenta / Aseguradora y Especialidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Cuenta / Aseguradora <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={onAbrirCuentas}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Gestionar
                    </button>
                  </div>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      required
                      value={nuevaOrden.cuentaId || 0}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_CUENTA__') {
                          onAbrirCuentas();
                        } else {
                          onNuevaOrdenChange({
                            ...nuevaOrden,
                            cuentaId: Number(e.target.value),
                          });
                        }
                      }}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-9 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
                    >
                      <option value={0} disabled>
                        {cargandoCuentas ? 'Cargando cuentas...' : 'Selecciona una cuenta...'}
                      </option>
                      {(cuentas || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                      <option value="__NEW_CUENTA__" className="text-emerald-600 font-bold">
                        + Gestionar / Agregar cuenta...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Especialidad / Servicio <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={onAbrirEspecialidades}
                      className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Nueva
                    </button>
                  </div>
                  <div className="relative">
                    <Wrench className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      required
                      value={nuevaOrden.tipoServicio}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__' || e.target.value === '__NUEVA__') {
                          onAbrirEspecialidades();
                        } else {
                          onNuevaOrdenChange({ ...nuevaOrden, tipoServicio: e.target.value });
                        }
                      }}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-9 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
                    >
                      {!nuevaOrden.tipoServicio && (especialidades || []).length > 0 && (
                        <option value="" disabled>
                          Selecciona una especialidad...
                        </option>
                      )}
                      {cargandoEspecialidades ? (
                        <option value="" disabled>
                          Cargando especialidades...
                        </option>
                      ) : (especialidades || []).length === 0 ? (
                        <option value="" disabled>
                          No hay especialidades registradas
                        </option>
                      ) : (
                        (especialidades || []).map((esp) => (
                          <option key={esp} value={esp}>
                            {esp}
                          </option>
                        ))
                      )}
                      <option value="__NEW__" className="text-sky-600 font-bold">
                        + Agregar nueva especialidad...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Fila 2: Número de Caso y Número de OT en 2 columnas paralelas desde móvil */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase mb-1.5 truncate">
                    Número de Caso <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      maxLength={50}
                      placeholder="Ej. CAS-001"
                      value={nuevaOrden.numeroCaso || ''}
                      onChange={(e) =>
                        onNuevaOrdenChange({ ...nuevaOrden, numeroCaso: e.target.value })
                      }
                      className={`w-full min-w-0 bg-slate-50 border rounded-2xl py-2.5 sm:py-3 pl-8 sm:pl-9 pr-2.5 sm:pr-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        esConflictoCaso
                          ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 focus:border-sky-500 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase mb-1.5 truncate">
                    Número de OT <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      maxLength={50}
                      placeholder="Ej. OT-001"
                      value={nuevaOrden.numeroOt || ''}
                      onChange={(e) =>
                        onNuevaOrdenChange({ ...nuevaOrden, numeroOt: e.target.value })
                      }
                      className={`w-full min-w-0 bg-slate-50 border rounded-2xl py-2.5 sm:py-3 pl-8 sm:pl-9 pr-2.5 sm:pr-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        esConflictoOt
                          ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 focus:border-sky-500 focus:ring-sky-500/20'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* TARJETA 2: FECHA Y HORA PACTADA DEL SERVICIO */}
            <section className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                    2
                  </span>
                  <Calendar className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    FECHA Y HORA PACTADA DEL SERVICIO <span className="text-rose-500">*</span>
                  </h2>
                </div>

                {/* Badge resumen en vivo con AM / PM */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                    esHorarioPasado
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-sky-50/80 text-sky-800 border-sky-200/70'
                  }`}
                >
                  <Clock
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      esHorarioPasado ? 'text-amber-600' : 'text-sky-600'
                    }`}
                  />
                  {resumenFechaPactada}
                </span>
              </div>

              {/* Atajos rápidos de programación con micro-íconos */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">
                  Programación rápida:
                </span>
                {ATAJOS_RAPIDOS.map((atajo) => (
                  <button
                    key={atajo.label}
                    type="button"
                    onClick={() => aplicarAtajoTiempo(atajo.minutos)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 border border-transparent hover:border-sky-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    {atajo.icono === 'zap' ? (
                      <Zap className="w-3 h-3 text-sky-600" />
                    ) : (
                      <Clock className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{atajo.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={aplicarManana9AM}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-800 border border-transparent hover:border-amber-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>Mañana 09:00 AM</span>
                </button>
              </div>

              {/* Controles de Fecha + Hora (12h) + Selector explícito AM / PM */}
              <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                {/* Selector de Fecha */}
                <div className="col-span-2 sm:col-span-5 min-w-0">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Fecha del Servicio
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={minDateOnly}
                      value={fechaPart}
                      onFocus={() => setMinDateTime(obtenerFechaHoraActualLocal())}
                      onChange={(e) =>
                        actualizarFechaHora12(e.target.value, hora12, minutoPart, periodo)
                      }
                      className="w-full min-w-0 bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Selector de Hora (01-12) y Minutos (00-59) */}
                <div className="col-span-1 sm:col-span-4 min-w-0">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Hora
                  </label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 sm:px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 h-[42px]">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 mr-1 flex-shrink-0" />
                    <select
                      aria-label="Hora"
                      value={hora12}
                      onChange={(e) =>
                        actualizarFechaHora12(fechaPart, e.target.value, minutoPart, periodo)
                      }
                      className="w-full bg-transparent text-center text-sm font-extrabold text-slate-800 focus:outline-none cursor-pointer py-1"
                    >
                      {HORAS_12.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 font-black px-0.5">:</span>
                    <select
                      aria-label="Minutos"
                      value={minutoPart}
                      onChange={(e) =>
                        actualizarFechaHora12(fechaPart, hora12, e.target.value, periodo)
                      }
                      className="w-full bg-transparent text-center text-sm font-extrabold text-slate-800 focus:outline-none cursor-pointer py-1"
                    >
                      {MINUTOS_60.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botones segmentados AM / PM con íconos Sun / Moon */}
                <div className="col-span-1 sm:col-span-3 min-w-0">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Turno
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-200/80 p-1 rounded-xl h-[42px]">
                    <button
                      type="button"
                      onClick={() => actualizarFechaHora12(fechaPart, hora12, minutoPart, 'AM')}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg text-xs font-black tracking-wide transition-all cursor-pointer ${
                        periodo === 'AM'
                          ? 'bg-[#0284c7] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      <span>AM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => actualizarFechaHora12(fechaPart, hora12, minutoPart, 'PM')}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg text-xs font-black tracking-wide transition-all cursor-pointer ${
                        periodo === 'PM'
                          ? 'bg-[#0284c7] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      <span>PM</span>
                    </button>
                  </div>
                </div>
              </div>

              {esHorarioPasado && (
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      La hora seleccionada ({hora12}:{minutoPart} {periodo}) está en el pasado.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => aplicarAtajoTiempo(5)}
                    className="font-bold underline hover:text-amber-950 flex-shrink-0 cursor-pointer"
                  >
                    Ajustar a hora actual
                  </button>
                </div>
              )}
            </section>

            {/* TARJETA 3: ASIGNACIÓN DE AFILIADO Y TÉCNICO */}
            <section className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                    3
                  </span>
                  <UserCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 truncate">
                    ASIGNACIÓN DE AFILIADO Y TÉCNICO
                  </h2>
                </div>

                {seccion3Completa && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Asignado
                  </span>
                )}
              </div>

              {/* Afiliado / Cliente */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Afiliado / Cliente <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={onAbrirNuevoAfiliado}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Nuevo
                  </button>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    required
                    value={nuevaOrden.afiliadoId || ''}
                    onChange={(e) => handleSeleccionarAfiliado(Number(e.target.value) || 0)}
                    className={`w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-9 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer ${
                      nuevaOrden.afiliadoId ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    <option value="" disabled>
                      Selecciona un afiliado
                    </option>
                    {(afiliados || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombreCompleto || a.nombre}
                        {a.dni?.trim() ? ` (DNI: ${a.dni})` : ''} - {a.distrito}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {afiliadoSeleccionado && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                    {/* Cabecera Dirección de Atención */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                          DIRECCIÓN DE ATENCIÓN DEL SERVICIO
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {afiliadoSeleccionado.telefono && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 flex-shrink-0">
                            <Phone className="w-3 h-3 text-sky-600" />
                            <span>Tel: {afiliadoSeleccionado.telefono}</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (mostrarOtraDireccion) {
                              setMostrarOtraDireccion(false);
                              setOtraError(null);
                            } else {
                              abrirFormOtraDireccion();
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                            mostrarOtraDireccion
                              ? 'bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-white hover:bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {mostrarOtraDireccion ? (
                            <>
                              <X className="w-3 h-3" />
                              <span>Cerrar</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Usar otra dirección</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tarjetas clicables de direcciones registradas */}
                    {direccionesAfiliado.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {direccionesAfiliado.map((dir, idx) => {
                          const estaSeleccionada =
                            !esCustomDireccionActiva &&
                            (dir.id && dir.id > 0
                              ? nuevaOrden.direccionId === dir.id
                              : !nuevaOrden.direccionId &&
                                (nuevaOrden.direccionServicio
                                  ? nuevaOrden.direccionServicio === dir.direccion &&
                                    nuevaOrden.distritoServicio === dir.distrito
                                  : idx === 0));
                          const etiquetaTexto = dir.esPrincipal
                            ? 'Principal'
                            : dir.etiqueta?.trim() || `Dirección ${idx + 1}`;

                          return (
                            <button
                              key={`${dir.id ?? 'dir'}-${idx}`}
                              type="button"
                              onClick={() => {
                                onNuevaOrdenChange({
                                  ...nuevaOrden,
                                  direccionId: dir.id && dir.id > 0 ? dir.id : undefined,
                                  direccionServicio: dir.direccion,
                                  distritoServicio: dir.distrito,
                                  referenciaServicio: dir.referencia || '',
                                  etiquetaDireccion: undefined,
                                });
                                setMostrarOtraDireccion(false);
                                setOtraError(null);
                              }}
                              className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer min-w-0 ${
                                estaSeleccionada
                                  ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-500/15 shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
                              }`}
                            >
                              <div className="w-full flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-800 truncate">
                                  {dir.esPrincipal ? (
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-500 flex-shrink-0" />
                                  ) : (
                                    <Home className="w-3 h-3 text-sky-600 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{etiquetaTexto}</span>
                                </span>
                                {estaSeleccionada && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-bold flex-shrink-0">
                                    <Check className="w-2.5 h-2.5" />
                                    Activa
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-semibold text-slate-800 break-words leading-snug w-full">
                                {dir.direccion}
                              </p>

                              <div className="flex flex-wrap items-center gap-1.5 w-full">
                                {dir.distrito && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[10px] font-bold text-slate-600">
                                    {dir.distrito}
                                  </span>
                                )}
                                {dir.referencia && (
                                  <span className="text-[11px] text-slate-500 truncate">
                                    Ref: {dir.referencia}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Tarjeta destacada cuando se eligió una nueva dirección inline */}
                    {esCustomDireccionActiva && !mostrarOtraDireccion && (
                      <div className="p-3 rounded-xl bg-sky-50 border-2 border-sky-500 flex items-start justify-between gap-2 text-xs">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white text-[10px] font-extrabold uppercase">
                              Nueva dirección para esta orden
                            </span>
                            <span className="font-extrabold text-sky-900">
                              {nuevaOrden.etiquetaDireccion}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-800 break-words">
                            {nuevaOrden.direccionServicio}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                            <span className="font-bold">{nuevaOrden.distritoServicio}</span>
                            {nuevaOrden.referenciaServicio && (
                              <span className="text-slate-500">
                                • Ref: {nuevaOrden.referenciaServicio}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={abrirFormOtraDireccion}
                          className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline flex-shrink-0 cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    )}

                    {/* Bloque inline "+ Usar otra dirección" */}
                    {mostrarOtraDireccion && (
                      <div className="p-3.5 rounded-2xl bg-white border border-sky-200 shadow-2xs space-y-2.5 text-xs animate-in fade-in duration-150">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-sky-800 uppercase tracking-wide text-[11px]">
                            Nueva dirección para esta orden
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Se guardará en el afiliado
                          </span>
                        </div>

                        {otraError && (
                          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{otraError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Etiqueta
                            </label>
                            <input
                              type="text"
                              maxLength={60}
                              value={otraEtiqueta}
                              onChange={(e) => setOtraEtiqueta(e.target.value)}
                              placeholder="Ej. Casa 2, Oficina"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Dirección <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={otraDireccion}
                              onChange={(e) => {
                                setOtraError(null);
                                setOtraDireccion(e.target.value);
                              }}
                              placeholder="Ingresa la dirección exacta..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Departamento <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={otraDepartamento}
                              onChange={(e) => handleDepartamentoOtraChange(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                            >
                              {departamentosUbigeo.map((dep) => (
                                <option key={dep} value={dep}>
                                  {dep}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Provincia <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={otraProvincia}
                              onChange={(e) => handleProvinciaOtraChange(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                            >
                              {provinciasOtra.map((prov) => (
                                <option key={prov} value={prov}>
                                  {prov}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Distrito <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={otraDistrito}
                              onChange={(e) => {
                                setOtraError(null);
                                setOtraDistrito(e.target.value);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                            >
                              {distritosOtra.map((dist) => (
                                <option key={dist} value={dist}>
                                  {dist}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Referencia
                          </label>
                          <input
                            type="text"
                            value={otraReferencia}
                            onChange={(e) => setOtraReferencia(e.target.value)}
                            placeholder="Ej. Frente al parque, piso 2..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setMostrarOtraDireccion(false);
                              setOtraError(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAplicarOtraDireccion}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Usar esta dirección</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Técnico Asignado */}
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Técnico Asignado <span className="text-rose-500">*</span>
                  </label>
                  {tecnicoSeleccionado && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        tecnicoSeleccionado.disponible
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          tecnicoSeleccionado.disponible ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {tecnicoSeleccionado.disponible ? 'Disponible ahora' : 'En atención'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    required
                    value={nuevaOrden.tecnicoId || ''}
                    onChange={(e) =>
                      onNuevaOrdenChange({ ...nuevaOrden, tecnicoId: Number(e.target.value) || 0 })
                    }
                    className={`w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-9 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer ${
                      nuevaOrden.tecnicoId ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    <option value="" disabled>
                      Selecciona un técnico
                    </option>
                    {tecnicosActivos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombreCompleto} ({obtenerEspecialidadesTecnico(t).join(', ')}) -{' '}
                        {t.disponible ? 'Disponible' : 'En atención'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Sugerencia / Vista rápida del Técnico */}
                {nuevaOrden.tipoServicio && tecnicosCompatibles.length > 0 && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
                        <Sparkles className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>Técnicos compatibles con {nuevaOrden.tipoServicio}</span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {tecnicosCompatibles.length}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tecnicosCompatibles.map((t) => {
                        const esSeleccionado = Number(nuevaOrden.tecnicoId) === t.id;
                        const especialidadesTec = obtenerEspecialidadesTecnico(t);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              onNuevaOrdenChange({ ...nuevaOrden, tecnicoId: t.id })
                            }
                            className={`flex flex-col items-start gap-1.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer max-w-full ${
                              esSeleccionado
                                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/15 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 max-w-full">
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  t.disponible ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {t.nombreCompleto}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                                  t.disponible
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {t.disponible ? 'Disponible' : 'En atención'}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {especialidadesTec.map((esp) => {
                                const coincide =
                                  esp.trim().toLowerCase() ===
                                  (nuevaOrden.tipoServicio || '').trim().toLowerCase();
                                return (
                                  <span
                                    key={esp}
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                                      coincide
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200/70'
                                    }`}
                                  >
                                    {esp}
                                  </span>
                                );
                              })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Botón Principal Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-5 bg-[#0284c7] hover:bg-[#0369a1] active:scale-[0.99] text-white font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 min-h-[48px]"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Creando y asignando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Crear y Asignar Orden</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Columna Derecha Sticky: Ticket Resumen en Vivo + Gestión del Servicio */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-5 min-w-0">
          {/* Bloque A: Ticket de Previsualización en Vivo */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    camposCompletos === 6
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-sky-50 text-sky-600'
                  }`}
                >
                  {camposCompletos === 6 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <ClipboardList className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">
                    Resumen de Orden
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Vista previa en vivo
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border flex-shrink-0 ${
                  camposCompletos === 6
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}
              >
                {camposCompletos}/6 listos
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  camposCompletos === 6 ? 'bg-emerald-500' : 'bg-[#0284c7]'
                }`}
                style={{ width: `${Math.round((camposCompletos / 6) * 100)}%` }}
              />
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3.5 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-semibold flex-shrink-0">
                  Cuenta / Seguro
                </span>
                <span
                  className={`font-bold text-right truncate ${
                    cuentaSeleccionada ? 'text-slate-800' : 'text-slate-400 italic'
                  }`}
                >
                  {cuentaSeleccionada ? cuentaSeleccionada.nombre : 'Sin seleccionar'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-semibold flex-shrink-0">
                  Especialidad
                </span>
                <span
                  className={`font-bold text-right truncate ${
                    nuevaOrden.tipoServicio ? 'text-indigo-700' : 'text-slate-400 italic'
                  }`}
                >
                  {nuevaOrden.tipoServicio || 'Sin seleccionar'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-semibold flex-shrink-0">
                  Expediente
                </span>
                <span
                  className={`font-bold text-right break-all ${
                    esConflictoCaso || esConflictoOt
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  Caso: #{nuevaOrden.numeroCaso?.trim() || '—'} • OT: #
                  {nuevaOrden.numeroOt?.trim() || '—'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-semibold flex-shrink-0">
                  Cita Pactada
                </span>
                <span
                  className={`font-bold text-right ${
                    esHorarioPasado ? 'text-amber-700' : 'text-slate-800'
                  }`}
                >
                  {resumenFechaPactada || 'Pendiente'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-semibold flex-shrink-0">
                  Afiliado
                </span>
                <span
                  className={`font-bold text-right break-words ${
                    afiliadoSeleccionado ? 'text-slate-800' : 'text-slate-400 italic'
                  }`}
                >
                  {afiliadoSeleccionado
                    ? afiliadoSeleccionado.nombreCompleto || afiliadoSeleccionado.nombre
                    : 'Pendiente'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-semibold flex-shrink-0">
                  Dirección
                </span>
                <div
                  className={`font-bold text-right break-words ${
                    afiliadoSeleccionado ? 'text-slate-800' : 'text-slate-400 italic'
                  }`}
                >
                  {afiliadoSeleccionado ? (
                    <div className="space-y-0.5">
                      <p className="leading-snug">
                        {nuevaOrden.direccionServicio || afiliadoSeleccionado.direccion || 'Sin dirección'}
                      </p>
                      <p className="text-[11px] font-semibold text-sky-700">
                        {nuevaOrden.distritoServicio || afiliadoSeleccionado.distrito}
                        {nuevaOrden.etiquetaDireccion
                          ? ` • ${nuevaOrden.etiquetaDireccion}`
                          : ''}
                      </p>
                    </div>
                  ) : (
                    'Pendiente'
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-400 font-semibold flex-shrink-0">
                  Técnico
                </span>
                <span
                  className={`font-bold text-right break-words ${
                    tecnicoSeleccionado ? 'text-slate-800' : 'text-slate-400 italic'
                  }`}
                >
                  {tecnicoSeleccionado
                    ? `${tecnicoSeleccionado.nombreCompleto} • ${
                        tecnicoSeleccionado.disponible ? 'Disponible' : 'En atención'
                      }`
                    : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloque B: Panel "Gestión del Servicio" Rediseñado (Solo Desktop, en móvil ya está arriba) */}
          <div className="hidden lg:block space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                GESTIÓN DEL SERVICIO
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {gestionItems.map((item) => {
                const IconComponent = item.Icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`w-full bg-white rounded-2xl p-3.5 border shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-3 text-left group ${item.cardClass}`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${item.cardIconBoxClass}`}
                    >
                      <IconComponent className="w-5 h-5 stroke-[2.2]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-bold text-slate-800 transition-colors truncate ${item.cardTitleHoverClass}`}
                        >
                          {item.title}
                        </h4>
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex-shrink-0 ${item.cardBadgeClass}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-snug mt-0.5 truncate">
                        {item.subtitle}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
