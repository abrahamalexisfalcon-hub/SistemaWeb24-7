import api from './client';
import type {
  OrdenResumenTecnico,
  CierreHojaServicioRequest,
  CierreHojaServicioResponse,
  PerfilTecnico
} from '../types';

export const tecnicoApi = {
  // Obtiene el perfil operativo del técnico autenticado
  getPerfil: async (): Promise<PerfilTecnico> => {
    const response = await api.get<PerfilTecnico>('/tecnico/perfil');
    return response.data;
  },

  // Actualiza la disponibilidad del técnico autenticado
  actualizarDisponibilidad: async (disponible: boolean): Promise<PerfilTecnico> => {
    const response = await api.patch<PerfilTecnico>('/tecnico/disponibilidad', { disponible });
    return response.data;
  },

  // Obtiene las órdenes asignadas al técnico (sin teléfono por regla de negocio)
  getOrdenes: async (tecnicoId?: number): Promise<OrdenResumenTecnico[]> => {
    const url = tecnicoId ? `/tecnico/ordenes/${tecnicoId}` : '/tecnico/ordenes';
    const response = await api.get<OrdenResumenTecnico[]>(url);
    return response.data;
  },

  // Obtiene solo las órdenes asignadas y activas (PENDIENTE, EN_DOMICILIO)
  getOrdenesAsignadas: async (): Promise<OrdenResumenTecnico[]> => {
    const response = await api.get<OrdenResumenTecnico[]>('/tecnico/ordenes/asignadas');
    return response.data;
  },

  // Obtiene el historial de órdenes finalizadas
  getHistorial: async (): Promise<OrdenResumenTecnico[]> => {
    const response = await api.get<OrdenResumenTecnico[]>('/tecnico/ordenes/historial');
    return response.data;
  },

  // Obtiene una orden específica asignada al técnico
  getOrdenPorId: async (ordenId: number, tecnicoId?: number): Promise<OrdenResumenTecnico | null> => {
    const url = tecnicoId ? `/tecnico/ordenes/${tecnicoId}` : '/tecnico/ordenes';
    const response = await api.get<OrdenResumenTecnico[]>(url);
    const encontrada = response.data.find((o) => o.id === ordenId);
    return encontrada || null;
  },

  // Marca llegada al domicilio del afiliado (cambia estado a EN_DOMICILIO)
  marcarLlegada: async (ordenId: number): Promise<OrdenResumenTecnico> => {
    const response = await api.patch<OrdenResumenTecnico>(`/tecnico/ordenes/${ordenId}/llegada`);
    return response.data;
  },

  // Cierra la orden con registro de hoja de servicio y consumo de materiales
  cerrarOrden: async (ordenId: number, data: CierreHojaServicioRequest): Promise<CierreHojaServicioResponse> => {
    const response = await api.post<CierreHojaServicioResponse>(`/tecnico/ordenes/${ordenId}/cerrar`, data);
    return response.data;
  },

  // Actualiza la firma digital del técnico autenticado
  actualizarFirma: async (firmaBase64: string): Promise<PerfilTecnico> => {
    const response = await api.patch<PerfilTecnico>('/tecnico/perfil/firma', { firmaBase64 });
    return response.data;
  },

  // Obtiene el detalle completo de una orden
  getDetalleOrden: async (ordenId: number): Promise<OrdenResumenTecnico> => {
    const response = await api.get<OrdenResumenTecnico>(`/tecnico/ordenes/detalle/${ordenId}`);
    return response.data;
  },
};

