/**
 * Reglas del dominio para editar y eliminar sin conexion. Son funciones puras: se prueban sin
 * celular, sin SQLite y sin servidor (es lo que permite la arquitectura hexagonal).
 */
import { planEdicion, planEliminacion, type CambioSinEnviar } from '../src/modulos/registros/dominio/reglas';

const crear: CambioSinEnviar = { idOperacion: 'op-1', accion: 'CREAR', versionBase: 0 };
const editar = (id: string, versionBase: number): CambioSinEnviar => ({ idOperacion: id, accion: 'EDITAR', versionBase });

describe('editar', () => {
  test('sin cambios pendientes se encola una edicion con la version actual', () => {
    expect(planEdicion([], 3)).toEqual({ tipo: 'ENCOLAR', version: 4, versionBase: 3 });
  });

  test('un registro que aun no llega al servidor se corrige en su CREAR (queda en version 1)', () => {
    expect(planEdicion([crear, editar('op-2', 1)], 2))
      .toEqual({ tipo: 'FUSIONAR', version: 1, enOperacion: 'op-1', quitar: ['op-2'] });
  });

  test('varias ediciones sin enviar se juntan en la primera', () => {
    expect(planEdicion([editar('op-5', 4), editar('op-6', 5)], 6))
      .toEqual({ tipo: 'FUSIONAR', version: 5, enOperacion: 'op-5', quitar: ['op-6'] });
  });
});

describe('eliminar', () => {
  test('si nunca llego al servidor se borra del celular sin enviar nada', () => {
    expect(planEliminacion([crear], 1)).toEqual({ tipo: 'BORRAR_DEL_CELULAR', quitar: ['op-1'] });
  });

  test('si ya estaba en el servidor se encola con la version que el servidor conoce', () => {
    expect(planEliminacion([], 2)).toEqual({ tipo: 'ENCOLAR', versionBase: 2, quitar: [] });
    expect(planEliminacion([editar('op-7', 2)], 3)).toEqual({ tipo: 'ENCOLAR', versionBase: 2, quitar: ['op-7'] });
  });
});
