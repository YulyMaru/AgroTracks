import type { Accion, Entidad } from './modelo';

/**
 * Reglas para editar y eliminar sin conexion (docs/ModeloDeDatos.md, seccion 5). Son funciones
 * puras: no saben de SQLite ni de la cola, solo deciden.
 *
 * La version local siempre es la que tendra el servidor cuando reciba la cola.
 */

/** Un cambio de un registro que todavia no llega al servidor (pendiente o con error). */
export interface CambioSinEnviar {
  idOperacion: string;
  accion: Accion;
  versionBase: number;
}

/** No se elimina una finca, lote o cultivo con registros vigentes que dependan de el. */
export const MENSAJE_DEPENDIENTES: Partial<Record<Entidad, string>> = {
  FINCA: 'Esta finca tiene lotes, gastos o ingresos. Elimínalos primero.',
  LOTE: 'Este lote tiene cultivos, gastos o ingresos. Elimínalos primero.',
  CULTIVO: 'Este cultivo tiene cosechas, ventas, labores, gastos o ingresos. Elimínalos primero.',
};

export type PlanEdicion =
  /** Se juntan los cambios sin enviar en el primero (asi tambien se corrige uno que quedo con error). */
  | { tipo: 'FUSIONAR'; version: number; enOperacion: string; quitar: string[] }
  /** Se encola una edicion nueva con la version que tenia el registro. */
  | { tipo: 'ENCOLAR'; version: number; versionBase: number };

/**
 * Como editar un registro. Si hay cambios sin enviar y no se esta enviando la cola, se juntan en
 * el primero; si no, se encola una edicion nueva.
 */
export function planEdicion(sinEnviar: CambioSinEnviar[], versionActual: number): PlanEdicion {
  const [primero, ...resto] = sinEnviar;
  if (!primero) {
    return { tipo: 'ENCOLAR', version: versionActual + 1, versionBase: versionActual };
  }
  const version = primero.accion === 'CREAR' ? 1 : primero.versionBase + 1;
  return { tipo: 'FUSIONAR', version, enOperacion: primero.idOperacion, quitar: resto.map(c => c.idOperacion) };
}

export type PlanEliminacion =
  /** Nunca llego al servidor: se quita del celular y de la cola sin enviar nada. */
  | { tipo: 'BORRAR_DEL_CELULAR'; quitar: string[] }
  /** Borrado logico (R5) con la version que conoce el servidor. */
  | { tipo: 'ENCOLAR'; versionBase: number; quitar: string[] };

export function planEliminacion(sinEnviar: CambioSinEnviar[], versionActual: number): PlanEliminacion {
  const quitar = sinEnviar.map(c => c.idOperacion);
  const [primero] = sinEnviar;
  if (primero?.accion === 'CREAR') {
    return { tipo: 'BORRAR_DEL_CELULAR', quitar };
  }
  return { tipo: 'ENCOLAR', versionBase: primero ? primero.versionBase : versionActual, quitar };
}
