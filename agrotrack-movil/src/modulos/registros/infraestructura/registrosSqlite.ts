import { consultar, ejecutar } from '../../../compartido/infraestructura/sqlite/baseDatos';
import type { RepositorioRegistros } from '../aplicacion/puertos';
import type { Entidad, Opcion } from '../dominio/modelo';
import { aCamel, aDatos, aFila, DEFINICIONES } from './esquemaSqlite';

/** Adaptador de {@link RepositorioRegistros} con las tablas SQLite de cada registro. */
const ahora = () => new Date().toISOString();
const tabla = (entidad: Entidad) => DEFINICIONES[entidad].tabla;

type Fila = Record<string, unknown> & { id: string; version: number; eliminado: number };

function columnas(entidad: Entidad, datos: object, idFinca: string | null): Record<string, unknown> {
  return aFila(entidad, idFinca === null ? { ...datos } : { ...datos, idFinca }, idFinca !== null);
}

const DEPENDIENTES: Partial<Record<Entidad, { conteo: string; veces: number }>> = {
  FINCA: {
    conteo: `SELECT (SELECT COUNT(*) FROM lotes WHERE id_finca = ? AND eliminado = 0)
      + (SELECT COUNT(*) FROM gastos WHERE id_finca = ? AND eliminado = 0)
      + (SELECT COUNT(*) FROM otros_ingresos WHERE id_finca = ? AND eliminado = 0) AS total`,
    veces: 3,
  },
  LOTE: {
    conteo: `SELECT (SELECT COUNT(*) FROM cultivos WHERE id_lote = ? AND eliminado = 0)
      + (SELECT COUNT(*) FROM gastos WHERE nivel_asignacion = 'LOTE' AND id_asignacion = ? AND eliminado = 0)
      + (SELECT COUNT(*) FROM otros_ingresos WHERE nivel_asignacion = 'LOTE' AND id_asignacion = ? AND eliminado = 0)
      AS total`,
    veces: 3,
  },
  CULTIVO: {
    conteo: `SELECT (SELECT COUNT(*) FROM cosechas WHERE id_cultivo = ? AND eliminado = 0)
      + (SELECT COUNT(*) FROM ventas WHERE id_cultivo = ? AND eliminado = 0)
      + (SELECT COUNT(*) FROM labores WHERE id_cultivo = ? AND eliminado = 0)
      + (SELECT COUNT(*) FROM gastos WHERE nivel_asignacion = 'CULTIVO' AND id_asignacion = ? AND eliminado = 0)
      + (SELECT COUNT(*) FROM otros_ingresos WHERE nivel_asignacion = 'CULTIVO' AND id_asignacion = ? AND eliminado = 0)
      AS total`,
    veces: 5,
  },
};

const CONSULTAS: Record<Entidad, string> = {
  FINCA: 'SELECT * FROM fincas WHERE eliminado = 0 ORDER BY nombre',
  LOTE: `SELECT x.*, f.nombre AS finca FROM lotes x JOIN fincas f ON f.id = x.id_finca
    WHERE x.eliminado = 0 ORDER BY f.nombre, x.nombre`,
  CULTIVO: `SELECT x.*, l.nombre AS lote FROM cultivos x JOIN lotes l ON l.id = x.id_lote
    WHERE x.eliminado = 0 ORDER BY l.nombre, x.especie`,
  COSECHA: `SELECT x.*, c.especie, c.tipo_cultivo FROM cosechas x JOIN cultivos c ON c.id = x.id_cultivo
    WHERE x.eliminado = 0 ORDER BY x.fecha DESC, x.actualizado_en DESC`,
  VENTA: `SELECT x.*, c.especie, c.tipo_cultivo FROM ventas x JOIN cultivos c ON c.id = x.id_cultivo
    WHERE x.eliminado = 0 ORDER BY x.fecha DESC, x.actualizado_en DESC`,
  GASTO: `SELECT x.*, f.nombre AS finca FROM gastos x JOIN fincas f ON f.id = x.id_finca
    WHERE x.eliminado = 0 ORDER BY x.fecha DESC, x.actualizado_en DESC`,
  OTRO_INGRESO: `SELECT x.*, f.nombre AS finca FROM otros_ingresos x JOIN fincas f ON f.id = x.id_finca
    WHERE x.eliminado = 0 ORDER BY x.fecha DESC, x.actualizado_en DESC`,
  LABOR: `SELECT x.*, c.especie, c.tipo_cultivo FROM labores x JOIN cultivos c ON c.id = x.id_cultivo
    WHERE x.eliminado = 0 ORDER BY x.fecha DESC, x.actualizado_en DESC`,
};

export const registrosSqlite: RepositorioRegistros = {
  async buscar(entidad, id) {
    const [fila] = await consultar<Fila>(`SELECT * FROM ${tabla(entidad)} WHERE id = ?`, [id]);
    return fila ? { datos: aDatos(entidad, fila), version: Number(fila.version), eliminado: Boolean(fila.eliminado) } : null;
  },

  async insertar(entidad, id, datos, idFinca, version) {
    const fila = { id, ...columnas(entidad, datos, idFinca), version, eliminado: 0, actualizado_en: ahora() };
    const nombres = Object.keys(fila);
    await ejecutar(`INSERT INTO ${tabla(entidad)} (${nombres.join(', ')}) VALUES (${nombres.map(() => '?').join(', ')})`,
      Object.values(fila));
  },

  async actualizar(entidad, id, datos, idFinca, version) {
    const valores = columnas(entidad, datos, idFinca);
    const asignaciones = Object.keys(valores).map(c => `${c} = ?`).join(', ');
    await ejecutar(`UPDATE ${tabla(entidad)} SET ${asignaciones}, version = ?, actualizado_en = ? WHERE id = ?`,
      [...Object.values(valores), version, ahora(), id]);
  },

  async marcarEliminado(entidad, id, version) {
    await ejecutar(`UPDATE ${tabla(entidad)} SET eliminado = 1, version = ?, actualizado_en = ? WHERE id = ?`,
      [version, ahora(), id]);
  },

  async borrar(entidad, id) {
    await ejecutar(`DELETE FROM ${tabla(entidad)} WHERE id = ?`, [id]);
  },

  async guardarCopia(entidad, registro) {
    const fila: Record<string, unknown> = {
      id: registro.id,
      ...aFila(entidad, registro, true),
      version: registro.version,
      eliminado: registro.eliminado ? 1 : 0,
      actualizado_en: registro.actualizadoEn,
    };
    const nombres = Object.keys(fila);
    const actualizar = nombres.filter(c => c !== 'id').map(c => `${c} = excluded.${c}`).join(', ');
    await ejecutar(
      `INSERT INTO ${tabla(entidad)} (${nombres.join(', ')}) VALUES (${nombres.map(() => '?').join(', ')})
       ON CONFLICT(id) DO UPDATE SET ${actualizar}`,
      Object.values(fila));
  },

  async fincaDe(nivel, id) {
    const sql = nivel === 'LOTE'
      ? 'SELECT id_finca FROM lotes WHERE id = ?'
      : 'SELECT l.id_finca FROM cultivos c JOIN lotes l ON l.id = c.id_lote WHERE c.id = ?';
    const [fila] = await consultar<{ id_finca: string }>(sql, [id]);
    return fila?.id_finca ?? null;
  },

  async loteDeCultivo(idCultivo) {
    const [fila] = await consultar<{ id_lote: string }>('SELECT id_lote FROM cultivos WHERE id = ?', [idCultivo]);
    return fila?.id_lote ?? null;
  },

  async contarDependientes(entidad, id) {
    const regla = DEPENDIENTES[entidad];
    if (!regla) {
      return 0;
    }
    const [r] = await consultar<{ total: number }>(regla.conteo, Array(regla.veces).fill(id));
    return Number(r?.total ?? 0);
  },

  async resumenes(entidad) {
    return (await consultar<Record<string, unknown>>(CONSULTAS[entidad])).map(aCamel);
  },

  async contarVigentes(entidad) {
    const [r] = await consultar<{ total: number }>(`SELECT COUNT(*) AS total FROM ${tabla(entidad)} WHERE eliminado = 0`);
    return Number(r?.total ?? 0);
  },

  fincas: () => consultar<Opcion>('SELECT id AS valor, nombre AS etiqueta FROM fincas WHERE eliminado = 0 ORDER BY nombre'),

  lotes: idFinca => consultar<Opcion>(
    'SELECT id AS valor, nombre AS etiqueta FROM lotes WHERE id_finca = ? AND eliminado = 0 ORDER BY nombre', [idFinca]),

  async cultivos(idLote) {
    const filas = await consultar<Record<string, unknown>>(
      `SELECT c.id, c.tipo_cultivo, c.especie, l.nombre AS lote, f.nombre AS finca
       FROM cultivos c JOIN lotes l ON l.id = c.id_lote JOIN fincas f ON f.id = l.id_finca
       WHERE c.eliminado = 0 ${idLote ? 'AND c.id_lote = ?' : ''} ORDER BY f.nombre, l.nombre, c.especie`,
      idLote ? [idLote] : []);
    return filas.map(aCamel).map(c => ({
      id: c.id, tipoCultivo: c.tipoCultivo, especie: c.especie, lote: c.lote, finca: c.finca,
    }));
  },

  async nombre(entidad, id) {
    const [f] = await consultar<{ nombre: string }>(`SELECT nombre FROM ${tabla(entidad)} WHERE id = ?`, [id]);
    return f?.nombre ?? '';
  },

  async valoresUsados(entidad, dato) {
    const campo = DEFINICIONES[entidad].campos.find(([nombre]) => nombre === dato);
    if (!campo) {
      return [];
    }
    const columna = campo[1];
    const filas = await consultar<{ valor: string }>(
      `SELECT ${columna} AS valor FROM ${tabla(entidad)} WHERE eliminado = 0
       GROUP BY ${columna} ORDER BY MAX(actualizado_en) DESC LIMIT 30`);
    return filas.map(f => String(f.valor));
  },

  async movimientosDeDinero() {
    // El lote de un gasto o ingreso asignado a un cultivo es el lote de ese cultivo
    const asignado = (t: string) => `
       SELECT fecha, '${t === 'gastos' ? 'GASTO' : 'INGRESO'}', valor, ${t === 'gastos' ? 'categoria' : 'tipo_ingreso'},
         CASE WHEN nivel_asignacion = 'CULTIVO' THEN id_asignacion ELSE '' END,
         CASE nivel_asignacion WHEN 'LOTE' THEN id_asignacion
           WHEN 'CULTIVO' THEN COALESCE((SELECT id_lote FROM cultivos WHERE id = id_asignacion), '') ELSE '' END,
         id_finca, concepto
       FROM ${t} WHERE eliminado = 0`;
    const filas = await consultar<{
      fecha: string; tipo: 'INGRESO' | 'GASTO'; valor: number; categoria: string; id_cultivo: string; id_lote: string;
      id_finca: string; descripcion: string;
    }>(
      `SELECT v.fecha, 'INGRESO' AS tipo, v.valor_total AS valor, 'VENTA' AS categoria, v.id_cultivo,
         COALESCE(c.id_lote, '') AS id_lote, COALESCE(l.id_finca, '') AS id_finca, '' AS descripcion
       FROM ventas v LEFT JOIN cultivos c ON c.id = v.id_cultivo LEFT JOIN lotes l ON l.id = c.id_lote
       WHERE v.eliminado = 0
       UNION ALL ${asignado('otros_ingresos')}
       UNION ALL ${asignado('gastos')}`);
    return filas.map(f => ({
      fecha: f.fecha, tipo: f.tipo, valor: Number(f.valor), categoria: f.categoria, idCultivo: f.id_cultivo,
      idLote: f.id_lote, idFinca: f.id_finca, descripcion: f.descripcion,
    }));
  },

  async produccion() {
    const filas = await consultar<{ fecha: string; id_cultivo: string; cantidad: number; unidad: string }>(
      'SELECT fecha, id_cultivo, cantidad, unidad FROM cosechas WHERE eliminado = 0');
    return filas.map(f => ({ fecha: f.fecha, idCultivo: f.id_cultivo, cantidad: Number(f.cantidad), unidad: f.unidad }));
  },

  async trabajos() {
    const filas = await consultar<{
      fecha: string; id_cultivo: string; horas: number; trabajadores: number; insumos: string;
    }>('SELECT fecha, id_cultivo, horas, trabajadores, insumos FROM labores WHERE eliminado = 0');
    return filas.map(f => ({
      fecha: f.fecha, idCultivo: f.id_cultivo, horas: Number(f.horas), trabajadores: Number(f.trabajadores),
      insumos: JSON.parse(f.insumos || '[]'),
    }));
  },

  async estructura() {
    const [fincas, lotes, cultivos] = await Promise.all([
      consultar<{ id: string; nombre: string }>('SELECT id, nombre FROM fincas WHERE eliminado = 0 ORDER BY nombre'),
      consultar<{ id: string; nombre: string; id_finca: string }>(
        'SELECT id, nombre, id_finca FROM lotes WHERE eliminado = 0 ORDER BY nombre'),
      consultar<{ id: string; tipo_cultivo: string; especie: string; id_lote: string }>(
        'SELECT id, tipo_cultivo, especie, id_lote FROM cultivos WHERE eliminado = 0 ORDER BY especie'),
    ]);
    return {
      fincas,
      lotes: lotes.map(l => ({ id: l.id, nombre: l.nombre, idFinca: l.id_finca })),
      cultivos: cultivos.map(c => ({ id: c.id, tipoCultivo: c.tipo_cultivo, especie: c.especie, idLote: c.id_lote })),
    };
  },
};
