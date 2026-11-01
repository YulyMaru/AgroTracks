import type { GeneradorIds } from '../../../compartido/aplicacion/puertos';
import type { Accion, TipoRegistro } from '../dominio/operacion';
import type { RepositorioCola } from './puertos';

/**
 * API publica de la cola de cambios: lo que otros modulos y las pantallas pueden hacer con ella.
 * El idOperacion es la clave de idempotencia: si se reenvia (mala senal), el backend no lo aplica
 * dos veces.
 */
export function crearCola(repositorio: RepositorioCola, ids: GeneradorIds) {
  return {
    encolar: (entidad: TipoRegistro, accion: Accion, idRegistro: string, versionBase: number, contenido: object) =>
      repositorio.encolar({
        idOperacion: ids.nuevo(), entidad, accion, idRegistro, versionBase,
        contenido: contenido as Record<string, unknown>, creadoEn: new Date().toISOString(),
      }),
    sinEnviarDe: (idRegistro: string) => repositorio.sinEnviarDe(idRegistro),
    reemplazarContenido: (idOperacion: string, contenido: object) => repositorio.reemplazarContenido(idOperacion, contenido),
    quitar: (idsOperacion: string[]) => repositorio.quitar(idsOperacion),
    estadosSinEnviar: (entidad: TipoRegistro) => repositorio.estadosSinEnviar(entidad),
    contarPorEstado: () => repositorio.contarPorEstado(),
    /** Ultimos cambios hechos en este celular con su estado de envio (HU-25). */
    recientes: () => repositorio.recientes(60),
    /** Permite al usuario reintentar manualmente las operaciones con error (HU-44, criterio 4). */
    reintentarErrores: () => repositorio.reintentarErrores(),
  };
}

export type ColaPublica = ReturnType<typeof crearCola>;
