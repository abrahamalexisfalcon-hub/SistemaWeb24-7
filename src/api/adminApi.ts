import api from './client';
import type {
  OrdenDetalleAdmin,
  CrearOrdenRequest,
  Afiliado,
  CrearAfiliadoRequest,
  TecnicoResumen,
  CrearTecnicoRequest,
  ActualizarTecnicoRequest,
  MaterialCatalogo,
  EstadoOrden,
  Especialidad
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

  // Técnicos
  getTecnicos: async (soloActivos?: boolean): Promise<TecnicoResumen[]> => {
    const params = soloActivos !== undefined ? { soloActivos } : undefined;
    const response = await api.get<TecnicoResumen[]>('/admin/tecnicos', { params });
    return response.data;
  },

  crearTecnico: async (data: CrearTecnicoRequest): Promise<TecnicoResumen> => {
    const response = await api.post<TecnicoResumen>('/admin/tecnicos', data);
    return response.data;
  },

  actualizarEstadoTecnico: async (id: number, activo: boolean): Promise<TecnicoResumen> => {
    const response = await api.patch<TecnicoResumen>(`/admin/tecnicos/${id}/estado`, { activo });
    return response.data;
  },

  actualizarTecnico: async (id: number, data: ActualizarTecnicoRequest): Promise<TecnicoResumen> => {
    const response = await api.put<TecnicoResumen>(`/admin/tecnicos/${id}`, data);
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

  // Especialidades
  getEspecialidades: async (): Promise<Especialidad[]> => {
    const response = await api.get<Especialidad[]>('/especialidades');
    return response.data;
  },

  crearEspecialidad: async (nombre: string): Promise<Especialidad> => {
    const response = await api.post<Especialidad>('/admin/especialidades', { nombre });
    return response.data;
  },

  actualizarEspecialidad: async (id: number, nombre: string): Promise<Especialidad> => {
    const response = await api.put<Especialidad>(`/admin/especialidades/${id}`, { nombre });
    return response.data;
  },
};
