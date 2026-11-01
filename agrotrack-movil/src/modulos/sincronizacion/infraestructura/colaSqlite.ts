import { consultar, ejecutar } from '../../../compartido/infraestructura/sqlite/baseDatos';
import type { RepositorioCola } from '../aplicacion/puertos';
import type { EstadoLocal, OperacionPendiente } from '../dominio/operacion';

/** Adaptador de {@link RepositorioCola} con la tabla operaciones_pendientes. */
export const SQL_TABLAS_COLA: string[] = [
  `CREATE TABLE IF NOT EXISTS operaciones_pendientes (
     id_operacion TEXT PRIMARY KEY NOT NULL,
     entidad TEXT NOT NULL,
     accion TEXT NOT NULL,
     id_registro TEXT NOT NULL,
     version_base INTEGER NOT NULL,
     contenido TEXT NOT NULL,
     creado_en TEXT NOT NULL,
     estado TEXT NOT NULL DEFAULT 'PENDIENTE',
     reintentos INTEGER NOT NULL DEFAULT 0,
     ultimo_intento_en TEXT NOT NULL DEFAULT '',
     mensaje_error TEXT NOT NULL DEFAULT ''
   )`,
  'CREATE INDEX IF NOT EXISTS idx_operaciones_estado ON operaciones_pendientes (estado, creado_en)',
  'CREATE INDEX IF NOT EXISTS idx_operaciones_registro ON operaciones_pendientes (id_registro)',
];

interface Fila {
  id_operacion: string; entidad: string; accion: string; id_registro: string; version_base: number;
  contenido: string; creado_en: string; estado: string; reintentos: number; ultimo_intento_en: string;
  mensaje_error: string;
}

const aOperacion = (f: Fila): OperacionPendiente => ({
  idOperacion: f.id_operacion,
  entidad: f.entidad as OperacionPendiente['entidad'],
  accion: f.accion as OperacionPendiente['accion'],
  idRegistro: f.id_registro,
  versionBase: Number(f.version_base),
  contenido: JSON.parse(f.contenido),
  creadoEn: f.creado_en,
  estado: f.estado as EstadoLocal,
  reintentos: Number(f.reintentos),
  ultimoIntentoEn: f.ultimo_intento_en,
  mensajeError: f.mensaje_error,
});

const marcadores = (n: number) => Array(n).fill('?').join(',');

export const colaSqlite: RepositorioCola = {
  async encolar(o) {
    await ejecutar(
      `INSERT INTO operaciones_pendientes (id_operacion, entidad, accion, id_registro, version_base, contenido,
         creado_en, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
      [o.idOperacion, o.entidad, o.accion, o.idRegistro, o.versionBase, JSON.stringify(o.contenido), o.creadoEn]);
  },

  async sinEnviarDe(idRegistro) {
    return (await consultar<Fila>(
      `SELECT * FROM operaciones_pendientes WHERE id_registro = ? AND estado <> 'SINCRONIZADO' ORDER BY creado_en`,
      [idRegistro])).map(aOperacion);
  },

  async reemplazarContenido(idOperacion, contenido) {
    await ejecutar(
      `UPDATE operaciones_pendientes SET contenido = ?, estado = 'PENDIENTE', mensaje_error = '' WHERE id_operacion = ?`,
      [JSON.stringify(contenido), idOperacion]);
  },

  async quitar(ids) {
    if (ids.length > 0) {
      await ejecutar(`DELETE FROM operaciones_pendientes WHERE id_operacion IN (${marcadores(ids.length)})`, ids);
    }
  },

  /** Siguiente lote en orden de creacion: una finca se envia antes que sus lotes y gastos. */
  async siguienteLote(limite) {
    return (await consultar<Fila>(
      `SELECT * FROM operaciones_pendientes WHERE estado = 'PENDIENTE' ORDER BY creado_en LIMIT ?`, [limite]))
      .map(aOperacion);
  },

  async registrarIntento(ids) {
    if (ids.length > 0) {
      await ejecutar(
        `UPDATE operaciones_pendientes SET reintentos = reintentos + 1, ultimo_intento_en = ?
         WHERE id_operacion IN (${marcadores(ids.length)})`,
        [new Date().toISOString(), ...ids]);
    }
  },

  /** Solo se marca SINCRONIZADO tras la confirmacion del servidor (ADR-007). */
  async marcarSincronizada(idOperacion) {
    await ejecutar(
      `UPDATE operaciones_pendientes SET estado = 'SINCRONIZADO', mensaje_error = '' WHERE id_operacion = ?`,
      [idOperacion]);
  },

  /** Dato invalido o conflicto: queda en ERROR sin reintento, pero el registro NUNCA se borra (HU-44). */
  async marcarConError(idOperacion, mensaje) {
    await ejecutar(`UPDATE operaciones_pendientes SET estado = 'ERROR', mensaje_error = ? WHERE id_operacion = ?`,
      [mensaje, idOperacion]);
  },

  async reintentarErrores() {
    await ejecutar(`UPDATE operaciones_pendientes SET estado = 'PENDIENTE', mensaje_error = '' WHERE estado = 'ERROR'`);
  },

  async contarPorEstado() {
    const filas = await consultar<{ estado: EstadoLocal; total: number }>(
      'SELECT estado, COUNT(*) AS total FROM operaciones_pendientes GROUP BY estado');
    const conteo: Record<EstadoLocal, number> = { PENDIENTE: 0, SINCRONIZADO: 0, ERROR: 0 };
    filas.forEach(f => (conteo[f.estado] = Number(f.total)));
    return conteo;
  },

  async recientes(limite) {
    return (await consultar<Fila>('SELECT * FROM operaciones_pendientes ORDER BY creado_en DESC LIMIT ?', [limite]))
      .map(aOperacion);
  },

  async idsConCambios() {
    const filas = await consultar<{ id_registro: string }>(
      "SELECT DISTINCT id_registro FROM operaciones_pendientes WHERE estado <> 'SINCRONIZADO'");
    return new Set(filas.map(f => f.id_registro));
  },

  async estadosSinEnviar(entidad) {
    const filas = await consultar<{ id_registro: string; estado: EstadoLocal; mensaje_error: string }>(
      `SELECT id_registro, estado, mensaje_error FROM operaciones_pendientes
       WHERE entidad = ? AND estado <> 'SINCRONIZADO' ORDER BY creado_en`, [entidad]);
    return filas.map(f => ({ idRegistro: f.id_registro, estado: f.estado, mensaje: f.mensaje_error }));
  },
};
