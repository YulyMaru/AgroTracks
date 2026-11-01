import { open, type DB } from '@op-engineering/op-sqlite';

import type { Metadatos, Transacciones } from '../../aplicacion/puertos';
import { generarClaveBaseDatos, guardarClaveBaseDatos, leerClaveBaseDatos } from './claveBaseDatos';

/**
 * Base de datos local SQLite (ADR-005, ADR-013), cifrada con SQLCipher (ADR-022): la clave vive en
 * el Keystore (ver claveBaseDatos.ts). Cada modulo registra sus tablas con
 * {@link registrarTablas} (lo hace src/composicion.ts) antes de abrirla.
 *
 * REGLA: ninguna columna admite NULL.
 */
let db: DB | null = null;

const NOMBRE = 'agrotrack-cifrada.sqlite';
/** Base sin cifrar de las versiones anteriores: se copia a la cifrada una sola vez y se borra. */
const NOMBRE_SIN_CIFRAR = 'agrotrack.sqlite';

/**
 * Sube este numero cada vez que cambie el esquema local.
 * v2: tablas alineadas con las HU. v3: actividades. v4: sin nulos. v5: modelo de datos v2
 * (editar y borrar, labores con insumos).
 */
const VERSION_ESQUEMA = 5;

/** Todas las tablas que han existido en versiones anteriores del esquema. */
const TABLAS_ANTERIORES = ['operaciones_pendientes', 'fincas', 'lotes', 'cultivos', 'transacciones', 'gastos',
  'ingresos', 'otros_ingresos', 'producciones', 'cosechas', 'ventas', 'actividades', 'tiempos_trabajo',
  'recursos_actividad', 'labores', 'parametros', 'metadatos'];

const TABLAS: string[] = [
  'CREATE TABLE IF NOT EXISTS metadatos (clave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL)',
];

/** Cada modulo agrega aqui el SQL de sus tablas. */
export function registrarTablas(sql: string[]): void {
  TABLAS.push(...sql);
}

export async function abrirBaseDatos(): Promise<DB> {
  if (db) {
    return db;
  }
  let clave = await leerClaveBaseDatos();
  if (!clave) {
    clave = generarClaveBaseDatos();
    await cifrarBaseAnterior(clave);
  }
  db = open({ name: NOMBRE, encryptionKey: clave });
  const version = await db.execute('PRAGMA user_version');
  const actual = Number((version.rows?.[0] as { user_version?: number } | undefined)?.user_version ?? 0);
  if (actual < 5) {
    // Antes del primer lanzamiento a usuarios. El modelo v2 cambio todas las tablas y el backend
    // (migracion V4) borro sus datos de prueba, asi que los datos locales no corresponden a nada
    // en el servidor: se recrea todo una sola vez.
    // Desde aqui, cada cambio debe ser una migracion que conserve los datos y la cola pendiente.
    for (const tabla of TABLAS_ANTERIORES) {
      await db.execute(`DROP TABLE IF EXISTS ${tabla}`);
    }
  }
  for (const sql of TABLAS) {
    await db.execute(sql);
  }
  await db.execute(`PRAGMA user_version = ${VERSION_ESQUEMA}`);
  return db;
}

/**
 * Primer arranque con cifrado: copia la base sin cifrar (si existia) a la cifrada con
 * sqlcipher_export, conservando los registros y la cola de cambios pendientes. El orden evita perder
 * datos si la app se cierra a mitad de camino: copiar, guardar la clave y solo al final borrar.
 */
async function cifrarBaseAnterior(clave: string): Promise<void> {
  // Restos de un intento anterior interrumpido, cifrados con una clave que no se alcanzo a guardar
  open({ name: NOMBRE }).delete();
  const anterior = open({ name: NOMBRE_SIN_CIFRAR });
  const tablas = await anterior.execute("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table'");
  if (Number((tablas.rows?.[0] as { n?: number } | undefined)?.n ?? 0) > 0) {
    const version = await anterior.execute('PRAGMA user_version');
    const numero = Number((version.rows?.[0] as { user_version?: number } | undefined)?.user_version ?? 0);
    const destino = anterior.getDbPath().replace(NOMBRE_SIN_CIFRAR, NOMBRE);
    // La clave son 64 caracteres hexadecimales generados por la app: no puede romper la comilla
    await anterior.execute(`ATTACH DATABASE ? AS cifrada KEY '${clave}'`, [destino]);
    await anterior.execute("SELECT sqlcipher_export('cifrada')");
    await anterior.execute(`PRAGMA cifrada.user_version = ${numero}`);
    await anterior.execute('DETACH DATABASE cifrada');
  }
  await guardarClaveBaseDatos(clave);
  anterior.delete();
}

export async function consultar<T>(sql: string, parametros: unknown[] = []): Promise<T[]> {
  const conexion = await abrirBaseDatos();
  const resultado = await conexion.execute(sql, parametros as never[]);
  return (resultado.rows ?? []) as T[];
}

export async function ejecutar(sql: string, parametros: unknown[] = []): Promise<void> {
  const conexion = await abrirBaseDatos();
  await conexion.execute(sql, parametros as never[]);
}

/** Adaptador de {@link Transacciones} con BEGIN / COMMIT / ROLLBACK. */
export const transaccionesSqlite: Transacciones = {
  async ejecutar(trabajo) {
    const conexion = await abrirBaseDatos();
    await conexion.execute('BEGIN');
    try {
      await trabajo();
      await conexion.execute('COMMIT');
    } catch (e) {
      await conexion.execute('ROLLBACK');
      throw e;
    }
  },
};

/** Adaptador de {@link Metadatos} sobre la tabla metadatos. */
export const metadatosSqlite: Metadatos = {
  async leer(clave) {
    const filas = await consultar<{ valor: string }>('SELECT valor FROM metadatos WHERE clave = ?', [clave]);
    return filas[0]?.valor ?? null;
  },
  async guardar(clave, valor) {
    await ejecutar(
      'INSERT INTO metadatos (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor',
      [clave, valor]);
  },
  async borrar(clave) {
    await ejecutar('DELETE FROM metadatos WHERE clave = ?', [clave]);
  },
};
