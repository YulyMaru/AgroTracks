import * as Keychain from 'react-native-keychain';

/**
 * Clave de cifrado de la base local (ADR-022): 32 bytes aleatorios, generados en el primer arranque
 * y guardados en el Keystore de Android. Nunca se escribe en el codigo ni en SQLite.
 */
const SERVICIO = 'agrotrack.base-datos';

/** Lo define react-native-get-random-values (index.js) con el generador seguro de Android. */
declare const crypto: { getRandomValues<T extends ArrayBufferView>(arreglo: T): T };

export async function leerClaveBaseDatos(): Promise<string | null> {
  const guardada = await Keychain.getGenericPassword({ service: SERVICIO });
  return guardada ? guardada.password : null;
}

export async function guardarClaveBaseDatos(clave: string): Promise<void> {
  await Keychain.setGenericPassword('base-datos', clave, { service: SERVICIO });
}

/** 64 caracteres hexadecimales: no contienen comillas, se pueden usar en ATTACH ... KEY. */
export function generarClaveBaseDatos(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
