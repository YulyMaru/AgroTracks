import type { Tokens } from '../dominio/sesion';

/** Donde se guarda la sesion: almacenamiento seguro del sistema (Keystore), nunca SQLite (ADR-017). */
export interface AlmacenSesion {
  guardar(tokens: Tokens): Promise<void>;
  obtener(): Promise<Tokens | null>;
  borrar(): Promise<void>;
}

/** El backend de autenticacion. */
export interface ApiAutenticacion {
  registrar(correo: string, nombreUsuario: string, nombre: string, clave: string): Promise<Tokens>;
  /** Entra con el nombre de usuario o con el correo. */
  iniciarSesion(usuarioOCorreo: string, clave: string): Promise<Tokens>;
  cerrarSesion(refreshToken: string): Promise<void>;
}

/** Los datos locales del celular, que pertenecen a una sola cuenta (ADR-011). */
export interface DatosDeCuenta {
  cuentaActual(): Promise<string | null>;
  fijarCuenta(idUsuario: string): Promise<void>;
  registrosSinEnviar(): Promise<number>;
  hayDatosLocales(): Promise<boolean>;
  /** Borra la copia local y la cola (ya todo esta en el servidor). */
  limpiar(): Promise<void>;
}
