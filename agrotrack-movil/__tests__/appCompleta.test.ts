/**
 * La app completa, conectada por src/composicion.ts, con SQLite, Keychain, red y servidor de prueba
 * (pruebas/dobles.ts). Recorre el dia de un campesino: entra, se queda sin senal, anota, mira sus
 * cuentas, vuelve la senal y todo llega al servidor (ADR-001, ADR-005, ADR-006, ADR-007, HU-22 a HU-25).
 */
import axios from 'axios';

import { api } from '../src/compartido/infraestructura/http/clienteHttp';
import { generadorUuid } from '../src/compartido/infraestructura/ids/generadorUuid';
import { app } from '../src/composicion';
import { keychain, redFalsa, servidorFalso, type Peticion, type Respuesta } from '../pruebas/dobles';

jest.mock('@op-engineering/op-sqlite', () => require('../pruebas/dobles').opSqlite);
jest.mock('react-native-keychain', () => require('../pruebas/dobles').keychain);
jest.mock('@react-native-community/netinfo', () => ({ __esModule: true, default: require('../pruebas/dobles').redFalsa }));

const TOKENS = { accessToken: 'acceso-1', refreshToken: 'renovar-1', idUsuario: 'jose', nombre: 'José' };

/** Backend de prueba: acepta todo lo que llega y devuelve una finca hecha en otro celular. */
function backend(p: Peticion): Respuesta {
  switch (p.ruta) {
    case '/api/v1/autenticacion/inicio-sesion':
      return { status: 200, data: TOKENS };
    case '/api/v1/autenticacion/cierre-sesion':
      return { status: 204 };
    case '/api/v1/sincronizacion/estado':
      return { status: 200, data: { disponible: true } };
    case '/api/v1/sincronizacion/operaciones': {
      const { operaciones } = p.cuerpo as { operaciones: { idOperacion: string }[] };
      return {
        status: 200,
        data: { resultados: operaciones.map(o => ({ idOperacion: o.idOperacion, estado: 'SINCRONIZADO', versionActual: 1, mensaje: '', detalles: [] })) },
      };
    }
    case '/api/v1/sincronizacion/cambios':
      return {
        status: 200,
        data: {
          fechaServidor: '2026-11-04T12:00:00Z',
          cambios: { FINCA: [{ id: 'otra', nombre: 'El Retiro', municipio: 'Marinilla', vereda: 'X', version: 1, eliminado: false, actualizadoEn: '2026-11-01' }] },
        },
      };
    case '/api/v1/parametros':
      return { status: 200, data: [{ tipo: 'UNIDAD', codigo: 'ARROBA', etiqueta: 'Arroba', orden: 1, activo: true }] };
    default:
      return { status: 404 };
  }
}

const servidor = servidorFalso(backend);
api.defaults.adapter = servidor.adapter;
axios.defaults.adapter = servidor.adapter;

test('ids nuevos: UUID distintos para cada registro', () => {
  const a = generadorUuid.nuevo();
  expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(generadorUuid.nuevo()).not.toBe(a);
});

test('un dia de trabajo: anotar sin senal y sincronizar cuando vuelve', async () => {
  await app.iniciar();

  // 1. Entra con su cuenta: la sesion queda en el Keystore, no en SQLite (ADR-011)
  await app.sesion.iniciarSesion('jose', 'clave1234');
  expect(keychain.llavero.has('agrotrack.sesion')).toBe(true);
  expect(await app.sesion.haySesion()).toBe(true);

  // 2. Se queda sin senal y anota en la finca (ADR-005)
  redFalsa.cambiar({ isConnected: false });
  const mes = app.analisis.mesActual();
  const finca = await app.registros.crear('FINCA', { nombre: 'La Esperanza', municipio: 'Rionegro', vereda: 'El Tablazo' });
  const lote = await app.registros.crear('LOTE', { idFinca: finca, nombre: 'Lote alto', area: 2, unidadArea: 'HECTAREA' });
  const cultivo = await app.registros.crear('CULTIVO', { idLote: lote, tipoCultivo: 'CAFE', especie: 'Castillo', fechaSiembra: '2025-03-01' });
  await app.registros.crear('VENTA', { idCultivo: cultivo, fecha: `${mes}-01`, cantidad: 100, unidad: 'KILOGRAMO', valorTotal: 1_200_000 });
  await app.registros.crear('GASTO', { fecha: `${mes}-01`, categoria: 'MANO_DE_OBRA', concepto: 'Desyerba', valor: 300_000, nivelAsignacion: 'CULTIVO', idAsignacion: cultivo });
  expect(await app.cola.contarPorEstado()).toEqual({ PENDIENTE: 5, SINCRONIZADO: 0, ERROR: 0 });
  expect((await app.registros.listar('FINCA'))[0]).toMatchObject({ envio: 'PENDIENTE' });

  // 3. Sin senal igual puede mirar sus cuentas: el analisis lee lo guardado en el celular
  const plata = await app.analisis.analizar(mes);
  expect(plata.totales).toEqual({ ingresos: 1_200_000, gastos: 300_000, balance: 900_000 });
  expect(plata.ultimos.map(u => u.titulo)).toContain('Venta de Café Castillo · Lote alto (La Esperanza)');
  expect(plata.ultimos.find(u => u.esVenta)?.detalle).toContain('Venta de cosecha');
  // Sin cosechas anotadas no hay costo por kilo: la app no lo inventa
  expect((await app.analisis.lugares()).fichas[0]).toMatchObject({
    nombre: 'Café Castillo', lugar: 'Lote alto · La Esperanza', porCadaMil: 4000, costo: null,
  });

  // 4. Sin senal, sincronizar no envia nada y los datos siguen en el celular
  expect((await app.motor.sincronizar()).desenlace).toBe('SIN_CONEXION');
  expect(servidor.peticiones.some(p => p.ruta === '/api/v1/sincronizacion/operaciones')).toBe(false);

  // 5. Vuelve la senal: la deteccion automatica sincroniza sola (ADR-006)
  let resultado: unknown;
  const dejarDeEscuchar = app.motor.iniciarAutomatica();
  const termino = new Promise<void>(resolver => {
    const quitar = app.motor.suscribirse(estado => {
      if (estado.ultimo?.desenlace === 'COMPLETADA') {
        resultado = estado.ultimo;
        quitar();
        resolver();
      }
    });
  });
  redFalsa.cambiar({ isConnected: true, isInternetReachable: true });
  await termino;
  dejarDeEscuchar();
  expect(resultado).toMatchObject({ desenlace: 'COMPLETADA', sincronizadas: 5, conError: 0 });

  // El envio lleva el token y respeta el orden: la finca antes que su lote y su cultivo
  const envio = servidor.peticiones.find(p => p.ruta === '/api/v1/sincronizacion/operaciones')!;
  expect(envio.encabezados.Authorization).toBe('Bearer acceso-1');
  expect((envio.cuerpo as { operaciones: { entidad: string }[] }).operaciones.map(o => o.entidad))
    .toEqual(['FINCA', 'LOTE', 'CULTIVO', 'VENTA', 'GASTO']);

  // 6. Todo quedo SINCRONIZADO y llego lo nuevo del servidor (HU-24)
  expect(await app.cola.contarPorEstado()).toEqual({ PENDIENTE: 0, SINCRONIZADO: 5, ERROR: 0 });
  expect((await app.registros.listar('FINCA')).map(f => [f.datos.nombre, f.envio]))
    .toEqual([['El Retiro', 'SINCRONIZADO'], ['La Esperanza', 'SINCRONIZADO']]);
  expect(await app.registros.listarParametros('UNIDAD')).toEqual([{ tipo: 'UNIDAD', codigo: 'ARROBA', etiqueta: 'Arroba' }]);

  // 7. Recuerda lo ultimo que eligio y cierra la sesion
  await app.preferencias.recordar('finca', finca);
  expect(await app.preferencias.leer('finca')).toBe(finca);
  await app.sesion.cerrarSesion();
  expect(await app.sesion.haySesion()).toBe(false);
  expect(app.mensajeDeError(new Error('x'))).toContain('x');
});
