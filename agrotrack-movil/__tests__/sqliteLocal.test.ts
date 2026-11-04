/**
 * Pruebas de integracion de la base local (ADR-005, ADR-013, ADR-020): las tablas y consultas reales
 * de los adaptadores SQLite, ejecutadas en el SQLite de Node (pruebas/dobles.ts).
 */
import {
  abrirBaseDatos,
  ejecutar,
  metadatosSqlite,
  registrarTablas,
  transaccionesSqlite,
} from '../src/compartido/infraestructura/sqlite/baseDatos';
import { crearDatosCuentaSqlite } from '../src/modulos/autenticacion/infraestructura/datosCuentaSqlite';
import { catalogoSqlite } from '../src/modulos/registros/infraestructura/catalogoSqlite';
import { SQL_TABLAS_REGISTROS, TABLAS_REGISTROS } from '../src/modulos/registros/infraestructura/esquemaSqlite';
import { registrosSqlite as repo } from '../src/modulos/registros/infraestructura/registrosSqlite';
import { colaSqlite as cola, SQL_TABLAS_COLA } from '../src/modulos/sincronizacion/infraestructura/colaSqlite';
import type { OperacionPendiente } from '../src/modulos/sincronizacion/dominio/operacion';
import { keychain } from '../pruebas/dobles';

jest.mock('@op-engineering/op-sqlite', () => require('../pruebas/dobles').opSqlite);
jest.mock('react-native-keychain', () => require('../pruebas/dobles').keychain);

registrarTablas([...SQL_TABLAS_COLA, ...SQL_TABLAS_REGISTROS]);
const TABLAS = ['operaciones_pendientes', ...TABLAS_REGISTROS, 'metadatos'];

beforeEach(async () => {
  await abrirBaseDatos();
  for (const tabla of TABLAS) {
    await ejecutar(`DELETE FROM ${tabla}`);
  }
});

describe('base de datos local', () => {
  test('el primer arranque genera la clave de cifrado y la guarda en el Keystore (ADR-022)', async () => {
    const guardada = await keychain.getGenericPassword({ service: 'agrotrack.base-datos' });
    expect(guardada && guardada.password).toMatch(/^[0-9a-f]{64}$/);
    expect(await abrirBaseDatos()).toBe(await abrirBaseDatos());
    const [version] = await (await abrirBaseDatos()).execute('PRAGMA user_version').then(r => r.rows);
    expect(version).toEqual({ user_version: 5 });
  });

  test('metadatos: guardar, sobrescribir y borrar', async () => {
    expect(await metadatosSqlite.leer('ultima_sincronizacion')).toBeNull();
    await metadatosSqlite.guardar('ultima_sincronizacion', 'a');
    await metadatosSqlite.guardar('ultima_sincronizacion', 'b');
    expect(await metadatosSqlite.leer('ultima_sincronizacion')).toBe('b');
    await metadatosSqlite.borrar('ultima_sincronizacion');
    expect(await metadatosSqlite.leer('ultima_sincronizacion')).toBeNull();
  });

  test('una transaccion que falla no deja nada a medias (el registro y su cambio van juntos)', async () => {
    await expect(transaccionesSqlite.ejecutar(async () => {
      await repo.insertar('FINCA', 'f1', { nombre: 'La Esperanza', municipio: 'Rionegro', vereda: 'El Tablazo' }, null, 1);
      throw new Error('se cerro la app');
    })).rejects.toThrow('se cerro la app');
    expect(await repo.buscar('FINCA', 'f1')).toBeNull();

    await transaccionesSqlite.ejecutar(async () => {
      await repo.insertar('FINCA', 'f1', { nombre: 'La Esperanza', municipio: 'Rionegro', vereda: 'El Tablazo' }, null, 1);
    });
    expect(await repo.buscar('FINCA', 'f1')).not.toBeNull();
  });

  test('ninguna columna admite vacios: un dato faltante no se guarda', async () => {
    await expect(repo.insertar('FINCA', 'f1', { nombre: 'Sin municipio' }, null, 1)).rejects.toThrow();
  });
});

/** Finca f1 con el lote l1 y el cultivo de cafe c1. */
async function estructura() {
  await repo.insertar('FINCA', 'f1', { nombre: 'La Esperanza', municipio: 'Rionegro', vereda: 'El Tablazo' }, null, 1);
  await repo.insertar('LOTE', 'l1', { idFinca: 'f1', nombre: 'Lote alto', area: 2.5, unidadArea: 'HECTAREA' }, null, 1);
  await repo.insertar('CULTIVO', 'c1', { idLote: 'l1', tipoCultivo: 'CAFE', especie: 'Castillo', fechaSiembra: '2025-03-01' }, null, 1);
}

describe('registros en SQLite', () => {
  test('cada tipo de dato vuelve igual: texto, decimales, enteros y la lista de insumos', async () => {
    await estructura();
    const labor = {
      idCultivo: 'c1', tipoLabor: 'FERTILIZACION', fecha: '2026-10-01', descripcion: 'Abonada', horas: 4.5, trabajadores: 2,
      insumos: [{ tipoInsumo: 'ABONO', cantidad: 2, unidad: 'BULTO' }],
    };
    await repo.insertar('LABOR', 'x1', labor, null, 1);
    expect(await repo.buscar('LABOR', 'x1')).toEqual({ datos: labor, version: 1, eliminado: false });
    expect((await repo.buscar('LOTE', 'l1'))?.datos.area).toBe(2.5);
    expect(await repo.buscar('LOTE', 'no-existe')).toBeNull();
  });

  test('actualizar, marcar eliminado y borrar', async () => {
    await estructura();
    await repo.actualizar('FINCA', 'f1', { nombre: 'La Esperanza 2', municipio: 'Rionegro', vereda: 'Cabeceras' }, null, 2);
    expect(await repo.buscar('FINCA', 'f1')).toMatchObject({ datos: { nombre: 'La Esperanza 2' }, version: 2 });
    await repo.marcarEliminado('CULTIVO', 'c1', 2);
    expect(await repo.buscar('CULTIVO', 'c1')).toMatchObject({ eliminado: true, version: 2 });
    expect(await repo.contarVigentes('CULTIVO')).toBe(0);
    await repo.borrar('CULTIVO', 'c1');
    expect(await repo.buscar('CULTIVO', 'c1')).toBeNull();
  });

  test('un gasto guarda la finca calculada y la copia del servidor se inserta o reemplaza', async () => {
    await estructura();
    const gasto = { fecha: '2026-10-05', categoria: 'MANO_DE_OBRA', concepto: 'Desyerba', valor: 300000, nivelAsignacion: 'CULTIVO', idAsignacion: 'c1' };
    await repo.insertar('GASTO', 'g1', gasto, 'f1', 1);
    await repo.actualizar('GASTO', 'g1', { ...gasto, valor: 350000 }, 'f1', 2);
    expect((await repo.resumenes('GASTO'))[0]).toMatchObject({ id: 'g1', valor: '350000', idFinca: 'f1', finca: 'La Esperanza' });

    const copia = { id: 'f9', nombre: 'Del servidor', municipio: 'Marinilla', vereda: 'X', version: 3, eliminado: false, actualizadoEn: '2026-10-01' };
    await repo.guardarCopia('FINCA', copia);
    await repo.guardarCopia('FINCA', { ...copia, nombre: 'Renombrada', version: 4, eliminado: true });
    expect(await repo.buscar('FINCA', 'f9')).toMatchObject({ datos: { nombre: 'Renombrada' }, version: 4, eliminado: true });
  });

  test('a que finca y lote pertenece cada cosa', async () => {
    await estructura();
    expect(await repo.fincaDe('LOTE', 'l1')).toBe('f1');
    expect(await repo.fincaDe('CULTIVO', 'c1')).toBe('f1');
    expect(await repo.fincaDe('LOTE', 'nada')).toBeNull();
    expect(await repo.loteDeCultivo('c1')).toBe('l1');
    expect(await repo.loteDeCultivo('nada')).toBeNull();
  });

  test('cuenta lo que depende de una finca, un lote o un cultivo', async () => {
    await estructura();
    await repo.insertar('COSECHA', 'k1', { idCultivo: 'c1', fecha: '2026-10-03', cantidad: 120, unidad: 'KILOGRAMO' }, null, 1);
    await repo.insertar('GASTO', 'g1', { fecha: '2026-10-05', categoria: 'OTROS', concepto: 'x', valor: 1, nivelAsignacion: 'LOTE', idAsignacion: 'l1' }, 'f1', 1);
    expect(await repo.contarDependientes('FINCA', 'f1')).toBe(2);
    expect(await repo.contarDependientes('LOTE', 'l1')).toBe(2);
    expect(await repo.contarDependientes('CULTIVO', 'c1')).toBe(1);
    expect(await repo.contarDependientes('COSECHA', 'k1')).toBe(0);
  });

  test('listas con el nombre de su finca, lote o cultivo', async () => {
    await estructura();
    await repo.insertar('COSECHA', 'k1', { idCultivo: 'c1', fecha: '2026-10-03', cantidad: 120, unidad: 'KILOGRAMO' }, null, 1);
    await repo.insertar('VENTA', 'v1', { idCultivo: 'c1', fecha: '2026-10-04', cantidad: 100, unidad: 'KILOGRAMO', valorTotal: 1200000 }, null, 1);
    await repo.insertar('OTRO_INGRESO', 'o1', { fecha: '2026-10-06', tipoIngreso: 'SUBSIDIO', concepto: 'Apoyo', valor: 50000, nivelAsignacion: 'FINCA', idAsignacion: 'f1' }, 'f1', 1);
    await repo.insertar('LABOR', 'x1', { idCultivo: 'c1', tipoLabor: 'PODA', fecha: '2026-10-07', descripcion: '', horas: 8, trabajadores: 1, insumos: [] }, null, 1);
    expect((await repo.resumenes('FINCA'))[0]).toMatchObject({ id: 'f1', nombre: 'La Esperanza' });
    expect((await repo.resumenes('LOTE'))[0]).toMatchObject({ idFinca: 'f1', finca: 'La Esperanza', unidadArea: 'HECTAREA' });
    expect((await repo.resumenes('CULTIVO'))[0]).toMatchObject({ lote: 'Lote alto', tipoCultivo: 'CAFE' });
    for (const entidad of ['COSECHA', 'VENTA', 'LABOR'] as const) {
      expect((await repo.resumenes(entidad))[0]).toMatchObject({ especie: 'Castillo', tipoCultivo: 'CAFE' });
    }
    expect((await repo.resumenes('OTRO_INGRESO'))[0]).toMatchObject({ finca: 'La Esperanza', tipoIngreso: 'SUBSIDIO' });
  });

  test('opciones para los formularios y sugerencias de lo ya escrito', async () => {
    await estructura();
    expect(await repo.fincas()).toEqual([{ valor: 'f1', etiqueta: 'La Esperanza' }]);
    expect(await repo.lotes('f1')).toEqual([{ valor: 'l1', etiqueta: 'Lote alto' }]);
    const cafe = { id: 'c1', tipoCultivo: 'CAFE', especie: 'Castillo', lote: 'Lote alto', finca: 'La Esperanza' };
    expect(await repo.cultivos()).toEqual([cafe]);
    expect(await repo.cultivos('l1')).toEqual([cafe]);
    expect(await repo.cultivos('otro')).toEqual([]);
    expect(await repo.nombre('LOTE', 'l1')).toBe('Lote alto');
    expect(await repo.nombre('FINCA', 'nada')).toBe('');
    expect(await repo.valoresUsados('FINCA', 'municipio')).toEqual(['Rionegro']);
    expect(await repo.valoresUsados('FINCA', 'noExiste')).toEqual([]);
  });

  test('datos para el analisis: dinero, cosechas, labores y estructura', async () => {
    await estructura();
    await repo.insertar('VENTA', 'v1', { idCultivo: 'c1', fecha: '2026-10-04', cantidad: 100, unidad: 'KILOGRAMO', valorTotal: 1200000 }, null, 1);
    await repo.insertar('GASTO', 'g1', { fecha: '2026-10-05', categoria: 'MANO_DE_OBRA', concepto: 'Desyerba', valor: 300000, nivelAsignacion: 'CULTIVO', idAsignacion: 'c1' }, 'f1', 1);
    await repo.insertar('OTRO_INGRESO', 'o1', { fecha: '2026-10-06', tipoIngreso: 'SUBSIDIO', concepto: 'Apoyo', valor: 50000, nivelAsignacion: 'FINCA', idAsignacion: 'f1' }, 'f1', 1);
    await repo.insertar('COSECHA', 'k1', { idCultivo: 'c1', fecha: '2026-10-03', cantidad: 120, unidad: 'KILOGRAMO' }, null, 1);
    await repo.insertar('LABOR', 'x1', { idCultivo: 'c1', tipoLabor: 'PODA', fecha: '2026-10-07', descripcion: '', horas: 8, trabajadores: 2, insumos: [{ tipoInsumo: 'ABONO', cantidad: 1, unidad: 'BULTO' }] }, null, 1);

    const dinero = await repo.movimientosDeDinero();
    expect(dinero).toEqual(expect.arrayContaining([
      { fecha: '2026-10-04', tipo: 'INGRESO', valor: 1200000, categoria: 'VENTA', idCultivo: 'c1', idLote: 'l1', idFinca: 'f1', descripcion: '' },
      { fecha: '2026-10-05', tipo: 'GASTO', valor: 300000, categoria: 'MANO_DE_OBRA', idCultivo: 'c1', idLote: 'l1', idFinca: 'f1', descripcion: 'Desyerba' },
      { fecha: '2026-10-06', tipo: 'INGRESO', valor: 50000, categoria: 'SUBSIDIO', idCultivo: '', idLote: '', idFinca: 'f1', descripcion: 'Apoyo' },
    ]));
    expect(dinero).toHaveLength(3);
    expect(await repo.produccion()).toEqual([{ fecha: '2026-10-03', idCultivo: 'c1', cantidad: 120, unidad: 'KILOGRAMO' }]);
    expect(await repo.trabajos()).toEqual([
      { fecha: '2026-10-07', idCultivo: 'c1', horas: 8, trabajadores: 2, insumos: [{ tipoInsumo: 'ABONO', cantidad: 1, unidad: 'BULTO' }] },
    ]);
    expect(await repo.estructura()).toEqual({
      fincas: [{ id: 'f1', nombre: 'La Esperanza' }],
      lotes: [{ id: 'l1', nombre: 'Lote alto', idFinca: 'f1' }],
      cultivos: [{ id: 'c1', tipoCultivo: 'CAFE', especie: 'Castillo', idLote: 'l1' }],
    });
  });
});

const op = (n: number, extra: Partial<OperacionPendiente> = {}) => ({
  idOperacion: `op-${n}`, entidad: 'FINCA' as const, accion: 'CREAR' as const, idRegistro: `f${n}`, versionBase: 0,
  contenido: { nombre: `Finca ${n}` }, creadoEn: `2026-10-0${n}T10:00:00Z`, ...extra,
});

describe('cola de cambios en SQLite (ADR-005, ADR-007)', () => {
  test('entrega las pendientes por lotes en el orden en que se crearon', async () => {
    await cola.encolar(op(3));
    await cola.encolar(op(1));
    await cola.encolar(op(2));
    expect((await cola.siguienteLote(2)).map(o => o.idOperacion)).toEqual(['op-1', 'op-2']);
    expect((await cola.siguienteLote(10))[0]).toMatchObject({ estado: 'PENDIENTE', reintentos: 0, contenido: { nombre: 'Finca 1' } });
  });

  test('registra intentos y solo marca SINCRONIZADO tras la confirmacion', async () => {
    await cola.encolar(op(1));
    await cola.encolar(op(2));
    await cola.registrarIntento(['op-1', 'op-2']);
    await cola.registrarIntento([]);
    await cola.marcarSincronizada('op-1');
    await cola.marcarConError('op-2', 'Dato invalido.');
    expect(await cola.contarPorEstado()).toEqual({ PENDIENTE: 0, SINCRONIZADO: 1, ERROR: 1 });
    const [conError] = await cola.sinEnviarDe('f2');
    expect(conError).toMatchObject({ estado: 'ERROR', reintentos: 1, mensajeError: 'Dato invalido.' });
    expect(conError.ultimoIntentoEn).not.toBe('');
    expect(await cola.idsConCambios()).toEqual(new Set(['f2']));
    expect(await cola.estadosSinEnviar('FINCA')).toEqual([{ idRegistro: 'f2', estado: 'ERROR', mensaje: 'Dato invalido.' }]);
  });

  test('reintentar errores y corregir el contenido los vuelve PENDIENTE', async () => {
    await cola.encolar(op(1));
    await cola.encolar(op(2));
    await cola.marcarConError('op-1', 'x');
    await cola.marcarConError('op-2', 'y');
    await cola.reemplazarContenido('op-1', { nombre: 'Corregida' });
    expect((await cola.sinEnviarDe('f1'))[0]).toMatchObject({ estado: 'PENDIENTE', mensajeError: '', contenido: { nombre: 'Corregida' } });
    await cola.reintentarErrores();
    expect(await cola.contarPorEstado()).toEqual({ PENDIENTE: 2, SINCRONIZADO: 0, ERROR: 0 });
  });

  test('quitar y ver los mas recientes', async () => {
    await cola.encolar(op(1));
    await cola.encolar(op(2));
    await cola.encolar(op(3));
    await cola.quitar(['op-2']);
    await cola.quitar([]);
    expect((await cola.recientes(2)).map(o => o.idOperacion)).toEqual(['op-3', 'op-1']);
  });
});

describe('catalogo en SQLite (ADR-029)', () => {
  test('guarda o actualiza parametros y solo entrega los activos, en orden', async () => {
    await catalogoSqlite.guardar([
      { tipo: 'UNIDAD', codigo: 'BULTO', etiqueta: 'Bulto', orden: 2, activo: true },
      { tipo: 'UNIDAD', codigo: 'KILOGRAMO', etiqueta: 'Kg', orden: 1, activo: true },
      { tipo: 'UNIDAD', codigo: 'VIEJA', etiqueta: 'Vieja', orden: 3, activo: false },
    ]);
    await catalogoSqlite.guardar([{ tipo: 'UNIDAD', codigo: 'KILOGRAMO', etiqueta: 'Kilogramo', orden: 1, activo: true }]);
    expect(await catalogoSqlite.activos('UNIDAD')).toEqual([
      { tipo: 'UNIDAD', codigo: 'KILOGRAMO', etiqueta: 'Kilogramo' },
      { tipo: 'UNIDAD', codigo: 'BULTO', etiqueta: 'Bulto' },
    ]);
    expect(await catalogoSqlite.todos()).toHaveLength(3);
  });
});

describe('datos de la cuenta en el celular (ADR-011)', () => {
  const datos = crearDatosCuentaSqlite(['operaciones_pendientes', ...TABLAS_REGISTROS]);

  test('anota de quien son los datos y cuenta lo que falta por enviar', async () => {
    expect(await datos.cuentaActual()).toBeNull();
    await datos.fijarCuenta('jose');
    expect(await datos.cuentaActual()).toBe('jose');
    expect(await datos.hayDatosLocales()).toBe(false);
    await cola.encolar(op(1));
    await cola.encolar(op(2));
    await cola.marcarSincronizada('op-1');
    expect(await datos.registrosSinEnviar()).toBe(1);
    expect(await datos.hayDatosLocales()).toBe(true);
  });

  test('limpiar borra registros, cola y la marca de ultima sincronizacion', async () => {
    await estructura();
    await cola.encolar(op(1));
    await metadatosSqlite.guardar('ultima_sincronizacion', '2026-10-01');
    await datos.limpiar();
    expect(await datos.hayDatosLocales()).toBe(false);
    expect(await repo.contarVigentes('LOTE')).toBe(0);
    expect(await metadatosSqlite.leer('ultima_sincronizacion')).toBeNull();
  });
});
