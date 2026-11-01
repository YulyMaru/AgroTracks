import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { ErrorParaUsuario } from '../../dominio/errores';
import { CONFIG_SINCRONIZACION, URL_BACKEND } from '../configuracion/entorno';

/** Cuerpo de error estandar del backend (ADR-024). */
export interface RespuestaError {
  codigo: string;
  mensaje: string;
  detalles: string[];
  idTraza?: string;
}

/** Tokens que necesita el cliente HTTP. Los entrega el modulo de autenticacion (src/composicion.ts). */
export interface ProveedorTokens {
  obtener(): Promise<{ accessToken: string; refreshToken: string } | null>;
  guardarRenovados(tokens: object): Promise<void>;
  borrar(): Promise<void>;
}

let proveedor: ProveedorTokens | null = null;
export function configurarTokens(p: ProveedorTokens) {
  proveedor = p;
}

export const api = axios.create({
  baseURL: URL_BACKEND,
  timeout: CONFIG_SINCRONIZACION.tiempoMaximoPeticionMs,
  headers: { 'Content-Type': 'application/json' },
});

/** Se dispara cuando la sesion no se puede renovar: la UI debe pedir iniciar sesion. */
let alExpirarSesion: () => void = () => {};
export function registrarAlExpirarSesion(funcion: () => void) {
  alExpirarSesion = funcion;
}

// Inyecta el token y un idTraza en cada peticion (ADR-011, ADR-024).
api.interceptors.request.use(async config => {
  const tokens = await proveedor?.obtener();
  if (tokens && !config.url?.startsWith('/api/v1/autenticacion')) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  config.headers['X-Trace-Id'] = uuidv4();
  return config;
});

// Ante un 401 intenta renovar el token una sola vez y repite la peticion (refresco silencioso).
let renovacionEnCurso: Promise<{ accessToken: string } | null> | null = null;

async function renovarTokens(): Promise<{ accessToken: string } | null> {
  const actuales = await proveedor?.obtener();
  if (!actuales || !proveedor) {
    return null;
  }
  try {
    const { data } = await axios.post(`${URL_BACKEND}/api/v1/autenticacion/renovacion`, {
      refreshToken: actuales.refreshToken,
    });
    await proveedor.guardarRenovados(data);
    return data;
  } catch {
    await proveedor.borrar();
    return null;
  }
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _reintentado?: boolean }) | undefined;
  if (error.response?.status !== 401 || !original || original._reintentado
      || original.url?.startsWith('/api/v1/autenticacion')) {
    throw error;
  }
  original._reintentado = true;
  renovacionEnCurso ??= renovarTokens().finally(() => {
    renovacionEnCurso = null;
  });
  const nuevos = await renovacionEnCurso;
  if (!nuevos) {
    alExpirarSesion();
    throw error;
  }
  original.headers.Authorization = `Bearer ${nuevos.accessToken}`;
  return api.request(original);
});

/** Mensaje legible de un error de la API o de red. */
export function mensajeHttp(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const cuerpo = error.response?.data as RespuestaError | undefined;
    if (cuerpo?.mensaje) {
      return cuerpo.detalles?.length ? `${cuerpo.mensaje} (${cuerpo.detalles.join('; ')})` : cuerpo.mensaje;
    }
    if (!error.response) {
      return 'No hay conexión con el servidor.';
    }
    return `El servidor respondió ${error.response.status}.`;
  }
  return error instanceof Error ? error.message : String(error);
}

/** Convierte un error de axios en uno que la app sabe mostrar. */
export function aErrorParaUsuario(error: unknown): ErrorParaUsuario {
  return error instanceof ErrorParaUsuario ? error : new ErrorParaUsuario(mensajeHttp(error));
}

/** Estado HTTP de un error de axios (undefined si no hubo respuesta). */
export function estadoHttp(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
