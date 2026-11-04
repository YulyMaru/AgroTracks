/** 3 a 30 letras minusculas, numeros, punto o guion bajo; empieza por letra o numero (igual que el backend). */
export function nombreUsuarioValido(nombreUsuario: string): boolean {
  return /^[a-z0-9][a-z0-9._]{2,29}$/.test(nombreUsuario.trim().toLowerCase());
}

/**
 * Algo@algo.algo, sin espacios. Se revisa con indexOf y no con una expresion regular para que
 * un texto largo no pueda volver lenta la validacion (SonarCloud typescript:S8786).
 */
export function correoValido(correo: string): boolean {
  const texto = correo.trim();
  if (/\s/.test(texto)) {
    return false;
  }
  const arroba = texto.indexOf('@');
  const punto = texto.lastIndexOf('.');
  return arroba > 0 && punto > arroba + 1 && punto < texto.length - 1;
}

/** Lo que se va escribiendo: minusculas y sin espacios. */
export function limpiarNombreUsuario(texto: string): string {
  return texto.toLowerCase().replace(/\s/g, '');
}

/** Sesion del campesino: tokens del backend y a que cuenta pertenecen (ADR-011). */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
  idUsuario: string;
  nombre: string;
}
