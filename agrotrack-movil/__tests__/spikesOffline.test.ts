
import axios from 'axios';

import { api } from '../src/compartido/infraestructura/http/clienteHttp';
import { CONFIG_SINCRONIZACION } from '../src/compartido/infraestructura/configuracion/entorno';
import type { app as App } from '../src/composicion';
import { keychain, opSqlite, redFalsa, servidorFalso, type Peticion, type Respuesta } from '../pruebas/dobles';

jest.mock('@op-engineering/op-sqlite', () => require('../pruebas/dobles').opSqlite);
jest.mock('react-native-keychain', () => require('../pruebas/dobles').keychain);
jest.mock('@react-native-community/netinfo', () => ({ __esModule: true, default: require('../pruebas/dobles').redFalsa }));

jest.setTimeout(60_000);

const TOKENS = { accessToken: 'acceso-1', refreshToken: 'renovar-1', idUsuario: 'maria', nombre: 'María' };
const HOY = new Date().toISOString().slice(0, 10);
const MES = HOY.slice(0, 7);

// --- Backend de prueba: guarda cada operacion una sola vez por idOperacion ---------------------
type Modo = 'normal' | 'caido';
const backend = {
  modo: 'normal' as Modo,
  /** Cuantas respuestas siguientes se pierden en el camino (el servidor SI guarda). */
  perderRespuestas: 0,
  /** idOperacion -> idRegistro guardado. */
  aplicadas: new Map<string, string>(),
  /** Registros guardados: idRegistro -> veces que se creo. */
  registros: new Map<string, number>(),
  envios: [] as number[],
};

function responder(p: Peticion): Respuesta {
  switch (p.ruta) {
    case '/api/v1/autenticacion/inicio-sesion':
      return { status: 200, data: TOKENS };
    case '/api/v1/sincronizacion/estado':
      return { status: 200, data: { disponible: true } };
    case '/api/v1/sincronizacion/operaciones': {
      backend.envios.push(Date.now());
      if (backend.modo === 'caido') {
        return { status: 503, data: { codigo: 'SERVICIO_NO_DISPONIBLE', mensaje: 'No disponible', detalles: [] } };
      }
      const { operaciones } = p.cuerpo as { operaciones: { idOperacion: string; idRegistro: string }[] };
      const resultados = operaciones.map(o => {
        const ya = backend.aplicadas.has(o.idOperacion);
        if (!ya) {
          backend.aplicadas.set(o.idOperacion, o.idRegistro);
          backend.registros.set(o.idRegistro, (backend.registros.get(o.idRegistro) ?? 0) + 1);
        }
        return { idOperacion: o.idOperacion, estado: ya ? 'YA_REGISTRADO' : 'SINCRONIZADO', versionActual: 1, mensaje: '', detalles: [] };
      });
      if (backend.perderRespuestas > 0) {
        backend.perderRespuestas--;
        // El servidor SI guardo, pero la respuesta no llego al celular (mala senal).
        return 'SIN_RED';
      }
      return { status: 200, data: { resultados } };
    }
    case '/api/v1/sincronizacion/cambios':
      return { status: 200, data: { fechaServidor: new Date().toISOString(), cambios: {} } };
    case '/api/v1/parametros':
      return { status: 200, data: [] };
    default:
      return { status: 404 };
  }
}

const servidor = servidorFalso(responder);

/** "Abre la app": modulos nuevos sobre el mismo almacenamiento del celular (SQLite y Keystore). */
function abrirApp(): typeof App {
  let nueva!: typeof App;
  jest.isolateModules(() => {
    const http = require('../src/compartido/infraestructura/http/clienteHttp');
    http.api.defaults.adapter = servidor.adapter;
    require('axios').defaults.adapter = servidor.adapter;
    nueva = require('../src/composicion').app;
  });
  return nueva;
}

api.defaults.adapter = servidor.adapter;
axios.defaults.adapter = servidor.adapter;

const tiempos: Record<string, string> = {};
const ms = (desde: number) => Math.round((performance.now() - desde) * 100) / 100;

let app: typeof App;

beforeAll(async () => {
  app = abrirApp();
  await app.iniciar();
  await app.sesion.iniciarSesion('maria', 'clave1234');
});

afterEach(() => {
  backend.modo = 'normal';
  redFalsa.cambiar({ isConnected: true, isInternetReachable: true });
});

afterAll(() => {
  const filas = Object.entries(tiempos).map(([k, v]) => `  ${k.padEnd(62)} ${v}`).join('\n');
  console.log(`\n=== Mediciones de los spikes (movil, Jest en el PC) ===\n${filas}\n`);
});

async function crearFinca(a: typeof App, n: number): Promise<string> {
  return a.registros.crear('FINCA', { nombre: `Finca ${n}`, municipio: 'Rionegro', vereda: 'El Tablazo' });
}

describe('SPIKE-005: registro sin conexion con cola de pendientes', () => {
  test('50 registros sin senal quedan en PENDIENTE, en menos de 200 ms cada uno, y sobreviven al cierre de la app', async () => {
    redFalsa.cambiar({ isConnected: false });
    const antes = await app.cola.contarPorEstado();

    const duraciones: number[] = [];
    for (let i = 0; i < 50; i++) {
      const inicio = performance.now();
      await crearFinca(app, i);
      duraciones.push(performance.now() - inicio);
    }
    const promedio = duraciones.reduce((a, b) => a + b, 0) / duraciones.length;
    tiempos['SPIKE-005 guardar 1 registro offline (promedio de 50)'] = `${promedio.toFixed(2)} ms`;
    tiempos['SPIKE-005 guardar 1 registro offline (el mas lento)'] = `${Math.max(...duraciones).toFixed(2)} ms`;
    expect(promedio).toBeLessThan(200);

    const despues = await app.cola.contarPorEstado();
    expect(despues.PENDIENTE - antes.PENDIENTE).toBe(50);
    expect((await app.registros.listar('FINCA')).filter(f => f.envio === 'PENDIENTE').length).toBeGreaterThanOrEqual(50);
    expect((await app.motor.sincronizar()).desenlace).toBe('SIN_CONEXION');

    // Se cierra la app y se vuelve a abrir: todo sigue ahi.
    app = abrirApp();
    await app.iniciar();
    expect(await app.cola.contarPorEstado()).toEqual(despues);
    expect(await app.sesion.haySesion()).toBe(true);
  });

  test('al volver la senal la cola se envia sola, en orden, y todo queda SINCRONIZADO', async () => {
    const pendientes = (await app.cola.contarPorEstado()).PENDIENTE;
    expect(pendientes).toBeGreaterThan(0);
    redFalsa.cambiar({ isConnected: false });
    const dejar = app.motor.iniciarAutomatica();
    const termino = new Promise<void>(listo => {
      const quitar = app.motor.suscribirse(e => {
        if (e.ultimo?.desenlace === 'COMPLETADA') {
          quitar();
          listo();
        }
      });
    });
    const inicio = performance.now();
    redFalsa.cambiar({ isConnected: true, isInternetReachable: true });
    await termino;
    dejar();
    tiempos[`SPIKE-001 enviar ${pendientes} pendientes al reconectar`] = `${ms(inicio)} ms`;
    expect(await app.cola.contarPorEstado()).toMatchObject({ PENDIENTE: 0, ERROR: 0 });
  });
});

describe('SPIKE-007: idempotencia, interrupciones y consistencia', () => {
  test('si la respuesta se pierde, el reenvio usa el mismo idOperacion: 5 envios = 1 registro en el servidor', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] });
    try {
      const id = await crearFinca(app, 900);
      backend.envios = [];
      backend.perderRespuestas = 4;
      const sincronizacion = app.motor.sincronizar();
      await jest.advanceTimersByTimeAsync(400);
      // El servidor ya lo guardo pero la confirmacion no llego: sigue PENDIENTE, no SINCRONIZADO a ciegas.
      expect(backend.registros.get(id)).toBe(1);
      expect((await app.registros.listar('FINCA')).find(f => f.id === id)?.envio).toBe('PENDIENTE');
      await jest.advanceTimersByTimeAsync(60_000);
      expect((await sincronizacion).desenlace).toBe('COMPLETADA');

      expect(backend.envios).toHaveLength(5);
      expect([...backend.aplicadas].filter(([, registro]) => registro === id)).toHaveLength(1);
      expect(backend.registros.get(id)).toBe(1);
      expect((await app.registros.listar('FINCA')).find(f => f.id === id)?.envio).toBe('SINCRONIZADO');
    } finally {
      jest.useRealTimers();
      backend.perderRespuestas = 0;
    }
  });

  test('con el servidor caido los reintentos se agotan y nada se pierde: todo sigue PENDIENTE', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] });
    try {
      await crearFinca(app, 901);
      backend.modo = 'caido';
      const sincronizacion = app.motor.sincronizar();
      await jest.advanceTimersByTimeAsync(5 * 60_000);
      const resultado = await sincronizacion;
      expect(resultado.desenlace).toBe('DETENIDA');
      expect((await app.cola.contarPorEstado()).PENDIENTE).toBe(1);
    } finally {
      jest.useRealTimers();
    }
    backend.modo = 'normal';
    expect((await app.motor.sincronizar()).desenlace).toBe('COMPLETADA');
  });

  test('editar un gasto actualiza al instante el analisis del mes', async () => {
    const finca = await crearFinca(app, 902);
    const gasto = { fecha: HOY, categoria: 'MANO_DE_OBRA', concepto: 'Jornal', valor: 100_000, nivelAsignacion: 'FINCA' as const, idAsignacion: finca };
    const antes = (await app.analisis.analizar(MES)).totales.gastos;
    const id = await app.registros.crear('GASTO', gasto);
    expect((await app.analisis.analizar(MES)).totales.gastos).toBe(antes + 100_000);
    await app.registros.editar('GASTO', id, { ...gasto, valor: 250_000 });
    expect((await app.analisis.analizar(MES)).totales.gastos).toBe(antes + 250_000);
    await app.registros.eliminar('GASTO', id);
    expect((await app.analisis.analizar(MES)).totales.gastos).toBe(antes);
  });
});

describe('SPIKE-001 / SPIKE-024: backoff exponencial', () => {
  test('con el servidor caido hace como maximo 10 intentos en el primer minuto y las esperas crecen', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] });
    try {
      await crearFinca(app, 903);
      backend.modo = 'caido';
      backend.envios = [];
      const inicio = Date.now();
      const sincronizacion = app.motor.sincronizar();
      await jest.advanceTimersByTimeAsync(10 * 60_000);
      await sincronizacion;

      const intentos = backend.envios.map(t => t - inicio);
      const enElPrimerMinuto = intentos.filter(t => t < 60_000).length;
      const esperas = intentos.slice(1).map((t, i) => t - intentos[i]);
      tiempos['SPIKE-001 intentos en el primer minuto (servidor caido)'] = `${enElPrimerMinuto}`;
      tiempos['SPIKE-001 esperas entre intentos'] = esperas.map(e => `${(e / 1000).toFixed(1)} s`).join(', ');

      expect(intentos).toHaveLength(CONFIG_SINCRONIZACION.maxReintentos + 1);
      expect(enElPrimerMinuto).toBeLessThanOrEqual(10);
      // Cada espera esta entre la mitad y el total de 1 s, 2 s, 4 s, 8 s... (jitter).
      esperas.forEach((e, i) => {
        const base = Math.min(CONFIG_SINCRONIZACION.esperaInicialMs * 2 ** i, CONFIG_SINCRONIZACION.esperaMaximaMs);
        expect(e).toBeGreaterThanOrEqual(base / 2);
        expect(e).toBeLessThanOrEqual(base + 5);
      });
    } finally {
      jest.useRealTimers();
      backend.modo = 'normal';
    }
    await app.motor.sincronizar();
  });
});

describe('SPIKE-006: consulta offline y red intermitente', () => {
  test('con 100 fincas guardadas, la lista se lee sin conexion en menos de 2 s', async () => {
    redFalsa.cambiar({ isConnected: false });
    const total = (await app.registros.listar('FINCA')).length;
    for (let i = total; i < 100; i++) {
      await crearFinca(app, 1000 + i);
    }
    const inicio = performance.now();
    const lista = await app.registros.listar('FINCA');
    tiempos[`SPIKE-006 listar ${lista.length} fincas sin conexion`] = `${ms(inicio)} ms`;
    expect(lista.length).toBeGreaterThanOrEqual(100);
    expect(ms(inicio)).toBeLessThan(2000);
  });

  test('si la red se cae y vuelve 10 veces seguidas, cada operacion se envia una sola vez', async () => {
    redFalsa.cambiar({ isConnected: false });
    const nuevas = [await crearFinca(app, 2000), await crearFinca(app, 2001), await crearFinca(app, 2002)];
    let inicios = 0;
    const quitar = app.motor.suscribirse(e => {
      inicios += e.sincronizando ? 1 : 0;
    });
    backend.envios = [];
    const dejar = app.motor.iniciarAutomatica();
    for (let i = 0; i < 10; i++) {
      redFalsa.cambiar({ isConnected: true, isInternetReachable: true });
      redFalsa.cambiar({ isConnected: false });
    }
    redFalsa.cambiar({ isConnected: true, isInternetReachable: true });
    while (app.motor.haySincronizacionEnCurso()) {
      await new Promise(r => setTimeout(r, 5));
    }
    await new Promise(r => setTimeout(r, 50));
    dejar();
    quitar();

    nuevas.forEach(id => expect(backend.registros.get(id)).toBe(1));
    expect((await app.cola.contarPorEstado()).PENDIENTE).toBe(0);
    tiempos['SPIKE-006 11 reconexiones seguidas: sincronizaciones iniciadas'] = `${inicios}`;
    tiempos['SPIKE-006 11 reconexiones seguidas: envios POST /operaciones'] = `${backend.envios.length}`;
  });
});

describe('SPIKE-013 / SPIKE-019 / SPIKE-022: base local', () => {
  test('al reabrir la app el esquema no se vuelve a migrar y la version queda en 5', async () => {
    const fincas = (await app.registros.listar('FINCA')).length;
    app = abrirApp();
    await app.iniciar();
    expect((await app.registros.listar('FINCA')).length).toBe(fincas);
    const base = opSqlite.open({ name: 'agrotrack-cifrada.sqlite' });
    expect((await base.execute('PRAGMA user_version')).rows[0]).toEqual({ user_version: 5 });
  });

  test('si se pierde la clave del Keystore la app abre igual (base nueva) sin bloquearse', async () => {
    keychain.llavero.delete('agrotrack.base-datos');
    app = abrirApp();
    await expect(app.iniciar()).resolves.toBeUndefined();
    expect(await app.cola.contarPorEstado()).toEqual({ PENDIENTE: 0, SINCRONIZADO: 0, ERROR: 0 });
    expect(keychain.llavero.get('agrotrack.base-datos')?.password).toMatch(/^[0-9a-f]{64}$/);
  });
});
