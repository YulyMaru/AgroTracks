import { consultar, ejecutar, metadatosSqlite } from '../../../compartido/infraestructura/sqlite/baseDatos';
import type { DatosDeCuenta } from '../aplicacion/puertos';

/**
 * Adaptador: la cuenta duena de los datos se anota en metadatos; limpiar borra las tablas que se
 * le indican (las de los registros y la cola, src/composicion.ts).
 */
export function crearDatosCuentaSqlite(tablasDeDatos: string[]): DatosDeCuenta {
  async function registrosSinEnviar(): Promise<number> {
    const [fila] = await consultar<{ total: number }>(
      "SELECT COUNT(*) AS total FROM operaciones_pendientes WHERE estado <> 'SINCRONIZADO'");
    return Number(fila?.total ?? 0);
  }

  return {
    cuentaActual: () => metadatosSqlite.leer('id_usuario'),
    fijarCuenta: idUsuario => metadatosSqlite.guardar('id_usuario', idUsuario),
    registrosSinEnviar,
    async hayDatosLocales() {
      const [fila] = await consultar<{ total: number }>(
        'SELECT (SELECT COUNT(*) FROM fincas) + (SELECT COUNT(*) FROM operaciones_pendientes) AS total');
      return Number(fila?.total ?? 0) > 0;
    },
    async limpiar() {
      for (const tabla of tablasDeDatos) {
        await ejecutar(`DELETE FROM ${tabla}`);
      }
      await metadatosSqlite.borrar('ultima_sincronizacion');
    },
  };
}
