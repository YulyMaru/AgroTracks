/**
 * Motor de sincronizacion (ADR-001, ADR-007, HU-23, HU-44) con dobles en memoria de sus puertos:
 * sin celular, sin SQLite y sin backend. Cada prueba recorre un camino del flujo de sincronizacion.
 */
import type { Metadatos } from '../src/compartido/aplicacion/puertos';
import { crearCola } from '../src/modulos/sincronizacion/aplicacion/cola';
import { crearMotor, type ConfigMotor } from '../src/modulos/sincronizacion/aplicacion/motor';
import type {
  CopiaLocal,
  Red,
  RepositorioCola,
  ServidorSincronizacion,
} from '../src/modulos/sincronizacion/aplicacion/puertos';
import {
  FalloTemporal,
  RechazoDelServidor,
  SesionExpirada,
  type EstadoLocal,
  type EstadoMotor,
  type OperacionPendiente,
  type ResultadoOperacion,
} from '../src/modulos/sincronizacion/dominio/operacion';

const CONFIG: ConfigMotor = { operacionesPorLote: 2, maxReintentos: 2, esperaInicialMs: 0, esperaMaximaMs: 0 };

/** Cola guardada en el celular, en memoria: siguienteLote entrega las PENDIENTE en orden. */
function colaEnMemoria(inicial: OperacionPendiente[] = []) {
  const ops = [...inicial];
  const intentos: string[][] = [];
  const cola: RepositorioCola = {
    encolar: async o => {
      ops.push({ ...o, estado: 'PENDIENTE', reintentos: 0, ultimoIntentoEn: '', mensajeError: '' });
    },
    sinEnviarDe: async id => ops.filter(o => o.idRegistro === id && o.estado !== 'SINCRONIZADO'),
    reemplazarContenido: async (id, contenido) => {
      ops.filter(o => o.idOperacion === id).forEach(o => { o.contenido = contenido as Record<string, unknown>; });
    },
    quitar: async ids => {
      ids.forEach(id => ops.splice(ops.findIndex(o => o.idOperacion === id), 1));
    },
    siguienteLote: async limite => ops.filter(o => o.estado === 'PENDIENTE').slice(0, limite),
    registrarIntento: async ids => {
      intentos.push(ids);
    },
    marcarSincronizada: async id => {
      ops.filter(o => o.idOperacion === id).forEach(o => { o.estado = 'SINCRONIZADO'; });
    },
    marcarConError: async (id, mensaje) => {
      ops.filter(o => o.idOperacion === id).forEach(o => { o.estado = 'ERROR'; o.mensajeError = mensaje; });
    },
    reintentarErrores: async () => {
      ops.filter(o => o.estado === 'ERROR').forEach(o => { o.estado = 'PENDIENTE'; });
    },
    contarPorEstado: async () => {
      const conteo: Record<EstadoLocal, number> = { PENDIENTE: 0, SINCRONIZADO: 0, ERROR: 0 };
      ops.forEach(o => { conteo[o.estado]++; });
      return conteo;
    },
    recientes: async limite => ops.slice(-limite),
    idsConCambios: async () => new Set(ops.filter(o => o.estado !== 'SINCRONIZADO').map(o => o.idRegistro)),
    estadosSinEnviar: async entidad => ops
      .filter(o => o.entidad === entidad && o.estado !== 'SINCRONIZADO')
      .map(o => ({ idRegistro: o.idRegistro, estado: o.estado, mensaje: o.mensajeError })),
  };
  return { cola, ops, intentos };
}

const operacion = (n: number): OperacionPendiente => ({
  idOperacion: `op-${n}`, entidad: 'FINCA', accion: 'CREAR', idRegistro: `finca-${n}`, versionBase: 0,
  contenido: { nombre: `Finca ${n}` }, creadoEn: `2026-10-0${n}T10:00:00Z`, estado: 'PENDIENTE', reintentos: 0,
  ultimoIntentoEn: '', mensajeError: '',
});

const exito = (lote: OperacionPendiente[]): ResultadoOperacion[] =>
  lote.map(o => ({ idOperacion: o.idOperacion, estado: 'SINCRONIZADO', versionActual: 1, mensaje: '', detalles: [] }));

function metadatosEnMemoria(): Metadatos & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    leer: async clave => datos.get(clave) ?? null,
    guardar: async (clave, valor) => { datos.set(clave, valor); },
    borrar: async clave => { datos.delete(clave); },
  };
}

/** Todo listo para sincronizar: hay red, el servidor responde y hay sesion. */
function preparar(opciones: {
  ops?: OperacionPendiente[];
  enviar?: ServidorSincronizacion['enviar'];
  /** Registros con cambios sin enviar, aunque no esten en la cola de esta prueba. */
  conCambios?: string[];
} = {}) {
  const { cola: base, ops, intentos } = colaEnMemoria(opciones.ops);
  const cola: RepositorioCola = opciones.conCambios
    ? { ...base, idsConCambios: async () => new Set(opciones.conCambios) }
    : base;
  const metadatos = metadatosEnMemoria();
  const servidor = {
    disponible: jest.fn(async () => true),
    enviar: jest.fn(opciones.enviar ?? (async (lote: OperacionPendiente[]) => ({ resultados: exito(lote) }))),
    cambios: jest.fn<ReturnType<ServidorSincronizacion['cambios']>, [string | null]>(
      async () => ({ fechaServidor: '2026-10-20T00:00:00Z', cambios: {} })),
    parametros: jest.fn(async () => []),
  };
  const copia = { guardarRegistro: jest.fn(async () => {}), guardarCatalogo: jest.fn(async () => {}) };
  let avisarRed: (conectado: boolean) => void = () => {};
  const red = {
    hayConexion: jest.fn(async () => true),
    escuchar: jest.fn((alCambiar: (conectado: boolean) => void) => {
      avisarRed = alCambiar;
      return () => {};
    }),
  };
  const sesion = { haySesion: jest.fn(async () => true) };
  const motor = crearMotor({
    cola, servidor, copia: copia as CopiaLocal, red: red as Red, sesion, metadatos, config: CONFIG,
  });
  return { motor, ops, intentos, servidor, copia, red, sesion, metadatos, avisarRed: (c: boolean) => avisarRed(c) };
}

describe('antes de enviar revisa red, servidor y sesion', () => {
  test('sin internet no envia nada y los datos quedan en el celular', async () => {
    const { motor, red, servidor, ops } = preparar({ ops: [operacion(1)] });
    red.hayConexion.mockResolvedValue(false);
    const r = await motor.sincronizar();
    expect(r.desenlace).toBe('SIN_CONEXION');
    expect(servidor.enviar).not.toHaveBeenCalled();
    expect(ops[0].estado).toBe('PENDIENTE');
  });

  test('si el servidor no responde, la conexion se considera inestable', async () => {
    const { motor, servidor } = preparar({ ops: [operacion(1)] });
    servidor.disponible.mockResolvedValue(false);
    expect((await motor.sincronizar()).desenlace).toBe('CONEXION_INESTABLE');
    expect(servidor.enviar).not.toHaveBeenCalled();
  });

  test('sin sesion pide iniciar sesion y no envia', async () => {
    const { motor, sesion, servidor } = preparar({ ops: [operacion(1)] });
    sesion.haySesion.mockResolvedValue(false);
    expect((await motor.sincronizar()).desenlace).toBe('SESION_REQUERIDA');
    expect(servidor.enviar).not.toHaveBeenCalled();
  });
});

describe('envio de la cola', () => {
  test('envia todo por lotes, en orden, y marca cada operacion como sincronizada', async () => {
    const { motor, servidor, ops } = preparar({ ops: [operacion(1), operacion(2), operacion(3)] });
    const r = await motor.sincronizar();
    expect(r).toEqual({ desenlace: 'COMPLETADA', mensaje: 'Datos sincronizados.', sincronizadas: 3, conError: 0 });
    expect(servidor.enviar.mock.calls.map(([lote]) => lote.map(o => o.idOperacion)))
      .toEqual([['op-1', 'op-2'], ['op-3']]);
    expect(ops.every(o => o.estado === 'SINCRONIZADO')).toBe(true);
  });

  test('si no hay nada por enviar, igual descarga lo nuevo del servidor', async () => {
    const { motor, servidor, metadatos } = preparar();
    expect((await motor.sincronizar()).desenlace).toBe('NADA_POR_SINCRONIZAR');
    expect(servidor.enviar).not.toHaveBeenCalled();
    expect(metadatos.datos.get('ultima_sincronizacion')).toBe('2026-10-20T00:00:00Z');
  });

  test('YA_REGISTRADO es exito: un reenvio no duplica el registro (idempotencia, ADR-007)', async () => {
    const { motor, ops } = preparar({
      ops: [operacion(1)],
      enviar: async lote => ({
        resultados: lote.map(o => ({ idOperacion: o.idOperacion, estado: 'YA_REGISTRADO' as const, versionActual: 1, mensaje: '', detalles: [] })),
      }),
    });
    expect((await motor.sincronizar()).sincronizadas).toBe(1);
    expect(ops[0].estado).toBe('SINCRONIZADO');
  });

  test('una operacion rechazada queda en ERROR con el mensaje del servidor y las demas siguen', async () => {
    const { motor, ops } = preparar({
      ops: [operacion(1), operacion(2)],
      enviar: async lote => ({
        resultados: [
          { idOperacion: lote[0].idOperacion, estado: 'ERROR', versionActual: 0, mensaje: 'Dato invalido.', detalles: ['nombre vacio'] },
          ...exito(lote.slice(1)),
        ],
      }),
    });
    const r = await motor.sincronizar();
    expect(r).toEqual({ desenlace: 'COMPLETADA', mensaje: '1 sincronizados, 1 con error.', sincronizadas: 1, conError: 1 });
    expect(ops[0]).toMatchObject({ estado: 'ERROR', mensajeError: 'Dato invalido. nombre vacio' });
    expect(ops[1].estado).toBe('SINCRONIZADO');
  });

  test('ignora resultados de operaciones que no estaban en el lote', async () => {
    const { motor, ops } = preparar({
      ops: [operacion(1)],
      enviar: async lote => ({
        resultados: [
          { idOperacion: 'otra', estado: 'SINCRONIZADO', versionActual: 1, mensaje: '', detalles: [] },
          ...exito(lote),
        ],
      }),
    });
    expect((await motor.sincronizar()).sincronizadas).toBe(1);
    expect(ops[0].estado).toBe('SINCRONIZADO');
  });

  test('si el servidor no responde nada del lote, se detiene para no quedar en un bucle', async () => {
    const { motor, ops } = preparar({ ops: [operacion(1)], enviar: async () => ({ resultados: [] }) });
    const r = await motor.sincronizar();
    expect(r.desenlace).toBe('DETENIDA');
    expect(r.mensaje).toContain('Respuesta inesperada');
    expect(ops[0].estado).toBe('PENDIENTE');
  });
});

describe('fallos al enviar (ADR-001: reintento con backoff)', () => {
  test('ante un fallo temporal reintenta el mismo lote y termina enviandolo', async () => {
    let llamadas = 0;
    const { motor, intentos } = preparar({
      ops: [operacion(1)],
      enviar: async lote => {
        llamadas++;
        if (llamadas === 1) {
          throw new FalloTemporal('Sin respuesta.');
        }
        return { resultados: exito(lote) };
      },
    });
    expect((await motor.sincronizar()).desenlace).toBe('COMPLETADA');
    expect(intentos).toEqual([['op-1'], ['op-1']]);
  });

  test('si los reintentos se agotan, se detiene y lo no enviado sigue PENDIENTE', async () => {
    const { motor, ops, intentos } = preparar({
      ops: [operacion(1)],
      enviar: async () => { throw new FalloTemporal('El servidor no responde.'); },
    });
    const r = await motor.sincronizar();
    expect(r.desenlace).toBe('DETENIDA');
    expect(r.mensaje).toBe('El servidor no responde. Se reintentará en la próxima reconexión.');
    expect(intentos).toHaveLength(CONFIG.maxReintentos + 1);
    expect(ops[0].estado).toBe('PENDIENTE');
  });

  test('un rechazo del lote completo no se reintenta', async () => {
    const { motor, intentos } = preparar({
      ops: [operacion(1)],
      enviar: async () => { throw new RechazoDelServidor('Lote invalido.'); },
    });
    expect((await motor.sincronizar()).desenlace).toBe('DETENIDA');
    expect(intentos).toHaveLength(1);
  });

  test('si la sesion vence durante el envio, pide iniciar sesion y conserva los datos', async () => {
    const { motor, ops } = preparar({
      ops: [operacion(1)],
      enviar: async () => { throw new SesionExpirada('Sesion vencida.'); },
    });
    expect((await motor.sincronizar()).desenlace).toBe('SESION_REQUERIDA');
    expect(ops[0].estado).toBe('PENDIENTE');
  });
});

describe('descarga de cambios del servidor (HU-24)', () => {
  test('guarda lo nuevo pero no pisa un registro con cambios sin enviar', async () => {
    // La finca-1 tiene un cambio sin enviar en el celular
    const { motor, servidor, copia, metadatos } = preparar({ conCambios: ['finca-1'] });
    await metadatos.guardar('ultima_sincronizacion', '2026-10-01T00:00:00Z');
    servidor.cambios.mockResolvedValue({
      fechaServidor: '2026-10-21T00:00:00Z',
      cambios: { FINCA: [{ id: 'finca-1', nombre: 'Del servidor' }, { id: 'finca-9', nombre: 'Nueva' }] },
    });
    await motor.sincronizar();
    expect(servidor.cambios).toHaveBeenCalledWith('2026-10-01T00:00:00Z');
    expect(copia.guardarRegistro).toHaveBeenCalledTimes(1);
    expect(copia.guardarRegistro).toHaveBeenCalledWith('FINCA', { id: 'finca-9', nombre: 'Nueva' });
    expect(copia.guardarCatalogo).toHaveBeenCalled();
    expect(metadatos.datos.get('ultima_sincronizacion')).toBe('2026-10-21T00:00:00Z');
  });

  test('si la descarga falla, lo enviado igual cuenta como sincronizado', async () => {
    const { motor, servidor } = preparar({ ops: [operacion(1)] });
    servidor.cambios.mockRejectedValue(new Error('caida'));
    expect((await motor.sincronizar()).desenlace).toBe('COMPLETADA');
  });
});

describe('estado para la pantalla', () => {
  test('una segunda sincronizacion mientras otra esta en curso no hace nada', async () => {
    const { motor, red } = preparar({ ops: [operacion(1)] });
    let soltar: (v: boolean) => void = () => {};
    red.hayConexion.mockImplementationOnce(() => new Promise<boolean>(resolver => { soltar = resolver; }));
    const primera = motor.sincronizar();
    expect(motor.haySincronizacionEnCurso()).toBe(true);
    expect((await motor.sincronizar()).desenlace).toBe('EN_CURSO');
    soltar(true);
    expect((await primera).desenlace).toBe('COMPLETADA');
    expect(motor.haySincronizacionEnCurso()).toBe(false);
  });

  test('avisa a los suscritos cuando empieza y cuando termina', async () => {
    const { motor } = preparar({ ops: [operacion(1)] });
    const vistos: EstadoMotor[] = [];
    const desuscribir = motor.suscribirse(e => vistos.push(e));
    await motor.sincronizar();
    desuscribir();
    await motor.sincronizar();
    expect(vistos.map(e => e.sincronizando)).toEqual([false, true, false]);
    expect(vistos[2].ultimo?.desenlace).toBe('COMPLETADA');
  });

  test('al volver la conexion sincroniza sola, una vez por reconexion (ADR-006)', async () => {
    const { motor, avisarRed, servidor } = preparar({ ops: [operacion(1)] });
    const conexion: boolean[] = [];
    motor.iniciarAutomatica(c => conexion.push(c));
    avisarRed(false);
    avisarRed(true);
    await new Promise<void>(resolver => setTimeout(resolver, 0));
    avisarRed(true);
    await new Promise<void>(resolver => setTimeout(resolver, 0));
    expect(conexion).toEqual([false, true, true]);
    expect(servidor.enviar).toHaveBeenCalledTimes(1);
  });
});

describe('cola de cambios (API publica)', () => {
  test('cada cambio recibe un id de operacion nuevo para la idempotencia', async () => {
    const { cola: repositorio, ops } = colaEnMemoria();
    let n = 0;
    const cola = crearCola(repositorio, { nuevo: () => `id-${++n}` });
    await cola.encolar('LOTE', 'CREAR', 'lote-1', 0, { nombre: 'Lote alto' });
    await cola.encolar('LOTE', 'EDITAR', 'lote-1', 1, { nombre: 'Lote bajo' });
    expect(ops.map(o => [o.idOperacion, o.accion, o.estado])).toEqual([
      ['id-1', 'CREAR', 'PENDIENTE'], ['id-2', 'EDITAR', 'PENDIENTE'],
    ]);
    expect(await cola.contarPorEstado()).toEqual({ PENDIENTE: 2, SINCRONIZADO: 0, ERROR: 0 });
    expect((await cola.sinEnviarDe('lote-1')).map(o => o.idOperacion)).toEqual(['id-1', 'id-2']);
  });

  test('las operaciones con error se pueden reintentar (HU-44)', async () => {
    const { cola: repositorio, ops } = colaEnMemoria([{ ...operacion(1), estado: 'ERROR', mensajeError: 'x' }]);
    const cola = crearCola(repositorio, { nuevo: () => 'id' });
    expect(await cola.estadosSinEnviar('FINCA')).toEqual([{ idRegistro: 'finca-1', estado: 'ERROR', mensaje: 'x' }]);
    await cola.reintentarErrores();
    expect(ops[0].estado).toBe('PENDIENTE');
    expect(await cola.recientes()).toHaveLength(1);
    await cola.reemplazarContenido('op-1', { nombre: 'Corregida' });
    expect(ops[0].contenido).toEqual({ nombre: 'Corregida' });
    await cola.quitar(['op-1']);
    expect(ops).toHaveLength(0);
  });
});
