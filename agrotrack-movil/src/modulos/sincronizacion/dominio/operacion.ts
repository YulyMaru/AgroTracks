import { ErrorParaUsuario } from '../../../compartido/dominio/errores';

/**
 * Cola de cambios hechos en el celular (ADR-005), en el mismo formato que acepta
 * POST /api/v1/sincronizacion/operaciones.
 */
export type TipoRegistro = 'FINCA' | 'LOTE' | 'CULTIVO' | 'COSECHA' | 'VENTA' | 'GASTO' | 'OTRO_INGRESO' | 'LABOR';
export type Accion = 'CREAR' | 'EDITAR' | 'ELIMINAR';
export type EstadoLocal = 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR';

export const TIPOS_REGISTRO: TipoRegistro[] = ['FINCA', 'LOTE', 'CULTIVO', 'COSECHA', 'VENTA', 'GASTO',
  'OTRO_INGRESO', 'LABOR'];

export interface OperacionPendiente {
  idOperacion: string;
  entidad: TipoRegistro;
  accion: Accion;
  idRegistro: string;
  /** Version que tenia el registro en el celular (0 al crear). */
  versionBase: number;
  /** Datos del formulario; vacio al eliminar. */
  contenido: Record<string, unknown>;
  creadoEn: string;
  estado: EstadoLocal;
  reintentos: number;
  ultimoIntentoEn: string;
  mensajeError: string;
}

/** Lo que responde el servidor por cada operacion. */
export interface ResultadoOperacion {
  idOperacion: string;
  estado: 'SINCRONIZADO' | 'YA_REGISTRADO' | 'ERROR';
  versionActual: number;
  mensaje: string;
  detalles: string[];
}

export interface RespuestaSincronizacion {
  resultados: ResultadoOperacion[];
}

/** Lo que cambio en el servidor desde la ultima vez (incluye eliminados). */
export interface CambiosDelServidor {
  fechaServidor: string;
  cambios: Partial<Record<TipoRegistro, Record<string, unknown>[]>>;
}

// --- Errores al enviar --------------------------------------------------------------------------
/** La sesion vencio y no se pudo renovar. */
export class SesionExpirada extends ErrorParaUsuario {}
/** El servidor rechazo el lote completo (4xx): no sirve reintentar. */
export class RechazoDelServidor extends ErrorParaUsuario {}
/** Sin respuesta, 5xx, 408 o 429: se reintenta el mismo lote. */
export class FalloTemporal extends ErrorParaUsuario {}

/** Backoff exponencial con jitter: 1s, 2s, 4s, 8s... (con tope). */
export function tiempoEspera(intento: number, esperaInicialMs: number, esperaMaximaMs: number): number {
  const base = esperaInicialMs * 2 ** intento;
  const tope = Math.min(base, esperaMaximaMs);
  return tope / 2 + Math.random() * (tope / 2);
}

export type Desenlace =
  | 'EN_CURSO'
  | 'SIN_CONEXION'
  | 'CONEXION_INESTABLE'
  | 'SESION_REQUERIDA'
  | 'NADA_POR_SINCRONIZAR'
  | 'COMPLETADA'
  | 'DETENIDA';

export interface ResultadoSincronizacion {
  desenlace: Desenlace;
  mensaje: string;
  sincronizadas: number;
  conError: number;
}

export interface EstadoMotor {
  sincronizando: boolean;
  ultimo: ResultadoSincronizacion | null;
}
