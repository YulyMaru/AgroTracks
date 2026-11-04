/** Validaciones de la cuenta del campesino: funciones puras del dominio. */
import { correoValido, limpiarNombreUsuario, nombreUsuarioValido } from '../src/modulos/autenticacion/dominio/sesion';

describe('correoValido', () => {
  test('acepta correos normales', () => {
    expect(correoValido('jose.perez@gmail.com')).toBe(true);
    expect(correoValido('  ana@uco.edu.co ')).toBe(true);
  });

  test('rechaza correos incompletos o con espacios', () => {
    expect(correoValido('')).toBe(false);
    expect(correoValido('jose')).toBe(false);
    expect(correoValido('@gmail.com')).toBe(false);
    expect(correoValido('jose@')).toBe(false);
    expect(correoValido('jose@.com')).toBe(false);
    expect(correoValido('jose@gmail')).toBe(false);
    expect(correoValido('jose@gmail.')).toBe(false);
    expect(correoValido('jose perez@gmail.com')).toBe(false);
  });

  test('un texto muy largo se revisa rapido', () => {
    const largo = 'a@'.repeat(20000);
    const inicio = Date.now();
    expect(correoValido(largo)).toBe(false);
    expect(Date.now() - inicio).toBeLessThan(500);
  });
});

describe('nombre de usuario', () => {
  test('acepta de 3 a 30 caracteres permitidos', () => {
    expect(nombreUsuarioValido('jose.perez')).toBe(true);
    expect(nombreUsuarioValido('ana_1')).toBe(true);
  });

  test('rechaza nombres cortos, con espacios o que empiezan por punto', () => {
    expect(nombreUsuarioValido('jo')).toBe(false);
    expect(nombreUsuarioValido('.jose')).toBe(false);
    expect(nombreUsuarioValido('jose perez')).toBe(false);
  });

  test('lo que se escribe queda en minusculas y sin espacios', () => {
    expect(limpiarNombreUsuario('Jose Perez')).toBe('joseperez');
  });
});
