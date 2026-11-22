import React, { useState, useMemo } from 'react';
import type {
  Afiliado,
  AfiliadoDireccion,
  CrearAfiliadoRequest,
  ActualizarAfiliadoRequest,
} from '../../../types';
import {
  X,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Plus,
  Star,
  Home,
  Trash2,
  MapPin,
} from 'lucide-react';
import {
  encontrarUbigeoPorDistrito,
  obtenerDepartamentos,
  obtenerProvincias,
  obtenerDistritos,
} from '../../../utils/ubigeoPeru';

interface DireccionFormItem {
  id?: number;
  etiqueta: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  referencia: string;
  esPrincipal: boolean;
}

const SUGERENCIAS_ETIQUETA = ['Casa Principal', 'Casa 2', 'Oficina', 'Familiar'] as const;

const crearDireccionVacia = (etiqueta: string, esPrincipal = false): DireccionFormItem => ({
  etiqueta,
  direccion: '',
  departamento: 'Lima',
  provincia: 'Lima',
  distrito: 'Villa El Salvador',
  referencia: '',
  esPrincipal,
});

interface AfiliadoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearAfiliadoRequest) => Promise<void>;
  onEditar?: (id: number, data: ActualizarAfiliadoRequest) => Promise<void>;
  afiliadoAEditar?: Afiliado | null;
  modo?: 'crear' | 'editar';
  submitting: boolean;
  error: string | null;
}

const construirDireccionesIniciales = (
  modoEfectivo: 'crear' | 'editar',
  afiliadoAEditar?: Afiliado | null
): { direcciones: DireccionFormItem[]; idxInicial: number } => {
  if (modoEfectivo === 'editar' && afiliadoAEditar) {
    if (afiliadoAEditar.direcciones && afiliadoAEditar.direcciones.length > 0) {
      const mapeadas: DireccionFormItem[] = afiliadoAEditar.direcciones.map((d, idx) => {
        const ubigeo = encontrarUbigeoPorDistrito(d.distrito);
        return {
          id: d.id,
          etiqueta:
            d.etiqueta?.trim() || (d.esPrincipal ? 'Casa Principal' : `Dirección ${idx + 1}`),
          direccion: d.direccion || '',
          departamento: ubigeo.departamento,
          provincia: ubigeo.provincia,
          distrito: ubigeo.distrito,
          referencia: d.referencia || '',
          esPrincipal: Boolean(d.esPrincipal),
        };
      });
      if (!mapeadas.some((d) => d.esPrincipal)) {
        mapeadas[0].esPrincipal = true;
      }
      const idxPrincipal = mapeadas.findIndex((d) => d.esPrincipal);
      return { direcciones: mapeadas, idxInicial: idxPrincipal >= 0 ? idxPrincipal : 0 };
    }
    const ubigeo = encontrarUbigeoPorDistrito(afiliadoAEditar.distrito);
    return {
      direcciones: [
        {
          etiqueta: 'Casa Principal',
          direccion: afiliadoAEditar.direccion || '',
          departamento: ubigeo.departamento,
          provincia: ubigeo.provincia,
          distrito: ubigeo.distrito,
          referencia: afiliadoAEditar.referencia || '',
          esPrincipal: true,
        },
      ],
      idxInicial: 0,
    };
  }
  return {
    direcciones: [crearDireccionVacia('Casa Principal', true)],
    idxInicial: 0,
  };
};

export const AfiliadoFormModal: React.FC<AfiliadoFormModalProps> = (props) => {
  if (!props.isOpen) return null;
  const modoEfectivo: 'crear' | 'editar' =
    props.modo ?? (props.afiliadoAEditar ? 'editar' : 'crear');
  const modalKey = `${modoEfectivo}-${props.afiliadoAEditar?.id ?? 'new'}`;
  return <AfiliadoFormModalContent key={modalKey} {...props} modoEfectivo={modoEfectivo} />;
};

interface AfiliadoFormModalContentProps extends AfiliadoFormModalProps {
  modoEfectivo: 'crear' | 'editar';
}

const AfiliadoFormModalContent: React.FC<AfiliadoFormModalContentProps> = ({
  onClose,
  onSubmit,
  onEditar,
  afiliadoAEditar,
  modoEfectivo,
  submitting,
  error,
}) => {
  const esEdicion = modoEfectivo === 'editar' && Boolean(afiliadoAEditar);

  const [formData, setFormData] = useState(() => ({
    nombreCompleto: esEdicion
      ? afiliadoAEditar?.nombreCompleto || afiliadoAEditar?.nombre || ''
      : '',
    dni: esEdicion ? afiliadoAEditar?.dni || '' : '',
    telefono: esEdicion ? afiliadoAEditar?.telefono || '' : '',
  }));

  const inicialDirecciones = useMemo(
    () => construirDireccionesIniciales(modoEfectivo, afiliadoAEditar),
    [modoEfectivo, afiliadoAEditar]
  );

  const [listaDirecciones, setListaDirecciones] = useState<DireccionFormItem[]>(
    () => inicialDirecciones.direcciones
  );
  const [direccionActivaIdx, setDireccionActivaIdx] = useState<number>(
    () => inicialDirecciones.idxInicial
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const departamentos = useMemo(() => obtenerDepartamentos(), []);

  const idxActivoSeguro = Math.min(
    Math.max(0, direccionActivaIdx),
    Math.max(0, listaDirecciones.length - 1)
  );
  const direccionActiva = listaDirecciones[idxActivoSeguro] || crearDireccionVacia('Casa Principal', true);

  const provinciasDisponibles = useMemo(
    () => obtenerProvincias(direccionActiva.departamento),
    [direccionActiva.departamento]
  );

  const distritosDisponibles = useMemo(
    () => obtenerDistritos(direccionActiva.departamento, direccionActiva.provincia),
    [direccionActiva.departamento, direccionActiva.provincia]
  );

  const handleChangeDatosPersonales = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalError(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const actualizarDireccionActiva = (cambios: Partial<DireccionFormItem>) => {
    setLocalError(null);
    setListaDirecciones((prev) =>
      prev.map((item, idx) => (idx === idxActivoSeguro ? { ...item, ...cambios } : item))
    );
  };

  const handleAgregarDireccion = () => {
    setLocalError(null);
    const nuevaEtiqueta = `Dirección ${listaDirecciones.length + 1}`;
    setListaDirecciones((prev) => [...prev, crearDireccionVacia(nuevaEtiqueta, false)]);
    setDireccionActivaIdx(listaDirecciones.length);
  };

  const handleMarcarPrincipal = (idxObjetivo: number) => {
    setLocalError(null);
    setListaDirecciones((prev) =>
      prev.map((item, idx) => ({
        ...item,
        esPrincipal: idx === idxObjetivo,
      }))
    );
  };

  const handleEliminarDireccion = (idxEliminar: number) => {
    if (listaDirecciones.length <= 1) return;
    setLocalError(null);
    const nuevaLista = listaDirecciones.filter((_, idx) => idx !== idxEliminar);
    if (!nuevaLista.some((d) => d.esPrincipal) && nuevaLista.length > 0) {
      nuevaLista[0] = { ...nuevaLista[0], esPrincipal: true };
    }
    setListaDirecciones(nuevaLista);
    setDireccionActivaIdx((prevIdx) => {
      if (prevIdx === idxEliminar) {
        return Math.max(0, idxEliminar - 1);
      }
      if (prevIdx > idxEliminar) {
        return prevIdx - 1;
      }
      return Math.min(prevIdx, nuevaLista.length - 1);
    });
  };

  const handleDepartamentoChange = (nuevoDep: string) => {
    const provincias = obtenerProvincias(nuevoDep);
    const primerProv = provincias[0] || '';
    const distritos = primerProv ? obtenerDistritos(nuevoDep, primerProv) : [];
    const primerDist = distritos[0] || '';
    actualizarDireccionActiva({
      departamento: nuevoDep,
      provincia: primerProv,
      distrito: primerDist,
    });
  };

  const handleProvinciaChange = (nuevaProv: string) => {
    const distritos = obtenerDistritos(direccionActiva.departamento, nuevaProv);
    actualizarDireccionActiva({
      provincia: nuevaProv,
      distrito: distritos[0] || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const nombreLimpio = formData.nombreCompleto.trim();
    if (!nombreLimpio) {
      setLocalError('El nombre completo del afiliado es obligatorio.');
      return;
    }

    for (let i = 0; i < listaDirecciones.length; i += 1) {
      const dir = listaDirecciones[i];
      if (!dir.direccion.trim() || !dir.distrito.trim()) {
        setDireccionActivaIdx(i);
        const nombreEtiqueta = dir.etiqueta.trim() || `Dirección ${i + 1}`;
        setLocalError(
          `Completa la dirección y el distrito en "${nombreEtiqueta}" antes de guardar.`
        );
        return;
      }
    }

    const idxPrincipalEncontrado = listaDirecciones.findIndex((d) => d.esPrincipal);
    const idxPrincipal = idxPrincipalEncontrado >= 0 ? idxPrincipalEncontrado : 0;

    const direccionesPayload: AfiliadoDireccion[] = listaDirecciones.map((d, idx) => ({
      ...(d.id && d.id > 0 ? { id: d.id } : {}),
      etiqueta:
        d.etiqueta.trim() || (idx === idxPrincipal ? 'Casa Principal' : `Dirección ${idx + 1}`),
      direccion: d.direccion.trim(),
      distrito: d.distrito.trim(),
      referencia: d.referencia.trim(),
      esPrincipal: idx === idxPrincipal,
    }));

    const principal = direccionesPayload[idxPrincipal];

    if (esEdicion && afiliadoAEditar && onEditar) {
      await onEditar(afiliadoAEditar.id, {
        nombreCompleto: nombreLimpio,
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim(),
        direccion: principal.direccion,
        referencia: principal.referencia || '',
        distrito: principal.distrito,
        direcciones: direccionesPayload,
      });
    } else {
      await onSubmit({
        nombreCompleto: nombreLimpio,
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim(),
        direccion: principal.direccion,
        referencia: principal.referencia || '',
        distrito: principal.distrito,
        direcciones: direccionesPayload,
      });
    }
  };

  const errorVisible = localError || error;
  const distritosConFallback =
    direccionActiva.distrito && !distritosDisponibles.includes(direccionActiva.distrito)
      ? [direccionActiva.distrito, ...distritosDisponibles]
      : distritosDisponibles;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="font-black text-base text-slate-900">
              {esEdicion ? 'Editar Afiliado' : 'Registrar Afiliado'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorVisible && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorVisible}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Nombres y Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombreCompleto"
              required
              value={formData.nombreCompleto}
              onChange={handleChangeDatosPersonales}
              placeholder="Ej. Juan Pérez Ramos"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">DNI N°</label>
              <input
                type="text"
                name="dni"
                inputMode="numeric"
                maxLength={15}
                value={formData.dni}
                onChange={handleChangeDatosPersonales}
                placeholder="Número de documento"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                inputMode="tel"
                maxLength={15}
                value={formData.telefono}
                onChange={handleChangeDatosPersonales}
                placeholder="Ingresa el celular..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug -mt-1">
            Puedes registrar la orden sin DNI ni teléfono. Estos datos podrán completarse después
            desde la orden o durante la atención del técnico.
          </p>

          {/* Sección Múltiples Direcciones */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700 uppercase tracking-wide">
                  DIRECCIONES DEL AFILIADO <span className="text-red-500">*</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                  {listaDirecciones.length}{' '}
                  {listaDirecciones.length === 1 ? 'dirección' : 'direcciones'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAgregarDireccion}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar otra dirección</span>
              </button>
            </div>

            {/* Pestañas compactas de direcciones */}
            <div className="flex flex-wrap gap-1.5">
              {listaDirecciones.map((dir, idx) => {
                const esActiva = idx === idxActivoSeguro;
                const nombreTab = dir.etiqueta.trim() || `Dirección ${idx + 1}`;
                return (
                  <button
                    key={`${dir.id ?? 'new'}-${idx}`}
                    type="button"
                    onClick={() => setDireccionActivaIdx(idx)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer max-w-full ${
                      esActiva
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/40'
                    }`}
                  >
                    {dir.esPrincipal ? (
                      <Star
                        className={`w-3 h-3 shrink-0 ${
                          esActiva ? 'fill-amber-300 text-amber-300' : 'fill-amber-400 text-amber-500'
                        }`}
                      />
                    ) : (
                      <Home
                        className={`w-3 h-3 shrink-0 ${
                          esActiva ? 'text-sky-100' : 'text-slate-400'
                        }`}
                      />
                    )}
                    <span className="truncate max-w-[140px]">{nombreTab}</span>
                    {dir.distrito && (
                      <span
                        className={`text-[10px] truncate max-w-[110px] ${
                          esActiva ? 'text-sky-100' : 'text-slate-400'
                        }`}
                      >
                        ({dir.distrito})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Editor de dirección activa */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>
                    Editando:{' '}
                    <span className="text-slate-900">
                      {direccionActiva.etiqueta.trim() || `Dirección ${idxActivoSeguro + 1}`}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {direccionActiva.esPrincipal ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      Principal
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarcarPrincipal(idxActivoSeguro)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 hover:border-amber-200 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      <Star className="w-3 h-3" />
                      <span>Marcar como Principal</span>
                    </button>
                  )}

                  {listaDirecciones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarDireccion(idxActivoSeguro)}
                      title="Eliminar esta dirección"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Etiqueta / Nombre del lugar + Sugerencias */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase">
                  Etiqueta / Nombre del lugar
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={direccionActiva.etiqueta}
                  onChange={(e) => actualizarDireccionActiva({ etiqueta: e.target.value })}
                  placeholder="Ej. Casa Principal, Casa 2, Oficina..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 transition-all"
                />
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-400 mr-0.5">
                    Sugerencias:
                  </span>
                  {SUGERENCIAS_ETIQUETA.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => actualizarDireccionActiva({ etiqueta: sug })}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        direccionActiva.etiqueta.trim() === sug
                          ? 'bg-sky-50 text-sky-700 border-sky-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-700'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={direccionActiva.direccion}
                  onChange={(e) => actualizarDireccionActiva({ direccion: e.target.value })}
                  placeholder="Ingresa la dirección exacta..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Departamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={direccionActiva.departamento}
                    onChange={(e) => handleDepartamentoChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 transition-all"
                  >
                    {departamentos.map((dep) => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Provincia <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={direccionActiva.provincia}
                    onChange={(e) => handleProvinciaChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 transition-all"
                  >
                    {provinciasDisponibles.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Distrito <span className="text-red-500">*</span>
                </label>
                <select
                  value={direccionActiva.distrito}
                  onChange={(e) => actualizarDireccionActiva({ distrito: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 transition-all"
                >
                  {distritosConFallback.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Referencia
                </label>
                <input
                  type="text"
                  value={direccionActiva.referencia}
                  onChange={(e) => actualizarDireccionActiva({ referencia: e.target.value })}
                  placeholder="Ingresa una breve referencia"
                  className="w-full bg-white text-xs rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-sky-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-bold rounded-xl mt-2 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{esEdicion ? 'Actualizar Afiliado' : 'Guardar Afiliado'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
