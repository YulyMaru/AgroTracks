/**
 * Rendimiento de los calculos y de la base local con el volumen de los spikes:
 *
 *  - SPIKE-003 / SPIKE-014: resumen economico de 500 movimientos en < 300 ms y exacto.
 *  - SPIKE-008: deteccion de datos insuficientes (sin gastos, sin cosechas, unidades mezcladas) en
 *    < 100 ms para 500 registros.
 *  - SPIKE-009 / SPIKE-013: 10.000 gastos en el SQLite del celular: listar en <= 2 s y analizar el mes
 *    en <= 5 s.
 *
 * Los tiempos se miden en el PC donde corre Jest (Node + SQLite real), no en un celular de gama baja.
 */
import axios from 'axios';

import { api } from '../src/compartido/infraestructura/http/clienteHttp';
import { app } from '../src/composicion';
import {
  costoPorUnidad,
  gastosPorCategoria,
  porCadaMil,
  porCultivo,
  totales,
  ultimosMeses,
  type Cosecha,
  type Movimiento,
} from '../src/modulos/analisis/dominio/analisis';
import { servidorFalso } from '../pruebas/dobles';

jest.mock('@op-engineering/op-sqlite', () => require('../pruebas/dobles').opSqlite);
jest.mock('react-native-keychain', () => require('../pruebas/dobles').keychain);
jest.mock('@react-native-community/netinfo', () => ({ __esModule: true, default: require('../pruebas/dobles').redFalsa }));

jest.setTimeout(120_000);

const servidor = servidorFalso(() => 'SIN_RED');
api.defaults.adapter = servidor.adapter;
axios.defaults.adapter = servidor.adapter;

const tiempos: Record<string, string> = {};
afterAll(() => {
  const filas = Object.entries(tiempos).map(([k, v]) => `  ${k.padEnd(64)} ${v}`).join('\n');
  console.log(`\n=== Mediciones de rendimiento (movil, Jest en el PC) ===\n${filas}\n`);
});

/** Promedio de varias corridas, para no medir una sola vez en frio. */
function medir<T>(nombre: string, trabajo: () => T, veces = 20): { resultado: T; ms: number } {
  trabajo();
  let resultado!: T;
  const inicio = performance.now();
  for (let i = 0; i < veces; i++) {
    resultado = trabajo();
  }
  const ms = (performance.now() - inicio) / veces;
  tiempos[nombre] = `${ms.toFixed(3)} ms`;
  return { resultado, ms };
}

function movimientos(n: number): Movimiento[] {
  return Array.from({ length: n }, (_, i) => ({
    fecha: `2026-${String(1 + (i % 10)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
    tipo: i % 3 === 0 ? 'INGRESO' : 'GASTO',
    valor: 1_000 + i,
    categoria: i % 3 === 0 ? 'VENTA' : ['MANO_DE_OBRA', 'TRANSPORTE', 'ABONOS_Y_SEMILLAS'][i % 3],
    idCultivo: `cultivo-${i % 50}`,
    idLote: `lote-${i % 20}`,
    idFinca: `finca-${i % 5}`,
    descripcion: '',
  }));
}

describe('SPIKE-003 / SPIKE-014: resumen economico', () => {
  test('500 movimientos: totales exactos y en menos de 300 ms', () => {
    const lista = movimientos(500);
    const esperado = { ingresos: 0, gastos: 0 };
    lista.forEach(m => { esperado[m.tipo === 'INGRESO' ? 'ingresos' : 'gastos'] += m.valor; });

    const { resultado, ms } = medir('SPIKE-003 resumen (totales, categorias, cultivos, 6 meses) de 500', () => ({
      t: totales(lista), c: gastosPorCategoria(lista), p: porCultivo(lista), m: ultimosMeses(lista, '2026-10', 6),
    }));
    expect(resultado.t).toEqual({ ...esperado, balance: esperado.ingresos - esperado.gastos });
    expect(resultado.c.reduce((s, c) => s + c.valor, 0)).toBe(esperado.gastos);
    expect(ms).toBeLessThan(300);
  });

  test('10.000 movimientos: resumen en menos de 5 s', () => {
    const lista = movimientos(10_000);
    const { ms } = medir('SPIKE-009 resumen de 10.000 movimientos (funciones puras)', () => ({
      t: totales(lista), c: gastosPorCategoria(lista), p: porCultivo(lista), m: ultimosMeses(lista, '2026-10', 6),
    }), 5);
    expect(ms).toBeLessThan(5_000);
  });
});

describe('SPIKE-008: datos insuficientes para el analisis', () => {
  test('detecta en todos los casos cuando falta informacion y no inventa resultados', () => {
    expect(porCadaMil({ ingresos: 500_000, gastos: 0, balance: 500_000 })).toBeNull();
    expect(porCadaMil({ ingresos: 0, gastos: 0, balance: 0 })).toBeNull();
    expect(porCadaMil({ ingresos: 0, gastos: 100_000, balance: -100_000 })).toBe(0);
    const kilo: Cosecha = { fecha: '2026-10-01', idCultivo: 'c', cantidad: 10, unidad: 'KILOGRAMO' };
    expect(costoPorUnidad(100_000, [])).toBeNull();
    expect(costoPorUnidad(0, [kilo])).toBeNull();
    expect(costoPorUnidad(100_000, [kilo, { ...kilo, unidad: 'ARROBA' }])).toBeNull();
    expect(costoPorUnidad(100_000, [kilo])).toEqual({ unidad: 'KILOGRAMO', valor: 10_000 });
  });

  test('la revision de 500 registros tarda menos de 100 ms', () => {
    const lista = movimientos(500);
    const cosechas: Cosecha[] = lista.map((m, i) => ({ fecha: m.fecha, idCultivo: m.idCultivo, cantidad: 1 + i, unidad: 'KILOGRAMO' }));
    const { ms } = medir('SPIKE-008 revisar datos insuficientes de 500 registros', () =>
      porCultivo(lista).map(c => ({
        porCadaMil: porCadaMil(c),
        costo: costoPorUnidad(c.gastos, cosechas.filter(x => x.idCultivo === c.idCultivo)),
      })));
    expect(ms).toBeLessThan(100);
  });
});

describe('SPIKE-009 / SPIKE-013: 10.000 gastos en el SQLite del celular', () => {
  test('guardar, listar y analizar con el volumen maximo', async () => {
    await app.iniciar();
    const mes = app.analisis.mesActual();
    const finca = await app.registros.crear('FINCA', { nombre: 'La Grande', municipio: 'Rionegro', vereda: 'Abreo' });

    const inicioGuardar = performance.now();
    for (let i = 0; i < 10_000; i++) {
      await app.registros.crear('GASTO', {
        fecha: `${mes}-01`, categoria: 'MANO_DE_OBRA', concepto: `Jornal ${i}`, valor: 50_000,
        nivelAsignacion: 'FINCA', idAsignacion: finca,
      });
    }
    tiempos['SPIKE-013 guardar 10.000 gastos (promedio por gasto)'] =
      `${((performance.now() - inicioGuardar) / 10_000).toFixed(3)} ms`;

    let inicio = performance.now();
    const lista = await app.registros.listar('GASTO');
    const msListar = performance.now() - inicio;
    tiempos['SPIKE-013 listar 10.000 gastos (sin paginar)'] = `${msListar.toFixed(1)} ms`;
    expect(lista).toHaveLength(10_000);
    expect(msListar).toBeLessThan(2_000);

    inicio = performance.now();
    const vista = await app.analisis.analizar(mes);
    const msAnalizar = performance.now() - inicio;
    tiempos['SPIKE-013 analizar el mes con 10.000 gastos (SQLite + calculo)'] = `${msAnalizar.toFixed(1)} ms`;
    expect(vista.totales.gastos).toBe(10_000 * 50_000);
    expect(msAnalizar).toBeLessThan(5_000);

    inicio = performance.now();
    expect((await app.cola.contarPorEstado()).PENDIENTE).toBe(10_001);
    tiempos['SPIKE-013 contar la cola de 10.001 pendientes'] = `${(performance.now() - inicio).toFixed(1)} ms`;
  });
});
