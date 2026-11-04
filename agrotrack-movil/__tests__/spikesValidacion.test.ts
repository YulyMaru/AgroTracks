/**
 * SPIKE-002 / SPIKE-005 / SPIKE-014 (ADR-002): reglas de validacion de los formularios.
 *
 *  - Cada regla da un mensaje del campo con la accion a realizar, sin internet (funciones puras).
 *  - Validar un formulario de 3 campos tarda menos de 50 ms.
 *  - Contrato con el backend: los largos maximos y los decimales que usan los formularios son los
 *    mismos que exige el backend (backend/.../RegistrosDatos.java). Si alguien cambia uno sin el otro,
 *    esta prueba falla.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

import { elegido, fecha, numero, pesos, texto } from '../src/compartido/dominio/validacion';

const RAIZ = join(__dirname, '..');
const JAVA = join(RAIZ, '..', 'backend', 'src', 'main', 'java', 'co', 'edu', 'uco', 'agrotrack', 'modulos',
  'registros', 'aplicacion', 'puerto', 'entrada', 'RegistrosDatos.java');

describe('reglas y mensajes', () => {
  test('cada regla acepta lo valido y rechaza lo invalido con un mensaje que dice que hacer', () => {
    expect(texto('La Esperanza', 'Escribe el nombre de la finca.', 120)).toBeUndefined();
    expect(texto('   ', 'Escribe el nombre de la finca.', 120)).toBe('Escribe el nombre de la finca.');
    expect(texto('x'.repeat(121), 'Escribe el nombre de la finca.', 120)).toBe('Escribe máximo 120 letras.');

    expect(elegido('HECTAREA', 'Elige en qué se mide el tamaño.')).toBeUndefined();
    expect(elegido(undefined, 'Elige en qué se mide el tamaño.')).toBe('Elige en qué se mide el tamaño.');

    const hoy = new Date().toISOString().slice(0, 10);
    expect(fecha(hoy)).toBeUndefined();
    expect(fecha('2999-01-01')).toBe('Elige la fecha. No puede ser una fecha futura.');
    expect(fecha('')).toBe('Elige la fecha. No puede ser una fecha futura.');

    const mensaje = 'Escribe la cantidad (un número mayor que cero).';
    expect(numero('12,5', mensaje, 3)).toBeUndefined();
    expect(numero('0', mensaje, 3)).toBe(mensaje);
    expect(numero('-4', mensaje, 3)).toBe(mensaje);
    expect(numero('abc', mensaje, 3)).toBe(mensaje);
    expect(numero('1,2345', mensaje, 3)).toBe('Usa máximo 3 decimales.');

    expect(pesos('1.200.000', 'Escribe cuánto costó.')).toBeUndefined();
    expect(pesos('1200,50', 'Escribe cuánto costó.')).toBe('Escribe solo números enteros, sin centavos ni decimales.');
    expect(pesos('1.000.000.000.000', 'Escribe cuánto costó.')).toBe('Escribe cuánto costó.');
  });

  test('corregir un campo no toca los demas: cada regla mira solo su propio dato', () => {
    const formulario = { nombre: '', municipio: 'Rionegro', vereda: 'El Tablazo' };
    const reglas = (f: typeof formulario) => ({
      nombre: texto(f.nombre, 'Escribe el nombre de la finca.', 120),
      municipio: texto(f.municipio, 'Escribe el municipio donde está la finca.', 80),
      vereda: texto(f.vereda, 'Escribe la vereda donde está la finca.', 80),
    });
    expect(reglas(formulario)).toEqual({ nombre: 'Escribe el nombre de la finca.', municipio: undefined, vereda: undefined });
    const corregido = { ...formulario, nombre: 'La Esperanza' };
    expect(Object.values(reglas(corregido)).filter(Boolean)).toHaveLength(0);
    expect(corregido.municipio).toBe('Rionegro');
  });
});

test('validar 3 campos tarda menos de 50 ms (promedio de 1.000 veces)', () => {
  const inicio = performance.now();
  for (let i = 0; i < 1000; i++) {
    texto('La Esperanza', 'Escribe el nombre.', 120);
    numero('2,5', 'Escribe el tamaño.', 4);
    pesos('1.200.000', 'Escribe cuánto costó.');
  }
  const promedio = (performance.now() - inicio) / 1000;
  console.log(`SPIKE-002 validar 3 campos: ${promedio.toFixed(4)} ms en promedio`);
  expect(promedio).toBeLessThan(50);
});

describe('contrato con el backend (las mismas restricciones en los dos lados)', () => {
  const formularios = readFileSync(join(RAIZ, 'src', 'pantallas', 'Formularios.tsx'), 'utf8');
  const java = readFileSync(JAVA, 'utf8');

  test('los largos maximos de los textos son los del backend', () => {
    const enMovil = [...formularios.matchAll(/(\w+): texto\(\w+, [^\n]*?, (\d+)\)/g)].map(m => [m[1], Number(m[2])]);
    expect(enMovil.length).toBeGreaterThanOrEqual(7);
    const enBackend = new Map<string, Set<number>>();
    for (const m of java.matchAll(/@Size\(max = (\d+)\) String (\w+)/g)) {
      enBackend.set(m[2], (enBackend.get(m[2]) ?? new Set()).add(Number(m[1])));
    }
    for (const [campo, maximo] of enMovil) {
      expect([campo, enBackend.get(campo as string)?.has(maximo as number)]).toEqual([campo, true]);
    }
  });

  test('los decimales permitidos son los del backend', () => {
    const enMovil = [...formularios.matchAll(/(\w+): numero\(\w+(?:\.\w+)?, [^\n]*?, (\d+)[,)]/g)]
      .map(m => [m[1], Number(m[2])]);
    expect(enMovil.length).toBeGreaterThanOrEqual(3);
    const enBackend = new Map<string, Set<number>>();
    for (const m of java.matchAll(/fraction = (\d+)\) BigDecimal (\w+)/g)) {
      enBackend.set(m[2], (enBackend.get(m[2]) ?? new Set()).add(Number(m[1])));
    }
    // Los enteros del backend (Integer, Long) no admiten decimales.
    for (const m of java.matchAll(/(?:Integer|Long) (\w+)[,)]/g)) {
      enBackend.set(m[1], (enBackend.get(m[1]) ?? new Set()).add(0));
    }
    for (const [campo, decimales] of enMovil) {
      expect([campo, enBackend.get(campo as string)?.has(decimales as number)]).toEqual([campo, true]);
    }
  });
});
