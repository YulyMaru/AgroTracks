/**
 * Cliente HTTP y adaptadores hacia el backend (ADR-011, ADR-015, ADR-024): token en cada peticion,
 * renovacion silenciosa ante un 401 y errores convertidos en mensajes para el campesino.
 * La red es un servidor falso (pruebas/dobles.ts); los interceptores de axios son los reales.
 */
import axios from 'axios';

import {
  aErrorParaUsuario,
  api,
  configurarTokens,
  estadoHttp,
  mensajeHttp,
  registrarAlExpirarSesion,
} from '../src/compartido/infraestructura/http/clienteHttp';
import { ErrorParaUsuario } from '../src/compartido/dominio/errores';
import { apiAutenticacionHttp } from '../src/modulos/autenticacion/infraestructura/apiAutenticacionHttp';
import { servidorHttp } from '../src/modulos/sincronizacion/infraestructura/servidorHttp';
import {
  FalloTemporal,
  RechazoDelServidor,
  SesionExpirada,
  type OperacionPendiente,
} from '../src/modulos/sincronizacion/dominio/operacion';
import { servidorFalso, type Peticion, type Respuesta } from '../pruebas/dobles';

let responder: (p: Peticion) => Respuesta = () => ({ status: 200, data: {} });
const servidor = servidorFalso(p => responder(p));
api.defaults.adapter = servidor.adapter;
axios.defaults.adapter = servidor.adapter;

let tokens: { accessToken: string; refreshToken: string } | null = null;
const proveedor = {
  obtener: jest.fn(async () => tokens),
  guardarRenovados: jest.fn(async (nuevos: object) => { tokens = nuevos as typeof tokens; }),
  borrar: jest.fn(async () => { tokens = null; }),
};
configurarTokens(proveedor);
const alExpirar = jest.fn();
registrarAlExpirarSesion(alExpirar);

beforeEach(() => {
  servidor.peticiones.length = 0;
  tokens = { accessToken: 'viejo', refreshToken: 'renovar' };
  jest.clearAllMocks();
});

describe('cada peticion', () => {
  test('lleva el token y un idTraza para seguirla en los logs (ADR-021)', async () => {
    responder = () => ({ status: 200, data: { disponible: true } });
    await api.get('/api/v1/sincronizacion/estado');
    const { encabezados } = servidor.peticiones[0];
    expect(encabezados.Authorization).toBe('Bearer viejo');
    expect(String(encabezados['X-Trace-Id'])).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('las de autenticacion no llevan token', async () => {
    responder = () => ({ status: 200, data: {} });
    await api.post('/api/v1/autenticacion/inicio-sesion', {});
    expect(servidor.peticiones[0].encabezados.Authorization).toBeUndefined();
  });
});

describe('renovacion del token ante un 401', () => {
  test('renueva una vez y repite la peticion con el token nuevo, sin que el campesino lo note', async () => {
    responder = p => {
      if (p.ruta === '/api/v1/autenticacion/renovacion') {
        return { status: 200, data: { accessToken: 'nuevo', refreshToken: 'renovar-2' } };
      }
      return p.encabezados.Authorization === 'Bearer nuevo' ? { status: 200, data: 'ok' } : { status: 401 };
    };
    const { data } = await api.get('/api/v1/sincronizacion/cambios');
    expect(data).toBe('ok');
    expect(servidor.peticiones.map(p => p.ruta)).toEqual([
      '/api/v1/sincronizacion/cambios', '/api/v1/autenticacion/renovacion', '/api/v1/sincronizacion/cambios',
    ]);
    expect(servidor.peticiones[1].cuerpo).toEqual({ refreshToken: 'renovar' });
    expect(proveedor.guardarRenovados).toHaveBeenCalledWith({ accessToken: 'nuevo', refreshToken: 'renovar-2' });
  });

  test('si no se puede renovar, borra la sesion y avisa a la app que pida iniciar sesion', async () => {
    responder = () => ({ status: 401 });
    await expect(api.get('/api/v1/sincronizacion/cambios')).rejects.toMatchObject({ response: { status: 401 } });
    expect(proveedor.borrar).toHaveBeenCalled();
    expect(alExpirar).toHaveBeenCalled();
  });

  test('sin sesion guardada no intenta renovar', async () => {
    tokens = null;
    responder = () => ({ status: 401 });
    await expect(api.get('/api/v1/parametros')).rejects.toBeDefined();
    expect(servidor.peticiones).toHaveLength(1);
    expect(alExpirar).toHaveBeenCalled();
  });

  test('un 401 al iniciar sesion es clave incorrecta: no se renueva nada', async () => {
    responder = () => ({ status: 401, data: { codigo: 'NO_AUTENTICADO', mensaje: 'Usuario o clave incorrectos.', detalles: [] } });
    await expect(apiAutenticacionHttp.iniciarSesion('jose', 'mala')).rejects.toThrow('Usuario o clave incorrectos.');
    expect(servidor.peticiones).toHaveLength(1);
    expect(alExpirar).not.toHaveBeenCalled();
  });

  test('otros errores pasan tal cual', async () => {
    responder = () => ({ status: 500 });
    await expect(api.get('/api/v1/parametros')).rejects.toMatchObject({ response: { status: 500 } });
    expect(servidor.peticiones).toHaveLength(1);
  });
});

describe('mensajes de error para el campesino (ADR-024)', () => {
  const errorDe = async (r: Respuesta) => {
    responder = () => r;
    return api.get('/api/v1/parametros').catch((e: unknown) => e);
  };

  test('usa el mensaje del backend y sus detalles', async () => {
    const e = await errorDe({ status: 400, data: { codigo: 'DATOS_INVALIDOS', mensaje: 'Revisa los datos.', detalles: ['valor: debe ser positivo'] } });
    expect(mensajeHttp(e)).toBe('Revisa los datos. (valor: debe ser positivo)');
    expect(estadoHttp(e)).toBe(400);
    const sinDetalles = await errorDe({ status: 409, data: { codigo: 'CONFLICTO', mensaje: 'Otro celular lo cambio.', detalles: [] } });
    expect(mensajeHttp(sinDetalles)).toBe('Otro celular lo cambio.');
  });

  test('sin red o sin cuerpo da un mensaje claro', async () => {
    expect(mensajeHttp(await errorDe('SIN_RED'))).toBe('No hay conexión con el servidor.');
    expect(estadoHttp(await errorDe('SIN_RED'))).toBeUndefined();
    expect(mensajeHttp(await errorDe({ status: 503 }))).toBe('El servidor respondió 503.');
  });

  test('errores que no son de la red', () => {
    expect(mensajeHttp(new Error('algo'))).toBe('algo');
    expect(mensajeHttp('texto')).toBe('texto');
    expect(estadoHttp(new Error('x'))).toBeUndefined();
    const propio = new ErrorParaUsuario('Ya existe.');
    expect(aErrorParaUsuario(propio)).toBe(propio);
    expect(aErrorParaUsuario(new Error('x'))).toBeInstanceOf(ErrorParaUsuario);
  });
});

describe('autenticacion contra el backend', () => {
  test('registro, inicio y cierre de sesion', async () => {
    const respuesta = { accessToken: 'a', refreshToken: 'r', idUsuario: 'u', nombre: 'Ana' };
    responder = () => ({ status: 200, data: respuesta });
    expect(await apiAutenticacionHttp.registrar('ana@uco.edu.co', 'ana', 'Ana', 'clave1234')).toEqual(respuesta);
    expect(await apiAutenticacionHttp.iniciarSesion('ana', 'clave1234')).toEqual(respuesta);
    await apiAutenticacionHttp.cerrarSesion('r');
    expect(servidor.peticiones.map(p => [p.ruta, p.cuerpo])).toEqual([
      ['/api/v1/autenticacion/registro', { correo: 'ana@uco.edu.co', nombreUsuario: 'ana', nombre: 'Ana', clave: 'clave1234' }],
      ['/api/v1/autenticacion/inicio-sesion', { usuario: 'ana', clave: 'clave1234' }],
      ['/api/v1/autenticacion/cierre-sesion', { refreshToken: 'r' }],
    ]);
  });

  test('un registro rechazado muestra el motivo', async () => {
    responder = () => ({ status: 409, data: { codigo: 'CONFLICTO', mensaje: 'Ese correo ya esta registrado.', detalles: [] } });
    await expect(apiAutenticacionHttp.registrar('a@b.co', 'ana', 'Ana', 'clave1234')).rejects.toThrow('Ese correo ya esta registrado.');
  });
});

const operacion: OperacionPendiente = {
  idOperacion: 'op-1', entidad: 'FINCA', accion: 'CREAR', idRegistro: 'f1', versionBase: 0, contenido: { nombre: 'X' },
  creadoEn: '2026-10-01T00:00:00Z', estado: 'PENDIENTE', reintentos: 2, ultimoIntentoEn: 'x', mensajeError: 'y',
};

describe('sincronizacion contra el backend', () => {
  test('la conexion es estable solo si el backend responde que esta disponible', async () => {
    responder = () => ({ status: 200, data: { disponible: true } });
    expect(await servidorHttp.disponible()).toBe(true);
    responder = () => ({ status: 200, data: { disponible: false } });
    expect(await servidorHttp.disponible()).toBe(false);
    responder = () => 'SIN_RED';
    expect(await servidorHttp.disponible()).toBe(false);
  });

  test('envia solo los datos que espera el backend', async () => {
    responder = () => ({ status: 200, data: { resultados: [] } });
    expect(await servidorHttp.enviar([operacion])).toEqual({ resultados: [] });
    expect(servidor.peticiones[0].cuerpo).toEqual({
      operaciones: [{
        idOperacion: 'op-1', entidad: 'FINCA', accion: 'CREAR', idRegistro: 'f1', versionBase: 0,
        contenido: { nombre: 'X' }, creadoEn: '2026-10-01T00:00:00Z', reintentos: 2,
      }],
    });
  });

  test('cada error del envio se clasifica para que el motor sepa si reintentar (ADR-001)', async () => {
    const clase = async (r: Respuesta) => {
      responder = p => (p.ruta === '/api/v1/autenticacion/renovacion' ? { status: 401 } : r);
      return servidorHttp.enviar([operacion]).catch((e: unknown) => e);
    };
    expect(await clase({ status: 401 })).toBeInstanceOf(SesionExpirada);
    expect(await clase({ status: 400 })).toBeInstanceOf(RechazoDelServidor);
    expect(await clase({ status: 408 })).toBeInstanceOf(FalloTemporal);
    expect(await clase({ status: 429 })).toBeInstanceOf(FalloTemporal);
    expect(await clase({ status: 500 })).toBeInstanceOf(FalloTemporal);
    expect(await clase('SIN_RED')).toBeInstanceOf(FalloTemporal);
  });

  test('pide solo lo que cambio desde la ultima sincronizacion', async () => {
    responder = () => ({ status: 200, data: { fechaServidor: 'f', cambios: {} } });
    await servidorHttp.cambios('2026-10-01T00:00:00Z');
    await servidorHttp.cambios(null);
    expect(servidor.peticiones.map(p => p.params)).toEqual([{ desde: '2026-10-01T00:00:00Z' }, {}]);
    responder = () => ({ status: 200, data: null });
    expect(await servidorHttp.parametros(null)).toEqual([]);
    responder = () => ({ status: 200, data: [{ tipo: 'UNIDAD' }] });
    expect(await servidorHttp.parametros('2026-10-01')).toEqual([{ tipo: 'UNIDAD' }]);
  });
});
