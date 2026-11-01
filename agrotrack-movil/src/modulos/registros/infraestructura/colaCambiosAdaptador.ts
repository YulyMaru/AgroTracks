import type { ColaPublica } from '../../sincronizacion/aplicacion/cola';
import type { ColaCambios } from '../aplicacion/puertos';

/**
 * Adaptador de {@link ColaCambios} hacia el modulo de sincronizacion. Es el unico punto donde
 * registros toca otro modulo, y solo a traves de su API publica (aplicacion).
 */
export function crearColaCambiosAdaptador(cola: ColaPublica, envioEnCurso: () => boolean): ColaCambios {
  return {
    encolar: (entidad, accion, idRegistro, versionBase, contenido) =>
      cola.encolar(entidad, accion, idRegistro, versionBase, contenido),
    async sinEnviarDe(idRegistro) {
      return (await cola.sinEnviarDe(idRegistro)).map(o => ({
        idOperacion: o.idOperacion, accion: o.accion, versionBase: o.versionBase,
      }));
    },
    reemplazarContenido: (idOperacion, contenido) => cola.reemplazarContenido(idOperacion, contenido),
    quitar: ids => cola.quitar(ids),
    estadosSinEnviar: entidad => cola.estadosSinEnviar(entidad),
    envioEnCurso,
  };
}
