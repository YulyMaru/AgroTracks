/** Error con un mensaje pensado para mostrarse tal cual al usuario. */
export class ErrorParaUsuario extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorParaUsuario';
  }
}

/**
 * Mensaje legible de cualquier error. Los adaptadores (HTTP, SQLite...) convierten sus errores
 * tecnicos en {@link ErrorParaUsuario}; lo demas es un error de la propia app y se muestra con su
 * detalle para poder diagnosticarlo.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorParaUsuario) {
    return error.message;
  }
  const detalle = error instanceof Error ? error.message : String(error);
  return `Ocurrió un error inesperado: ${detalle}`;
}
