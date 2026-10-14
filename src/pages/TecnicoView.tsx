import React, { useState, useEffect } from 'react';
import { Navbar, Card, Modal } from '../components';
import { useAuth } from '../context/AuthContext';
import { tecnicoApi, catalogoApi } from '../api';
import type {
  OrdenResumenTecnico,
  MaterialCatalogo,
  CierreHojaServicioRequest,
  MaterialConsumido
} from '../types';
import {
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  RefreshCw,
  Navigation,
  Check,
  Star,
  FileCheck
} from 'lucide-react';

export const TecnicoView: React.FC = () => {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenResumenTecnico[]>([]);
  const [materialesCatalogo, setMaterialesCatalogo] = useState<MaterialCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Modal de Cierre de Hoja de Servicio
  const [selectedOrden, setSelectedOrden] = useState<OrdenResumenTecnico | null>(null);
  const [evaluacionAveria, setEvaluacionAveria] = useState('');
  const [detalleSolucion, setDetalleSolucion] = useState('');
  const [sugerencias, setSugerencias] = useState('');
  const [calificacion, setCalificacion] = useState(5);
  const [materialesUsados, setMaterialesUsados] = useState<
    Array<{ materialId: number | null; descripcion: string; cantidad: number; esPersonalizado: boolean }>
  >([]);
  const [submittingCierre, setSubmittingCierre] = useState(false);
  const [cierreError, setCierreError] = useState<string | null>(null);

  const fetchTecnicoData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ordenesRes, catalogoRes] = await Promise.all([
        tecnicoApi.getOrdenes(user.usuarioId),
        catalogoApi.getMaterialesActivos(),
      ]);
      setOrdenes(ordenesRes);
      setMaterialesCatalogo(catalogoRes);
    } catch (error) {
      console.error('Error cargando órdenes del técnico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTecnicoData();
  }, [user]);

  // Marcación de Llegada al Domicilio
  const handleMarcarLlegada = async (ordenId: number) => {
    setUpdatingId(ordenId);
    try {
      await tecnicoApi.marcarLlegada(ordenId);
      await fetchTecnicoData();
    } catch (error) {
      console.error('Error al marcar llegada:', error);
      alert('No se pudo registrar la llegada. Intente nuevamente.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Abrir Modal de Cierre
  const handleOpenCierreModal = (orden: OrdenResumenTecnico) => {
    setSelectedOrden(orden);
    setEvaluacionAveria('');
    setDetalleSolucion('');
    setSugerencias('');
    setCalificacion(5);
    setMaterialesUsados([]);
    setCierreError(null);
  };

  // Agregar material al reporte de consumo
  const handleAddMaterial = () => {
    setMaterialesUsados([
      ...materialesUsados,
      {
        materialId: materialesCatalogo.length > 0 ? materialesCatalogo[0].id : null,
        descripcion: '',
        cantidad: 1,
        esPersonalizado: false,
      },
    ]);
  };

  // Eliminar material
  const handleRemoveMaterial = (index: number) => {
    setMaterialesUsados(materialesUsados.filter((_, i) => i !== index));
  };

  // Enviar Cierre de Orden y Hoja de Servicio
  const handleSubmitCierre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrden) return;

    setSubmittingCierre(true);
    setCierreError(null);

    try {
      const payloadMateriales: MaterialConsumido[] = materialesUsados.map((m) => {
        if (m.esPersonalizado) {
          return {
            materialId: null,
            descripcion: m.descripcion,
            cantidad: m.cantidad,
          };
        } else {
          return {
            materialId: m.materialId,
            descripcion: null,
            cantidad: m.cantidad,
          };
        }
      });

      const cierreRequest: CierreHojaServicioRequest = {
        evaluacionAveria,
        detalleSolucion,
        sugerencias,
        calificacionAfiliado: calificacion,
        materiales: payloadMateriales,
      };

      await tecnicoApi.cerrarOrden(selectedOrden.id, cierreRequest);
      setSelectedOrden(null);
      await fetchTecnicoData();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setCierreError(axiosErr.response?.data?.message || 'Error al cerrar la hoja de servicio');
      } else {
        setCierreError('Error de conexión al enviar el cierre');
      }
    } finally {
      setSubmittingCierre(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar title="24/7 Técnico Móvil" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Cabecera Móvil y Estado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mis Asignaciones</h1>
            <p className="text-xs text-gray-500">
              Bienvenido, {user?.nombreCompleto || 'Técnico'}
            </p>
          </div>
          <button
            onClick={fetchTecnicoData}
            disabled={loading}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Resumen de Tareas */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">Pendientes</span>
            <p className="text-lg font-bold text-amber-600 mt-0.5">
              {ordenes.filter((o) => o.estado === 'PENDIENTE').length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">En Domicilio</span>
            <p className="text-lg font-bold text-blue-600 mt-0.5">
              {ordenes.filter((o) => o.estado === 'EN_DOMICILIO').length}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">Completadas</span>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">
              {ordenes.filter((o) => o.estado === 'FINALIZADA').length}
            </p>
          </div>
        </div>

        {/* Lista de Órdenes */}
        <div className="space-y-4">
          {loading && ordenes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Cargando tus órdenes asignadas...
            </div>
          ) : ordenes.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-base font-semibold text-gray-800">¡Al día!</p>
              <p className="text-xs text-gray-500 mt-1">
                No tienes asistencias pendientes asignadas en este momento.
              </p>
            </Card>
          ) : (
            ordenes.map((orden) => (
              <Card
                key={orden.id}
                className={`border-l-4 ${
                  orden.estado === 'PENDIENTE'
                    ? 'border-l-amber-500'
                    : orden.estado === 'EN_DOMICILIO'
                    ? 'border-l-blue-600'
                    : 'border-l-emerald-500'
                }`}
              >
                {/* Cabecera de la Orden */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {orden.codigoOrden}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1.5">
                      {orden.tipoServicio}
                    </h3>
                  </div>

                  {orden.estado === 'PENDIENTE' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                  {orden.estado === 'EN_DOMICILIO' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      <MapPin className="w-3 h-3" /> En Domicilio
                    </span>
                  )}
                  {orden.estado === 'FINALIZADA' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <Check className="w-3 h-3" /> Finalizada
                    </span>
                  )}
                </div>

                {/* Datos del Afiliado (ESTRICTO: Sin teléfono visible) */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-xs font-semibold text-gray-400">Afiliado:</span>
                    <span className="font-medium">{orden.nombreAfiliado}</span>
                  </div>

                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{orden.direccion}</p>
                      <p className="text-xs text-gray-500">
                        {orden.distrito} {orden.referencia ? `• Ref: ${orden.referencia}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones de Operación en Campo */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex gap-3">
                  {orden.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => handleMarcarLlegada(orden.id)}
                      disabled={updatingId === orden.id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>{updatingId === orden.id ? 'Registrando...' : 'Marcar Llegada'}</span>
                    </button>
                  )}

                  {orden.estado === 'EN_DOMICILIO' && (
                    <button
                      onClick={() => handleOpenCierreModal(orden)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Cerrar Hoja de Servicio</span>
                    </button>
                  )}

                  {orden.estado === 'FINALIZADA' && (
                    <div className="w-full text-center py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg">
                      Asistencia completada y registrada exitosamente
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Modal Cierre Hoja de Servicio */}
      <Modal
        isOpen={!!selectedOrden}
        onClose={() => setSelectedOrden(null)}
        title="Hoja de Servicio y Cierre"
        subtitle={selectedOrden ? `Orden ${selectedOrden.codigoOrden} - ${selectedOrden.tipoServicio}` : ''}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitCierre} className="space-y-4 text-sm">
          {cierreError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {cierreError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Evaluación de la Avería *
            </label>
            <textarea
              required
              rows={2}
              value={evaluacionAveria}
              onChange={(e) => setEvaluacionAveria(e.target.value)}
              placeholder="Describa el problema encontrado al llegar al domicilio..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Detalle de la Solución *
            </label>
            <textarea
              required
              rows={2}
              value={detalleSolucion}
              onChange={(e) => setDetalleSolucion(e.target.value)}
              placeholder="Detalle los trabajos técnicos realizados para solucionar la avería..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Sugerencias y Recomendaciones
            </label>
            <textarea
              rows={2}
              value={sugerencias}
              onChange={(e) => setSugerencias(e.target.value)}
              placeholder="Recomendaciones preventivas brindadas al afiliado..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Calificación del Afiliado */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Calificación de la Atención (1 al 5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setCalificacion(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= calificacion ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-semibold text-gray-600 ml-2">
                {calificacion} estrellas
              </span>
            </div>
          </div>

          {/* Consumo de Materiales (Sin visibilidad de precios por regla de negocio) */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Materiales Consumidos
              </span>
              <button
                type="button"
                onClick={handleAddMaterial}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Material
              </button>
            </div>

            {materialesUsados.length === 0 ? (
              <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-lg text-center">
                No se registraron materiales adicionales para esta atención.
              </p>
            ) : (
              <div className="space-y-2.5">
                {materialesUsados.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 font-medium text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.esPersonalizado}
                          onChange={(e) => {
                            const updated = [...materialesUsados];
                            updated[idx].esPersonalizado = e.target.checked;
                            setMaterialesUsados(updated);
                          }}
                          className="rounded text-blue-600"
                        />
                        <span>Material Imprevisto / "Otro" (No está en catálogo)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        {item.esPersonalizado ? (
                          <input
                            type="text"
                            required
                            placeholder="Descripción del material imprevisto..."
                            value={item.descripcion}
                            onChange={(e) => {
                              const updated = [...materialesUsados];
                              updated[idx].descripcion = e.target.value;
                              setMaterialesUsados(updated);
                            }}
                            className="w-full border border-gray-300 rounded p-1.5 text-xs"
                          />
                        ) : (
                          <select
                            value={item.materialId || ''}
                            onChange={(e) => {
                              const updated = [...materialesUsados];
                              updated[idx].materialId = Number(e.target.value);
                              setMaterialesUsados(updated);
                            }}
                            className="w-full border border-gray-300 rounded p-1.5 text-xs"
                          >
                            {materialesCatalogo.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.cantidad}
                          onChange={(e) => {
                            const updated = [...materialesUsados];
                            updated[idx].cantidad = Math.max(1, parseInt(e.target.value) || 1);
                            setMaterialesUsados(updated);
                          }}
                          placeholder="Cantidad"
                          className="w-full border border-gray-300 rounded p-1.5 text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedOrden(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingCierre}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {submittingCierre ? 'Finalizando...' : 'Completar y Cerrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
