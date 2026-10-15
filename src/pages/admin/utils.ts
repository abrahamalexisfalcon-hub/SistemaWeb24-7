import type { OrdenDetalleAdmin, EstadoOrden } from '../../types';

export function formatearFechaHora(fechaRaw?: string | null): string {
  if (!fechaRaw) return 'Hoy, 10:30 AM';
  try {
    const rawLower = fechaRaw.toLowerCase();
    if (rawLower.includes('hoy') || rawLower.includes('ayer')) {
      return fechaRaw;
    }
    const fecha = new Date(fechaRaw);
    if (isNaN(fecha.getTime())) return fechaRaw;

    const ahora = new Date();
    const esHoy =
      fecha.getDate() === ahora.getDate() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear();

    const ayer = new Date();
    ayer.setDate(ahora.getDate() - 1);
    const esAyer =
      fecha.getDate() === ayer.getDate() &&
      fecha.getMonth() === ayer.getMonth() &&
      fecha.getFullYear() === ayer.getFullYear();

    const hora = fecha.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (esHoy) return `Hoy, ${hora}`;
    if (esAyer) return `Ayer, ${hora}`;

    const fechaCorta = fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    });
    return `${fechaCorta}, ${hora}`;
  } catch {
    return fechaRaw;
  }
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
