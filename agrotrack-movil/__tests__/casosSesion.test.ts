/**
 * Casos de uso de sesion (ADR-011, HU-44): los datos del celular pertenecen a una sola cuenta y no
 * se pierden registros sin enviar al cambiar de cuenta.
 */
import { crearCasosSesion } from '../src/modulos/autenticacion/aplicacion/casosDeUso';
import type { Tokens } from '../src/modulos/autenticacion/dominio/sesion';

const tokens = (idUsuario: string): Tokens =>
  ({ accessToken: `acceso-${idUsuario}`, refreshToken: `renovar-${idUsuario}`, idUsuario, nombre: 'José' });

function preparar(celular: { cuenta: string | null; sinEnviar?: number; hayDatos?: boolean; guardada?: Tokens | null }) {
  let guardada: Tokens | null = celular.guardada ?? null;
  let cuenta = celular.cuenta;
  const almacen = {
    guardar: jest.fn(async (t: Tokens) => { guardada = t; }),
    obtener: jest.fn(async () => guardada),
    borrar: jest.fn(async () => { guardada = null; }),
  };
  const api = {
    registrar: jest.fn(async () => tokens('nueva')),
    iniciarSesion: jest.fn(async (usuario: string) => tokens(usuario)),
    cerrarSesion: jest.fn(async () => {}),
  };
  const datos = {
    cuentaActual: jest.fn(async () => cuenta),
    fijarCuenta: jest.fn(async (id: string) => { cuenta = id; }),
    registrosSinEnviar: jest.fn(async () => celular.sinEnviar ?? 0),
    hayDatosLocales: jest.fn(async () => celular.hayDatos ?? false),
    limpiar: jest.fn(async () => {}),
  };
  return { casos: crearCasosSesion({ almacen, api, datos }), almacen, api, datos, cuenta: () => cuenta };
}

describe('iniciar sesion', () => {
  test('la misma cuenta entra sin tocar sus datos', async () => {
    const p = preparar({ cuenta: 'jose', hayDatos: true, sinEnviar: 3 });
    expect(await p.casos.iniciarSesion('jose', 'clave1234')).toEqual(tokens('jose'));
    expect(p.datos.limpiar).not.toHaveBeenCalled();
    expect(p.almacen.guardar).toHaveBeenCalledWith(tokens('jose'));
  });

  test('otra cuenta NO entra si quedan registros sin enviar de la anterior', async () => {
    const p = preparar({ cuenta: 'jose', hayDatos: true, sinEnviar: 2 });
    await expect(p.casos.iniciarSesion('ana', 'clave1234')).rejects.toThrow('2 registro(s) de otra cuenta');
    expect(p.almacen.guardar).not.toHaveBeenCalled();
    expect(p.cuenta()).toBe('jose');
  });

  test('otra cuenta entra si todo ya se envio: se limpia la copia local', async () => {
    const p = preparar({ cuenta: 'jose', hayDatos: true, sinEnviar: 0 });
    await p.casos.iniciarSesion('ana', 'clave1234');
    expect(p.datos.limpiar).toHaveBeenCalled();
    expect(p.cuenta()).toBe('ana');
  });

  test('registrarse entra con la cuenta nueva', async () => {
    const p = preparar({ cuenta: null });
    const t = await p.casos.registrarse({ correo: 'ana@uco.edu.co', nombreUsuario: 'ana', nombre: 'Ana', clave: 'clave1234' });
    expect(p.api.registrar).toHaveBeenCalledWith('ana@uco.edu.co', 'ana', 'Ana', 'clave1234');
    expect(t.idUsuario).toBe('nueva');
    expect(p.cuenta()).toBe('nueva');
  });

  test('si el servidor rechaza la clave, no se guarda nada', async () => {
    const p = preparar({ cuenta: null });
    p.api.iniciarSesion.mockRejectedValue(new Error('Clave incorrecta'));
    await expect(p.casos.iniciarSesion('jose', 'mala')).rejects.toThrow('Clave incorrecta');
    expect(p.almacen.guardar).not.toHaveBeenCalled();
  });
});

describe('sesion guardada y cierre', () => {
  test('con sesion guardada se puede trabajar sin internet', async () => {
    const p = preparar({ cuenta: 'jose', guardada: tokens('jose') });
    expect(await p.casos.sesionGuardada()).toEqual(tokens('jose'));
    expect(await p.casos.haySesion()).toBe(true);
  });

  test('una sesion de una version anterior anota a que cuenta pertenecen los datos', async () => {
    const p = preparar({ cuenta: null, guardada: tokens('jose') });
    await p.casos.sesionGuardada();
    expect(p.cuenta()).toBe('jose');
  });

  test('cerrar sesion borra los tokens aunque el servidor no responda', async () => {
    const p = preparar({ cuenta: 'jose', guardada: tokens('jose'), sinEnviar: 1 });
    p.api.cerrarSesion.mockRejectedValue(new Error('sin internet'));
    expect(await p.casos.registrosSinEnviar()).toBe(1);
    await p.casos.cerrarSesion();
    expect(p.api.cerrarSesion).toHaveBeenCalledWith('renovar-jose');
    expect(await p.casos.haySesion()).toBe(false);
    expect(await p.casos.sesionGuardada()).toBeNull();
  });

  test('cerrar sesion sin sesion guardada no llama al servidor', async () => {
    const p = preparar({ cuenta: null });
    await p.casos.cerrarSesion();
    expect(p.api.cerrarSesion).not.toHaveBeenCalled();
    expect(p.almacen.borrar).toHaveBeenCalled();
  });
});
