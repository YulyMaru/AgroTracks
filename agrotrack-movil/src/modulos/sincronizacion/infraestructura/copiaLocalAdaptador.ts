import type { CasosRegistros } from '../../registros/aplicacion/casosDeUso';
import type { CopiaLocal } from '../aplicacion/puertos';

/**
 * Adaptador de {@link CopiaLocal} hacia el modulo de registros: la copia que llega del servidor
 * la guarda registros, a traves de su API publica (aplicacion).
 */
export function crearCopiaLocalAdaptador(registros: CasosRegistros): CopiaLocal {
  return {
    guardarRegistro: (tipo, registro) => registros.guardarCopia(tipo, registro),
    guardarCatalogo: parametros => registros.guardarCatalogo(parametros),
  };
}
