/** 3 a 30 letras minusculas, numeros, punto o guion bajo; empieza por letra o numero (igual que el backend). */
export function nombreUsuarioValido(nombreUsuario: string): boolean {
  return /^[a-z0-9][a-z0-9._]{2,29}$/.test(nombreUsuario.trim().toLowerCase());
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
