// Corre en Node (Jest), no en el celular: necesita los tipos de Node para node:sqlite.
/// <reference types="node" />
/**
 * Dobles de las librerias nativas para las pruebas de infraestructura (ADR-020). Solo los usa
 * __tests__: la app no los importa y no llegan al celular.
 *
 *  - op-sqlite -> SQLite real de Node (node:sqlite) en memoria: corren las mismas tablas y consultas
 *    de la app. Sin SQLCipher: el cifrado se valida en el dispositivo (ADR-012, ADR-022).
 *  - react-native-keychain -> Keystore en memoria.
 *  - NetInfo -> red que la prueba prende y apaga.
 *  - axios -> servidor falso: los interceptores reales (token, renovacion, errores) corren tal cual.
 */
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// --- op-sqlite --------------------------------------------------------------------------------
const bases = new Map<string, DatabaseSync>();

export const opSqlite = {
  open({ name }: { name: string; encryptionKey?: string }) {
    let base = bases.get(name);
    if (!base) {
      base = new DatabaseSync(':memory:');
      bases.set(name, base);
    }
    const conexion = base;
    return {
      execute: async (sql: string, parametros: unknown[] = []) => ({
        rows: conexion.prepare(sql).all(...(parametros as SQLInputValue[])).map(fila => ({ ...fila })),
      }),
      delete: () => {
        conexion.close();
        bases.delete(name);
      },
      getDbPath: () => `/datos/${name}`,
    };
  },
};

// --- react-native-keychain --------------------------------------------------------------------
const llavero = new Map<string, { username: string; password: string }>();

export const keychain = {
  llavero,
  getGenericPassword: async ({ service }: { service: string }) => llavero.get(service) ?? false,
  setGenericPassword: async (username: string, password: string, { service }: { service: string }) => {
    llavero.set(service, { username, password });
    return true;
  },
  resetGenericPassword: async ({ service }: { service: string }) => llavero.delete(service),
};

// --- NetInfo ----------------------------------------------------------------------------------
export interface EstadoRed { isConnected: boolean | null; isInternetReachable?: boolean | null }

export function crearNetInfo() {
  let estado: EstadoRed = { isConnected: true, isInternetReachable: true };
  const oyentes = new Set<(e: EstadoRed) => void>();
  return {
    fetch: async () => estado,
    addEventListener: (oyente: (e: EstadoRed) => void) => {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
    /** Cambia la red y avisa a quien este escuchando. */
    cambiar(nuevo: EstadoRed) {
      estado = nuevo;
      oyentes.forEach(o => o(nuevo));
    },
    oyentes,
  };
}

/** Red compartida para jest.mock: la prueba la apaga y la prende con redFalsa.cambiar(...). */
export const redFalsa = crearNetInfo();

// --- Servidor HTTP falso ----------------------------------------------------------------------
export type Respuesta = { status: number; data?: unknown } | 'SIN_RED';

export interface Peticion {
  metodo: string;
  ruta: string;
  cuerpo: unknown;
  encabezados: Record<string, unknown>;
  params: unknown;
}

/**
 * Adaptador de axios que responde sin salir a internet. `responder` decide la respuesta de cada
 * peticion; un 4xx o 5xx se entrega como el error que daria axios.
 */
export function servidorFalso(responder: (p: Peticion) => Respuesta) {
  const peticiones: Peticion[] = [];
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const peticion: Peticion = {
      metodo: (config.method ?? 'get').toUpperCase(),
      ruta: (config.url ?? '').replace(/^https?:\/\/[^/]+/, ''),
      cuerpo: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      encabezados: { ...config.headers },
      params: config.params,
    };
    peticiones.push(peticion);
    const r = responder(peticion);
    if (r === 'SIN_RED') {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    }
    const respuesta: AxiosResponse = { data: r.data, status: r.status, statusText: '', headers: {}, config };
    if (r.status >= 400) {
      throw new AxiosError(`Request failed with status code ${r.status}`, AxiosError.ERR_BAD_RESPONSE, config, null, respuesta);
    }
    return respuesta;
  };
  return { adapter, peticiones };
}
