import React, { useState, useEffect, useMemo } from 'react';
import type { Afiliado, CrearAfiliadoRequest, ActualizarAfiliadoRequest } from '../../../types';
import { X, RefreshCw, AlertCircle, UserCheck } from 'lucide-react';
import { UBIGEO_PERU, buscarUbicacionPorDistrito } from '../../../utils/ubigeoPeru';

interface AfiliadoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearAfiliadoRequest) => Promise<void>;
  onEditar?: (id: number, data: ActualizarAfiliadoRequest) => Promise<void>;
  afiliadoAEditar?: Afiliado | null;
  submitting: boolean;
  error: string | null;
}

export const AfiliadoFormModal: React.FC<AfiliadoFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onEditar,
  afiliadoAEditar,
  submitting,
  error,
}) => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    dni: '',
    telefono: '',
    direccion: '',
    referencia: '',
  });

  // 3 Selectores encadenados de Ubigeo
  const [departamento, setDepartamento] = useState('Lima');
  const [provincia, setProvincia] = useState('Lima');
  const [distrito, setDistrito] = useState('Villa El Salvador');

  const esEdicion = Boolean(afiliadoAEditar);

  // Provincias disponibles según el departamento seleccionado
  const provinciasDisponibles = useMemo(() => {
    const dep = UBIGEO_PERU.find((d) => d.nombre === departamento);
    return dep?.provincias || [];
  }, [departamento]);

  // Distritos disponibles según la provincia seleccionada
  const distritosDisponibles = useMemo(() => {
    const prov = provinciasDisponibles.find((p) => p.nombre === provincia);
    return prov?.distritos || [];
  }, [provinciasDisponibles, provincia]);

  // Sincronización al abrir o alternar modo edición
  useEffect(() => {
    if (isOpen) {
      if (afiliadoAEditar) {
        setFormData({
          nombreCompleto: afiliadoAEditar.nombreCompleto || afiliadoAEditar.nombre || '',
          dni: afiliadoAEditar.dni || '',
          telefono: afiliadoAEditar.telefono || '',
          direccion: afiliadoAEditar.direccion || '',
          referencia: afiliadoAEditar.referencia || '',
        });

        // Mapeo automático de ubicación a partir de afiliadoAEditar.distrito
        const ubicacion = buscarUbicacionPorDistrito(afiliadoAEditar.distrito);
        setDepartamento(ubicacion.departamento);
        setProvincia(ubicacion.provincia);
        setDistrito(ubicacion.distrito);
      } else {
        setFormData({
          nombreCompleto: '',
          dni: '',
          telefono: '',
          direccion: '',
          referencia: '',
        });
        setDepartamento('Lima');
        setProvincia('Lima');
        setDistrito('Villa El Salvador');
      }
    }
  }, [isOpen, afiliadoAEditar]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Cambiar departamento y encadenar provincia y distrito
  const handleDepartamentoChange = (nuevoDep: string) => {
    setDepartamento(nuevoDep);
    const depObj = UBIGEO_PERU.find((d) => d.nombre === nuevoDep);
    const primerProv = depObj?.provincias[0];
    if (primerProv) {
      setProvincia(primerProv.nombre);
      setDistrito(primerProv.distritos[0] || '');
    } else {
      setProvincia('');
      setDistrito('');
    }
  };

  // Cambiar provincia y encadenar distrito
  const handleProvinciaChange = (nuevaProv: string) => {
    setProvincia(nuevaProv);
    const provObj = provinciasDisponibles.find((p) => p.nombre === nuevaProv);
    if (provObj && provObj.distritos.length > 0) {
      setDistrito(provObj.distritos[0]);
    } else {
      setDistrito('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const distritoFinal = distrito.trim() || 'Villa El Salvador';

    if (esEdicion && afiliadoAEditar && onEditar) {
      await onEditar(afiliadoAEditar.id, {
        nombreCompleto: formData.nombreCompleto.trim(),
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        referencia: formData.referencia.trim(),
        distrito: distritoFinal,
      });
    } else {
      await onSubmit({
        nombreCompleto: formData.nombreCompleto.trim(),
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim(),
        direccion: formData.direccion.trim(),
        referencia: formData.referencia.trim(),
        distrito: distritoFinal,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100">
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
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Nombres y Apellidos <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombreCompleto"
              required
              value={formData.nombreCompleto}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez Ramos"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                DNI N° <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="dni"
                required
                value={formData.dni}
                onChange={handleChange}
                placeholder="70920543"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="telefono"
                required
                value={formData.telefono}
                onChange={handleChange}
                placeholder="987556321"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Dirección <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="direccion"
              required
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Av. Central 120"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          {/* Fila 1: Departamento y Provincia */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Departamento <span className="text-red-500">*</span>
              </label>
              <select
                value={departamento}
                onChange={(e) => handleDepartamentoChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              >
                {UBIGEO_PERU.map((dep) => (
                  <option key={dep.nombre} value={dep.nombre}>
                    {dep.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Provincia <span className="text-red-500">*</span>
              </label>
              <select
                value={provincia}
                onChange={(e) => handleProvinciaChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              >
                {provinciasDisponibles.map((p) => (
                  <option key={p.nombre} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Distrito */}
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Distrito <span className="text-red-500">*</span>
            </label>
            <select
              value={distrito}
              onChange={(e) => setDistrito(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
            >
              {distritosDisponibles.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Referencia Opcional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              REFERENCIA <span className="text-slate-400 font-normal lowercase">(opcional)</span>
            </label>
            <input
              type="text"
              name="referencia"
              value={formData.referencia || ''}
              onChange={handleChange}
              placeholder="Ej. Frente al parque, portón blanco, timbre 2"
              className="w-full text-sm rounded-xl border border-slate-200 px-4 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-bold rounded-xl mt-3 flex items-center justify-center gap-2 shadow-sm transition-all"
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
