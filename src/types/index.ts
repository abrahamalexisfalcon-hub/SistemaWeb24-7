export type RolUsuario = 'ADMINISTRADOR' | 'TECNICO';

export type EstadoOrden = 'PENDIENTE' | 'EN_DOMICILIO' | 'FINALIZADA' | 'CANCELADA';

export interface Usuario {
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
  disponible?: boolean;
  firmaUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
  disponible?: boolean;
  firmaUrl?: string | null;
}

export interface PerfilTecnico {
  id: number;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  rol: RolUsuario;
  disponible: boolean;
  ordenesCompletadasHoy?: number;
  calificacionPromedio?: number;
  firmaUrl?: string | null;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface MaterialCatalogo {
  id: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface MaterialConsumido {
  materialId?: number | null;
  descripcion?: string | null;
  cantidad: number;
}

export interface MaterialDetalleAdmin {
  id: number;
  materialNombre: string;
  esPersonalizado: boolean;
  descripcionPersonalizada?: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
}

export interface CierreHojaServicioRequest {
  evaluacionAveria: string;
  detalleSolucion: string;
  sugerencias?: string;
  calificacion?: number;
  calificacionAfiliado?: number;
  fotoInicialUrl?: string;
  fotoAntesUrl?: string;
  fotoFinalUrl?: string;
  fotoDespuesUrl?: string;
  firmaDigitalUrl?: string;
  firmaAfiliadoUrl?: string;
  materiales: MaterialConsumido[];
}

export interface OrdenResumenTecnico {
  id: number;
  codigoOrden: string;
  tipoServicio: string;
  estado: EstadoOrden;
  nombreAfiliado: string;
  direccion: string;
  referencia?: string;
  distrito: string;
  dniAfiliado?: string;
  codigoCuenta?: string;
  fechaProgramada?: string;
  horaLlegada?: string;
  tecnicoNombre?: string;
  tecnicoFirmaUrl?: string | null;
  firmaDigitalUrl?: string | null;
  firmaAfiliadoUrl?: string | null;
  evaluacionAveria?: string | null;
  detalleSolucion?: string | null;
  sugerencias?: string | null;
  calificacion?: number | null;
  fotoInicialUrl?: string | null;
  fotoFinalUrl?: string | null;
  hojaServicioId?: number | null;
  materiales?: MaterialConsumido[];
  hojaServicio?: any;
  // Notar: teléfono NUNCA se incluye para técnicos por regla de negocio
}

export interface CierreHojaServicioResponse {
  mensaje?: string;
  hojaServicioId?: number;
  ordenId?: number;
  estado?: EstadoOrden;
  firmaDigitalUrl?: string;
  firmaAfiliadoUrl?: string;
  firmaClienteUrl?: string;
  fotoInicialUrl?: string;
  fotoFinalUrl?: string;
  evaluacionAveria?: string;
  detalleSolucion?: string;
  sugerencias?: string;
  calificacion?: number;
  materiales?: MaterialConsumido[];
}

export interface HojaServicioDetalleAdmin {
  id: number;
  evaluacionAveria: string;
  detalleSolucion: string;
  sugerencias?: string;
  calificacionAfiliado?: number;
  fotoAntesUrl?: string;
  fotoDespuesUrl?: string;
  firmaDigitalUrl?: string;
  firmaAfiliadoUrl?: string;
  costoManoObra?: number;
  costoMateriales?: number;
  costoTotal?: number;
  materiales: MaterialDetalleAdmin[];
}

export interface OrdenDetalleAdmin {
  id: number;
  codigoOrden: string;
  tipoServicio: string;
  estado: EstadoOrden;
  fechaAsignacion: string;
  fechaLlegada?: string;
  fechaFinalizacion?: string;
  afiliadoId: number;
  afiliadoNombre: string;
  afiliadoTelefono: string; // Administración sí tiene acceso
  afiliadoDireccion: string;
  afiliadoDistrito: string;
  tecnicoId?: number;
  tecnicoNombre?: string;
  tecnicoFirmaUrl?: string;
  hojaServicio?: HojaServicioDetalleAdmin;
  motivoCancelacion?: string;
  fechaCancelacion?: string;
}

export interface CancelarOrdenRequest {
  motivoCancelacion: string;
  motivo?: string;
}

export interface CrearOrdenRequest {
  tipoServicio: string;
  afiliadoId: number;
  tecnicoId: number;
}

export interface Afiliado {
  id: number;
  nombreCompleto: string;
  dni: string;
  telefono: string;
  direccion: string;
  referencia?: string;
  distrito: string;
}

export interface CrearAfiliadoRequest {
  nombreCompleto: string;
  dni: string;
  telefono: string;
  direccion: string;
  referencia?: string;
  distrito: string;
}

export interface TecnicoResumen {
  id: number;
  nombreCompleto: string;
  correo: string;
}
