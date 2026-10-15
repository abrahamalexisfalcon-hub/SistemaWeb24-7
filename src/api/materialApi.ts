import api from './client';
import type { Material, CrearMaterialRequest, ActualizarMaterialRequest } from '../types';

export const materialApi = {
  // Listar materiales activos con filtro opcional por ID o nombre de especialidad
  getMateriales: async (especialidadId?: number, especialidadNombre?: string): Promise<Material[]> => {
    const params: Record<string, any> = {};
    if (especialidadId !== undefined && especialidadId !== null) {
      params.especialidadId = especialidadId;
    }
    if (especialidadNombre) {
      params.especialidadNombre = especialidadNombre;
    }
    const response = await api.get<Material[]>('/materiales', { params });
    return response.data;
  },

  // Obtener material por id
  getMaterialById: async (id: number): Promise<Material> => {
    const response = await api.get<Material>(`/materiales/${id}`);
    return response.data;
  },

  // Métodos administrativos
  getMaterialesAdmin: async (especialidadId?: number): Promise<Material[]> => {
    const params = especialidadId ? { especialidadId } : undefined;
    const response = await api.get<Material[]>('/admin/materiales', { params });
    return response.data;
  },

  crearMaterial: async (data: CrearMaterialRequest): Promise<Material> => {
    const response = await api.post<Material>('/admin/materiales', data);
    return response.data;
  },

  actualizarMaterial: async (id: number, data: ActualizarMaterialRequest): Promise<Material> => {
    const response = await api.put<Material>(`/admin/materiales/${id}`, data);
    return response.data;
  },

  eliminarMaterial: async (id: number): Promise<{ mensaje: string }> => {
    const response = await api.delete<{ mensaje: string }>(`/admin/materiales/${id}`);
    return response.data;
  }
};
