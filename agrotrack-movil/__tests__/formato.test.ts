/** Lectura y escritura de pesos como los escribe un campesino en Colombia (ADR-010). */
import { escribirPesos, leerNumero } from '../src/compartido/dominio/formato';

describe('escribirPesos', () => {
  test('pone un punto cada tres digitos desde la derecha', () => {
    expect(escribirPesos('1200000')).toBe('1.200.000');
    expect(escribirPesos('50000')).toBe('50.000');
    expect(escribirPesos('999')).toBe('999');
    expect(escribirPesos('1000')).toBe('1.000');
  });

  test('ignora lo que no es digito y los ceros a la izquierda', () => {
    expect(escribirPesos('$ 1.2a00')).toBe('1.200');
    expect(escribirPesos('000450')).toBe('450');
    expect(escribirPesos('0')).toBe('0');
    expect(escribirPesos('')).toBe('');
  });

  test('un texto muy largo se formatea rapido', () => {
    const largo = '9'.repeat(5000);
    const inicio = Date.now();
    expect(escribirPesos(largo).replace(/\./g, '')).toBe(largo);
    expect(Date.now() - inicio).toBeLessThan(500);
  });
});

describe('leerNumero', () => {
  test('lee pesos con puntos de miles y decimales con coma', () => {
    expect(leerNumero('50.000')).toBe(50000);
    expect(leerNumero('$ 1.200.000')).toBe(1200000);
    expect(leerNumero('2,5')).toBe(2.5);
  });

  test('rechaza lo que no es un numero mayor que cero', () => {
    expect(leerNumero('abc')).toBeNull();
    expect(leerNumero('0')).toBeNull();
    expect(leerNumero('')).toBeNull();
  });
});
