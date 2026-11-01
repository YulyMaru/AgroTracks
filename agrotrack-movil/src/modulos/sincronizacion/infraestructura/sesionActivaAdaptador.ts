import type { CasosSesion } from '../../autenticacion/aplicacion/casosDeUso';
import type { SesionActiva } from '../aplicacion/puertos';

/** Adaptador de {@link SesionActiva} hacia el modulo de autenticacion (su API publica). */
export function crearSesionActivaAdaptador(sesion: CasosSesion): SesionActiva {
  return { haySesion: () => sesion.haySesion() };
}
