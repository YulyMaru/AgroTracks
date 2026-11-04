/**
 * Casos de uso de los registros offline-first (ADR-005, HU-22) con dobles en memoria de sus puertos:
 * cada cambio se guarda en el celular y se encola para el servidor en la misma transaccion.
 */
import type { Metadatos } from '../src/compartido/aplicacion/puertos';
import { crearPreferencias } from '../src/compartido/aplicacion/preferencias';
import { crearCasosRegistros } from '../src/modulos/registros/aplicacion/casosDeUso';
import type { CatalogoLocal, ColaCambios, RepositorioRegistros } from '../src/modulos/registros/aplicacion/puertos';
import type {
  Accion,
  CultivoDatos,
  DatosPorEntidad,
  Entidad,
  EstadoEnvio,
  GastoDatos,
  LoteDatos,
  Parametro,
} from '../src/modulos/registros/dominio/modelo';

interface Fila { entidad: Entidad; datos: object; version: number; eliminado: boolean; idFinca: string | null }
interface Encolada { idOperacion: string; entidad: Entidad; accion: Accion; idRegistro: string; versionBase: number; contenido: object; estado: EstadoEnvio; mensaje: string }

/** Registros del celular en memoria. Un registro "depende" de otro si alguno de sus datos es el id del otro. */
function repositorioEnMemoria() {
  const filas = new Map<string, Fila>();
  const vigentes = (entidad: Entidad) => [...filas.entries()].filter(([, f]) => f.entidad === entidad && !f.eliminado);
  const datosDe = <T>(id: string) => filas.get(id)?.datos as T | undefined;
  const repositorio: RepositorioRegistros = {
    buscar: async <E extends Entidad>(entidad: E, id: string) => {
      const f = filas.get(id);
      return f && f.entidad === entidad
        ? { datos: f.datos as DatosPorEntidad[E], version: f.version, eliminado: f.eliminado } : null;
    },
    insertar: async (entidad, id, datos, idFinca, version) => {
      filas.set(id, { entidad, datos, version, eliminado: false, idFinca });
    },
    actualizar: async (_entidad, id, datos, idFinca, version) => {
      Object.assign(filas.get(id)!, { datos, idFinca, version });
    },
    marcarEliminado: async (_entidad, id, version) => {
      Object.assign(filas.get(id)!, { eliminado: true, version });
    },
    borrar: async (_entidad, id) => {
      filas.delete(id);
    },
    guardarCopia: jest.fn(async () => {}),
    fincaDe: async (nivel, id) => {
      if (nivel === 'LOTE') {
        return datosDe<LoteDatos>(id)?.idFinca ?? null;
      }
      const cultivo = datosDe<CultivoDatos>(id);
      return cultivo ? datosDe<LoteDatos>(cultivo.idLote)?.idFinca ?? null : null;
    },
    loteDeCultivo: async id => datosDe<CultivoDatos>(id)?.idLote ?? null,
    contarDependientes: async (_entidad, id) =>
      [...filas.values()].filter(f => !f.eliminado && Object.values(f.datos).includes(id)).length,
    resumenes: async entidad => vigentes(entidad).map(([id, f]) => ({ id, ...(f.datos as Record<string, string>) })),
    contarVigentes: async entidad => vigentes(entidad).length,
    fincas: async () => vigentes('FINCA').map(([id, f]) => ({ valor: id, etiqueta: (f.datos as { nombre: string }).nombre })),
    lotes: async idFinca => vigentes('LOTE').filter(([, f]) => (f.datos as LoteDatos).idFinca === idFinca)
      .map(([id, f]) => ({ valor: id, etiqueta: (f.datos as LoteDatos).nombre })),
    cultivos: async idLote => vigentes('CULTIVO')
      .filter(([, f]) => !idLote || (f.datos as CultivoDatos).idLote === idLote)
      .map(([id, f]) => {
        const c = f.datos as CultivoDatos;
        const lote = datosDe<LoteDatos>(c.idLote)!;
        return { id, tipoCultivo: c.tipoCultivo, especie: c.especie, lote: lote.nombre, finca: datosDe<{ nombre: string }>(lote.idFinca)!.nombre };
      }),
    nombre: async (_entidad, id) => datosDe<{ nombre: string }>(id)?.nombre ?? '',
    valoresUsados: async () => ['Rionegro'],
    movimientosDeDinero: async () => [],
    produccion: async () => [],
    trabajos: async () => [],
    estructura: async () => ({
      fincas: vigentes('FINCA').map(([id, f]) => ({ id, nombre: (f.datos as { nombre: string }).nombre })),
      lotes: vigentes('LOTE').map(([id, f]) => ({ id, nombre: (f.datos as LoteDatos).nombre, idFinca: (f.datos as LoteDatos).idFinca })),
      cultivos: vigentes('CULTIVO').map(([id, f]) => ({ id, ...(f.datos as CultivoDatos) })),
    }),
  };
  return { repositorio, filas };
}

function preparar() {
  const { repositorio, filas } = repositorioEnMemoria();
  const encoladas: Encolada[] = [];
  let enCurso = false;
  let numero = 0;
  const cola: ColaCambios = {
    encolar: async (entidad, accion, idRegistro, versionBase, contenido) => {
      encoladas.push({ idOperacion: `op-${++numero}`, entidad, accion, idRegistro, versionBase, contenido, estado: 'PENDIENTE', mensaje: '' });
    },
    sinEnviarDe: async id => encoladas.filter(o => o.idRegistro === id),
    reemplazarContenido: async (id, contenido) => {
      encoladas.filter(o => o.idOperacion === id).forEach(o => { o.contenido = contenido; });
    },
    quitar: async ids => {
      ids.forEach(id => encoladas.splice(encoladas.findIndex(o => o.idOperacion === id), 1));
    },
    estadosSinEnviar: async entidad => encoladas.filter(o => o.entidad === entidad)
      .map(o => ({ idRegistro: o.idRegistro, estado: o.estado, mensaje: o.mensaje })),
    envioEnCurso: () => enCurso,
  };
  const parametros: (Parametro & { orden: number; activo: boolean })[] = [];
  const catalogo: CatalogoLocal = {
    activos: async tipo => parametros.filter(x => x.tipo === tipo && x.activo),
    todos: async () => parametros,
    guardar: async nuevos => { parametros.push(...nuevos); },
  };
  const transacciones = { veces: 0, ejecutar: async (trabajo: () => Promise<void>) => { transacciones.veces++; await trabajo(); } };
  const metadatos: Metadatos = { leer: jest.fn(async () => null), guardar: jest.fn(async () => {}), borrar: jest.fn(async () => {}) };
  let id = 0;
  const casos = crearCasosRegistros({
    repositorio, catalogo, cola, transacciones, metadatos, ids: { nuevo: () => `id-${++id}` },
  });
  return { casos, filas, encoladas, transacciones, metadatos, parametros, enviando: (v: boolean) => { enCurso = v; } };
}

const FINCA = { nombre: 'La Esperanza', municipio: 'Rionegro', vereda: 'El Tablazo' };

/** Una finca con un lote y un cultivo de cafe, ya enviados al servidor (sin cambios en la cola). */
async function conEstructura(p: ReturnType<typeof preparar>) {
  const finca = await p.casos.crear('FINCA', FINCA);
  const lote = await p.casos.crear('LOTE', { idFinca: finca, nombre: 'Lote alto', area: 2, unidadArea: 'HECTAREA' });
  const cultivo = await p.casos.crear('CULTIVO', { idLote: lote, tipoCultivo: 'CAFE', especie: 'Castillo', fechaSiembra: '2025-03-01' });
  p.encoladas.length = 0;
  return { finca, lote, cultivo };
}

describe('crear', () => {
  test('guarda el registro con version 1 y encola CREAR en la misma transaccion', async () => {
    const p = preparar();
    const id = await p.casos.crear('FINCA', FINCA);
    expect(p.filas.get(id)).toMatchObject({ entidad: 'FINCA', version: 1, eliminado: false, idFinca: null });
    expect(p.encoladas).toEqual([expect.objectContaining({ accion: 'CREAR', idRegistro: id, versionBase: 0, contenido: FINCA })]);
    expect(p.transacciones.veces).toBe(1);
    expect(await p.casos.obtener('FINCA', id)).toEqual(FINCA);
  });

  test('un gasto de un cultivo queda asignado a la finca de ese cultivo', async () => {
    const p = preparar();
    const { finca, cultivo } = await conEstructura(p);
    const gasto: GastoDatos = { fecha: '2026-10-05', categoria: 'MANO_DE_OBRA', concepto: 'Desyerba', valor: 300000, nivelAsignacion: 'CULTIVO', idAsignacion: cultivo };
    const id = await p.casos.crear('GASTO', gasto);
    expect(p.filas.get(id)?.idFinca).toBe(finca);
  });

  test('no deja asignar un gasto a un lugar que no existe', async () => {
    const p = preparar();
    await expect(p.casos.crear('GASTO', { fecha: '2026-10-05', categoria: 'OTROS', concepto: 'x', valor: 1, nivelAsignacion: 'LOTE', idAsignacion: 'no-existe' }))
      .rejects.toThrow('No encontramos el lugar elegido.');
    expect(p.encoladas).toHaveLength(0);
  });
});

describe('editar', () => {
  test('un registro ya enviado sube de version y encola EDITAR con la version que conoce el servidor', async () => {
    const p = preparar();
    const { finca } = await conEstructura(p);
    await p.casos.editar('FINCA', finca, { ...FINCA, nombre: 'La Esperanza 2' });
    expect(p.filas.get(finca)?.version).toBe(2);
    expect(p.encoladas).toEqual([expect.objectContaining({ accion: 'EDITAR', versionBase: 1 })]);
  });

  test('si el registro aun no se envia, la edicion se junta con el CREAR pendiente', async () => {
    const p = preparar();
    const id = await p.casos.crear('FINCA', FINCA);
    await p.casos.editar('FINCA', id, { ...FINCA, vereda: 'Cabeceras' });
    expect(p.encoladas).toHaveLength(1);
    expect(p.encoladas[0]).toMatchObject({ accion: 'CREAR', contenido: { vereda: 'Cabeceras' } });
    expect(p.filas.get(id)?.version).toBe(1);
  });

  test('mientras se envia la cola no reescribe operaciones que pueden estar viajando', async () => {
    const p = preparar();
    const id = await p.casos.crear('FINCA', FINCA);
    p.enviando(true);
    await p.casos.editar('FINCA', id, { ...FINCA, vereda: 'Cabeceras' });
    expect(p.encoladas.map(o => o.accion)).toEqual(['CREAR', 'EDITAR']);
  });

  test('no se puede editar un registro eliminado', async () => {
    const p = preparar();
    const { cultivo } = await conEstructura(p);
    await p.casos.eliminar('CULTIVO', cultivo);
    await expect(p.casos.editar('CULTIVO', cultivo, { idLote: 'x', tipoCultivo: 'CAFE', especie: '', fechaSiembra: '' }))
      .rejects.toThrow('Este registro ya no existe.');
  });
});

describe('eliminar', () => {
  test('no deja eliminar una finca que tiene lotes', async () => {
    const p = preparar();
    const { finca } = await conEstructura(p);
    await expect(p.casos.eliminar('FINCA', finca)).rejects.toThrow('Esta finca tiene lotes');
  });

  test('un registro ya enviado se marca eliminado (borrado logico) y se encola ELIMINAR', async () => {
    const p = preparar();
    const { cultivo } = await conEstructura(p);
    await p.casos.eliminar('CULTIVO', cultivo);
    expect(p.filas.get(cultivo)).toMatchObject({ eliminado: true, version: 2 });
    expect(p.encoladas).toEqual([expect.objectContaining({ accion: 'ELIMINAR', versionBase: 1, contenido: {} })]);
  });

  test('un registro que nunca llego al servidor se quita del celular sin enviar nada', async () => {
    const p = preparar();
    const id = await p.casos.crear('FINCA', FINCA);
    await p.casos.eliminar('FINCA', id);
    expect(p.filas.has(id)).toBe(false);
    expect(p.encoladas).toHaveLength(0);
  });
});

describe('descartar un cambio rechazado por el servidor', () => {
  test('si era un registro nuevo, se quita del celular y de la cola', async () => {
    const p = preparar();
    const id = await p.casos.crear('FINCA', FINCA);
    await p.casos.descartarCambio({ entidad: 'FINCA', accion: 'CREAR', idRegistro: id });
    expect(p.filas.has(id)).toBe(false);
    expect(p.encoladas).toHaveLength(0);
  });

  test('si era una edicion, se vuelve a pedir la copia del servidor', async () => {
    const p = preparar();
    const { finca } = await conEstructura(p);
    await p.casos.editar('FINCA', finca, { ...FINCA, nombre: 'Otra' });
    await p.casos.descartarCambio({ entidad: 'FINCA', accion: 'EDITAR', idRegistro: finca });
    expect(p.encoladas).toHaveLength(0);
    expect(p.metadatos.borrar).toHaveBeenCalledWith('ultima_sincronizacion');
  });
});

describe('consultas para las pantallas', () => {
  test('la lista muestra el estado de envio y el error tiene prioridad', async () => {
    const p = preparar();
    const { finca, lote } = await conEstructura(p);
    await p.casos.editar('LOTE', lote, { idFinca: finca, nombre: 'Lote alto', area: 3, unidadArea: 'HECTAREA' });
    p.encoladas[0].estado = 'ERROR';
    p.encoladas[0].mensaje = 'Area invalida.';
    p.enviando(true);
    await p.casos.editar('LOTE', lote, { idFinca: finca, nombre: 'Lote alto', area: 4, unidadArea: 'HECTAREA' });
    const lista = await p.casos.listar('LOTE');
    expect(lista).toEqual([expect.objectContaining({ id: lote, envio: 'ERROR', mensajeError: 'Area invalida.' })]);
    expect((await p.casos.listar('FINCA'))[0]).toMatchObject({ envio: 'SINCRONIZADO', mensajeError: '' });
  });

  test('sin catalogo descargado usa la copia que trae la app; despues, el del servidor', async () => {
    const p = preparar();
    expect((await p.casos.listarParametros('UNIDAD_AREA')).map(x => x.codigo)).toContain('HECTAREA');
    expect(await p.casos.listarParametros('NO_EXISTE')).toEqual([]);
    await p.casos.guardarCatalogo([{ tipo: 'UNIDAD_AREA', codigo: 'FANEGADA', etiqueta: 'Fanegada', orden: 1, activo: true }]);
    expect((await p.casos.listarParametros('UNIDAD_AREA')).map(x => x.codigo)).toEqual(['FANEGADA']);
    const etiquetas = await p.casos.cargarEtiquetas();
    expect(etiquetas('UNIDAD_AREA', 'FANEGADA')).toBe('Fanegada');
    expect(etiquetas('TIPO_CULTIVO', 'CAFE')).toBe('Café');
    expect(etiquetas('X', 'SIN_NOMBRE')).toBe('SIN_NOMBRE');
  });

  test('nombres y ubicacion de fincas, lotes y cultivos', async () => {
    const p = preparar();
    const { finca, lote, cultivo } = await conEstructura(p);
    expect(await p.casos.opcionesFincas()).toEqual([{ valor: finca, etiqueta: 'La Esperanza' }]);
    expect(await p.casos.opcionesLotes(finca)).toEqual([{ valor: lote, etiqueta: 'Lote alto' }]);
    expect(await p.casos.opcionesCultivos()).toEqual([{ valor: cultivo, etiqueta: 'Café Castillo · Lote alto (La Esperanza)' }]);
    expect(await p.casos.opcionesCultivos(lote)).toEqual([{ valor: cultivo, etiqueta: 'Café Castillo · Lote alto' }]);
    expect(await p.casos.nombreDe('CULTIVO', cultivo)).toBe('Café Castillo · Lote alto (La Esperanza)');
    expect(await p.casos.nombreDe('LOTE', lote)).toBe('Lote alto');
    expect(await p.casos.ubicacionDe('FINCA', finca)).toEqual({ idFinca: finca });
    expect(await p.casos.ubicacionDe('LOTE', lote)).toEqual({ idFinca: finca, idLote: lote });
    expect(await p.casos.ubicacionDe('CULTIVO', cultivo)).toEqual({ idFinca: finca, idLote: lote, idCultivo: cultivo });
  });

  test('estructura, conteos y sugerencias', async () => {
    const p = preparar();
    const { finca, lote, cultivo } = await conEstructura(p);
    expect(await p.casos.estructura()).toEqual({
      fincas: [{ id: finca, nombre: 'La Esperanza' }],
      lotes: [{ id: lote, nombre: 'Lote alto', idFinca: finca }],
      cultivos: [{ id: cultivo, idLote: lote, nombre: 'Café Castillo' }],
    });
    expect(await p.casos.contarRegistros()).toMatchObject({ FINCA: 1, LOTE: 1, CULTIVO: 1, GASTO: 0 });
    expect(await p.casos.sugerencias('FINCA', 'municipio')).toEqual(['Rionegro']);
    expect(await p.casos.movimientosDeDinero()).toEqual([]);
    expect(await p.casos.produccion()).toEqual([]);
    expect(await p.casos.trabajos()).toEqual([]);
  });
});

describe('preferencias del campesino', () => {
  test('recuerda lo ultimo que eligio, guardado en el celular', async () => {
    const datos = new Map<string, string>();
    const preferencias = crearPreferencias({
      leer: async clave => datos.get(clave) ?? null,
      guardar: async (clave, valor) => { datos.set(clave, valor); },
      borrar: async clave => { datos.delete(clave); },
    });
    expect(await preferencias.leer('finca')).toBeNull();
    await preferencias.recordar('finca', 'id-1');
    expect(await preferencias.leer('finca')).toBe('id-1');
    expect(datos.has('preferencia.finca')).toBe(true);
  });
});
