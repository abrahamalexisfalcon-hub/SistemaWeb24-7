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

  const horaRaw = new Intl.DateTimeFormat('en-US', opcionesHora).format(fecha);
  const horaFormateada = horaRaw.toUpperCase();

  // Determinar si es Hoy, Mañana o Ayer respecto a la hora actual en Perú
  const opcionesFecha: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  };

  const formateadorDia = new Intl.DateTimeFormat('es-PE', opcionesFecha);
  const fechaStr = formateadorDia.format(fecha);
  const hoyStr = formateadorDia.format(new Date());

  // Calcular Mañana
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaStr = formateadorDia.format(manana);

  // Calcular Ayer
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = formateadorDia.format(ayer);

  if (fechaStr === hoyStr) {
    return `Hoy, ${horaFormateada}`;
  } else if (fechaStr === mananaStr) {
    return `Mañana, ${horaFormateada}`;
  } else if (fechaStr === ayerStr) {
    return `Ayer, ${horaFormateada}`;
  } else {
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
 * Formatea una fecha/hora (ISO o Date) a hora local de Perú (ej: "10:35 AM").
 * Si recibe una cadena ya formateada como "10:35 AM", la devuelve limpia.
 */
export function formatearHoraLocal(valor?: string | Date | null): string {
  if (!valor) {
    return new Date()
      .toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .replace(/a\.?\s*m\.?/i, 'AM')
      .replace(/p\.?\s*m\.?/i, 'PM')
      .toUpperCase();
  }

  if (typeof valor === 'string') {
    const limpio = valor.trim();
    // Si ya es una hora corta tipo "10:35 AM" o "02:15 PM"
    if (/^\d{1,2}:\d{2}\s*(AM|PM|a\.?\s*m\.?|p\.?\s*m\.?)$/i.test(limpio)) {
      return limpio
        .replace(/a\.?\s*m\.?/i, 'AM')
        .replace(/p\.?\s*m\.?/i, 'PM')
        .toUpperCase();
    }
  }

  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(fecha.getTime())) {
    return typeof valor === 'string' && valor.trim() ? valor.trim() : '--:--';
  }

  return fecha
    .toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/a\.?\s*m\.?/i, 'AM')
    .replace(/p\.?\s*m\.?/i, 'PM')
    .toUpperCase();
}

/**
 * Calcula la duración real transcurrida entre la hora de llegada y la hora de finalización (o actual).
 */
export function calcularDuracionServicio(
  inicioIso?: string | Date | null,
  finIso?: string | Date | null
): string {
  if (!inicioIso) return '1 min';

  const inicio = inicioIso instanceof Date ? inicioIso : new Date(inicioIso);
  const fin = finIso ? (finIso instanceof Date ? finIso : new Date(finIso)) : new Date();

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return '1 min';
  }

  const diffMs = Math.max(0, fin.getTime() - inicio.getTime());
  const totalMinutos = Math.max(1, Math.round(diffMs / 60000));

  if (totalMinutos < 60) {
    return `${totalMinutos} min`;
  }

  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return minutos > 0 ? `${horas} h ${minutos} min` : `${horas} h`;
}

/**
 * Alias compatible con vistas administrativas
 */
export const formatearFechaHora = formatearFechaOrden;
