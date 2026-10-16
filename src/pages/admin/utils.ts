import type { OrdenDetalleAdmin, EstadoOrden } from '../../types';
import { formatearFechaOrden } from '../../utils/dateFormatter';

export function formatearFechaHora(fechaRaw?: string | null): string {
  return formatearFechaOrden(fechaRaw);
}

export const getBadgeConfig = (estado: EstadoOrden) => {
  switch (estado) {
    case 'EN_DOMICILIO':
      return {
        label: 'En proceso',
        className: 'bg-[#fef3c7] text-[#b45309]',
      };
    case 'PENDIENTE':
      return {
        label: 'Pendientes',
        className: 'bg-[#e0f2fe] text-[#0369a1]',
      };
    case 'FINALIZADA':
      return {
        label: 'Finalizadas',
        className: 'bg-[#dcfce7] text-[#15803d]',
      };
    case 'CANCELADA':
      return {
        label: 'Cancelada',
        className: 'bg-slate-200 text-slate-700 font-semibold',
      };
    default:
      return {
        label: estado,
        className: 'bg-slate-100 text-slate-700',
      };
  }
};

export const MOCK_ORDENES_FIGMA: OrdenDetalleAdmin[] = [
  {
    id: 1,
    codigoOrden: 'ORD-2026-001',
    tipoServicio: 'Mantenimiento Eléctrico Preventivo',
    estado: 'EN_DOMICILIO',
    fechaAsignacion: '2026-10-14T10:30:00',
    afiliadoId: 1,
    afiliadoNombre: 'Carlos Mendoza Paredes',
    afiliadoTelefono: '987654321',
    afiliadoDireccion: 'Av. Central 120',
    afiliadoDistrito: 'Villa El Salvador',
    tecnicoId: 2,
    tecnicoNombre: 'Luis Alberto Inca',
  },
  {
    id: 2,
    codigoOrden: 'ORD-2026-002',
    tipoServicio: 'Mantenimiento Eléctrico Preventivo',
    estado: 'PENDIENTE',
    fechaAsignacion: '2026-10-14T10:30:00',
    afiliadoId: 2,
    afiliadoNombre: 'María Torres Salazar',
    afiliadoTelefono: '988555123',
    afiliadoDireccion: 'Av. Las Palmas 450',
    afiliadoDistrito: 'San Juan de Miraflores',
  },
  {
    id: 3,
    codigoOrden: 'ORD-2026-003',
    tipoServicio: 'Mantenimiento Eléctrico Preventivo',
    estado: 'FINALIZADA',
    fechaAsignacion: '2026-10-14T10:30:00',
    afiliadoId: 3,
    afiliadoNombre: 'Jorge Ramírez Valdivia',
    afiliadoTelefono: '977444321',
    afiliadoDireccion: 'Jr. Los Álamos 820',
    afiliadoDistrito: 'Villa María del Triunfo',
    tecnicoId: 7,
    tecnicoNombre: 'Falcon Chumpitaz Abraham',
  },
];
