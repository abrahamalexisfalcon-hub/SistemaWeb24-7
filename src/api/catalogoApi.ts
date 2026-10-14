import api from './client';
import type { MaterialCatalogo } from '../types';

export const catalogoApi = {
  // Lista de materiales activos para autocompletado en técnico
  getMaterialesActivos: async (): Promise<MaterialCatalogo[]> => {
    const response = await api.get<MaterialCatalogo[]>('/catalogo/materiales');
    return response.data;
  },
};
