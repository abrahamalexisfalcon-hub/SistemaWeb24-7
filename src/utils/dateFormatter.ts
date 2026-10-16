/**
 * Formatea un timestamp ISO considerando la zona horaria de Perú (America/Lima)
 * y calcula de forma dinámica si es Hoy, Ayer o una fecha completa.
 */
export function formatearFechaOrden(fechaIsoString: string | Date | undefined | null): string {
  if (!fechaIsoString) return '--:--';

  const fecha = new Date(fechaIsoString);
  if (isNaN(fecha.getTime())) {
    // Si ya viene formateado previamente o contiene texto legible
    if (typeof fechaIsoString === 'string' && (fechaIsoString.includes('Hoy') || fechaIsoString.includes('Ayer'))) {
      return fechaIsoString;
    }
    return '--:--';
  }

  // Opciones para formatear en zona horaria de Perú
  const opcionesHora: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const horaFormateada = new Intl.DateTimeFormat('es-PE', opcionesHora).format(fecha);

  // Determinar si es Hoy o Ayer respecto a la hora actual en Perú
  const opcionesFecha: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  };

  const formateadorDia = new Intl.DateTimeFormat('es-PE', opcionesFecha);
  const fechaStr = formateadorDia.format(fecha);
  const hoyStr = formateadorDia.format(new Date());

  // Calcular Ayer
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = formateadorDia.format(ayer);

  if (fechaStr === hoyStr) {
    return `Hoy, ${horaFormateada}`;
  } else if (fechaStr === ayerStr) {
    return `Ayer, ${horaFormateada}`;
  } else {
    // Para fechas anteriores: "14 oct, 04:30 p. m."
    const opcionesCompleta: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Lima',
      day: 'numeric',
      month: 'short'
    };
    const diaMes = new Intl.DateTimeFormat('es-PE', opcionesCompleta).format(fecha);
    return `${diaMes}, ${horaFormateada}`;
  }
}

/**
 * Alias compatible con vistas administrativas
 */
export const formatearFechaHora = formatearFechaOrden;
