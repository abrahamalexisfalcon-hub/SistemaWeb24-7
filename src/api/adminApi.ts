import api from './client';
import type {
  OrdenDetalleAdmin,
  CrearOrdenRequest,
  Afiliado,
  CrearAfiliadoRequest,
  TecnicoResumen,
  MaterialCatalogo,
  EstadoOrden
} from '../types';

export const adminApi = {
  // Órdenes
  getOrdenes: async (estado?: EstadoOrden): Promise<OrdenDetalleAdmin[]> => {
    const params = estado ? { estado } : undefined;
    const response = await api.get<OrdenDetalleAdmin[]>('/admin/ordenes', { params });
    return response.data;
  },

  getOrdenDetalle: async (id: number): Promise<OrdenDetalleAdmin> => {
    const response = await api.get<OrdenDetalleAdmin>(`/admin/ordenes/${id}`);
    return response.data;
  },

  crearOrden: async (data: CrearOrdenRequest): Promise<OrdenDetalleAdmin> => {
    const response = await api.post<OrdenDetalleAdmin>('/admin/ordenes', data);
    return response.data;
  },

  cancelarOrden: async (id: number, motivoCancelacion: string): Promise<OrdenDetalleAdmin> => {
    const response = await api.patch<OrdenDetalleAdmin>(`/admin/ordenes/${id}/cancelar`, {
      motivoCancelacion,
      motivo: motivoCancelacion,
    });
    return response.data;
  },

  // Afiliados
  getAfiliados: async (): Promise<Afiliado[]> => {
    const response = await api.get<Afiliado[]>('/admin/afiliados');
    return response.data;
  },

  getAfiliadoDetalle: async (id: number): Promise<Afiliado> => {
    const response = await api.get<Afiliado>(`/admin/afiliados/${id}`);
    return response.data;
  },

  crearAfiliado: async (data: CrearAfiliadoRequest): Promise<Afiliado> => {
    const response = await api.post<Afiliado>('/admin/afiliados', data);
    return response.data;
  },

  // Técnicos para asignación
  getTecnicos: async (): Promise<TecnicoResumen[]> => {
    const response = await api.get<TecnicoResumen[]>('/admin/tecnicos');
    return response.data;
  },

  // Catálogo administrativo
  getCatalogo: async (): Promise<MaterialCatalogo[]> => {
    const response = await api.get<MaterialCatalogo[]>('/admin/catalogo/materiales');
    return response.data;
  },

  crearMaterial: async (data: { nombre: string; descripcion?: string; activo?: boolean }): Promise<MaterialCatalogo> => {
    const response = await api.post<MaterialCatalogo>('/admin/catalogo/materiales', data);
    return response.data;
  },

  toggleMaterial: async (id: number): Promise<MaterialCatalogo> => {
    const response = await api.patch<MaterialCatalogo>(`/admin/catalogo/materiales/${id}/toggle`);
    return response.data;
  },
};
