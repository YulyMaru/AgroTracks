import type {
  Accion,
  CambiosDelServidor,
  EstadoLocal,
  OperacionPendiente,
  RespuestaSincronizacion,
  TipoRegistro,
} from '../dominio/operacion';

/** Puerto de salida: la cola de cambios guardada en el celular. */
export interface RepositorioCola {
  encolar(operacion: Omit<OperacionPendiente, 'estado' | 'reintentos' | 'ultimoIntentoEn' | 'mensajeError'>): Promise<void>;
  sinEnviarDe(idRegistro: string): Promise<OperacionPendiente[]>;
  reemplazarContenido(idOperacion: string, contenido: object): Promise<void>;
  quitar(idsOperacion: string[]): Promise<void>;
  siguienteLote(limite: number): Promise<OperacionPendiente[]>;
  registrarIntento(idsOperacion: string[]): Promise<void>;
  marcarSincronizada(idOperacion: string): Promise<void>;
  marcarConError(idOperacion: string, mensaje: string): Promise<void>;
  reintentarErrores(): Promise<void>;
  contarPorEstado(): Promise<Record<EstadoLocal, number>>;
  recientes(limite: number): Promise<OperacionPendiente[]>;
  /** Registros que tienen cambios sin enviar (no se pisan con la copia del servidor). */
  idsConCambios(): Promise<Set<string>>;
  estadosSinEnviar(entidad: TipoRegistro): Promise<{ idRegistro: string; estado: EstadoLocal; mensaje: string }[]>;
}

/**
 * Puerto de salida: el backend. Los errores al enviar se informan con SesionExpirada,
 * RechazoDelServidor o FalloTemporal (dominio/operacion.ts).
 */
export interface ServidorSincronizacion {
  /** "La conexion es estable?": el backend responde rapido. */
  disponible(): Promise<boolean>;
  enviar(operaciones: OperacionPendiente[]): Promise<RespuestaSincronizacion>;
  cambios(desde: string | null): Promise<CambiosDelServidor>;
  parametros(desde: string | null): Promise<{ tipo: string; codigo: string; etiqueta: string; orden: number; activo: boolean }[]>;
}

/** Puerto de salida: donde se guarda la copia de lo que llego del servidor (modulo de registros). */
export interface CopiaLocal {
  guardarRegistro(tipo: TipoRegistro, registro: Record<string, unknown>): Promise<void>;
  guardarCatalogo(parametros: { tipo: string; codigo: string; etiqueta: string; orden: number; activo: boolean }[]): Promise<void>;
}

/** Puerto de salida: la red del celular. */
export interface Red {
  hayConexion(): Promise<boolean>;
  /** Avisa cada cambio de conexion; devuelve como dejar de escuchar. */
  escuchar(alCambiar: (conectado: boolean) => void): () => void;
}

/** Puerto de salida: si hay una sesion guardada (modulo de autenticacion). */
export interface SesionActiva {
  haySesion(): Promise<boolean>;
}

export type { Accion };
