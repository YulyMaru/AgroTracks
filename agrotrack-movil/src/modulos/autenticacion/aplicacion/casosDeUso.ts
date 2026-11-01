import { ErrorParaUsuario } from '../../../compartido/dominio/errores';
import type { Tokens } from '../dominio/sesion';
import type { AlmacenSesion, ApiAutenticacion, DatosDeCuenta } from './puertos';

/**
 * Casos de uso de sesion. Los datos locales pertenecen a una sola cuenta (ADR-011). Si entra otra
 * cuenta en el mismo celular:
 *  - con registros sin enviar de la cuenta anterior, NO se permite (se perderian; HU-44);
 *  - si todo ya se envio, se limpia la copia local y se descargan los datos de la nueva cuenta.
 */
export function crearCasosSesion(p: { almacen: AlmacenSesion; api: ApiAutenticacion; datos: DatosDeCuenta }) {
  async function prepararDatosDeCuenta(idUsuario: string): Promise<void> {
    const anterior = await p.datos.cuentaActual();
    if (anterior !== idUsuario && (await p.datos.hayDatosLocales())) {
      const pendientes = await p.datos.registrosSinEnviar();
      if (pendientes > 0) {
        throw new ErrorParaUsuario(
          `Este celular tiene ${pendientes} registro(s) de otra cuenta que todavía no se han enviado. `
          + 'Entra con esa cuenta y envíalos antes de usar una cuenta diferente.');
      }
      await p.datos.limpiar();
    }
    await p.datos.fijarCuenta(idUsuario);
  }

  /** Se preparan los datos ANTES de guardar la sesion. */
  async function entrar(tokens: Tokens): Promise<Tokens> {
    await prepararDatosDeCuenta(tokens.idUsuario);
    await p.almacen.guardar(tokens);
    return tokens;
  }

  return {
    iniciarSesion: async (usuarioOCorreo: string, clave: string) =>
      entrar(await p.api.iniciarSesion(usuarioOCorreo, clave)),

    registrarse: async (datos: { correo: string; nombreUsuario: string; nombre: string; clave: string }) =>
      entrar(await p.api.registrar(datos.correo, datos.nombreUsuario, datos.nombre, datos.clave)),

    async cerrarSesion(): Promise<void> {
      const tokens = await p.almacen.obtener();
      if (tokens) {
        p.api.cerrarSesion(tokens.refreshToken).catch(() => {});
      }
      await p.almacen.borrar();
    },

    /** Sesion guardada: permite abrir la app y trabajar sin internet. */
    async sesionGuardada(): Promise<Tokens | null> {
      const tokens = await p.almacen.obtener();
      // Sesiones de versiones anteriores: se anota a que cuenta pertenecen los datos locales.
      if (tokens && !(await p.datos.cuentaActual())) {
        await p.datos.fijarCuenta(tokens.idUsuario);
      }
      return tokens;
    },

    /** No se deja salir con registros sin enviar: otra cuenta no podria enviarlos (HU-44). */
    registrosSinEnviar: () => p.datos.registrosSinEnviar(),

    haySesion: async () => (await p.almacen.obtener()) !== null,
  };
}

export type CasosSesion = ReturnType<typeof crearCasosSesion>;
