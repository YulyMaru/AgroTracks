/** Calculos del analisis de cuentas: funciones puras del dominio, sin celular ni base de datos. */
import {
  agrupar,
  cosechaDelMes,
  costoPorUnidad,
  gastosPorCategoria,
  insumosUsados,
  porCadaMil,
  tiempoDeTrabajo,
  mesAnterior,
  mesSiguiente,
  porCultivo,
  totales,
  ultimosMeses,
  type Cosecha,
  type Labor,
  type Movimiento,
} from '../src/modulos/analisis/dominio/analisis';
import { cantidadConUnidad } from '../src/compartido/dominio/formato';

/** El cafe esta en el lote alto y el platano en el bajo; los dos en la finca La Esperanza. */
const LOTES: Record<string, string> = { cafe: 'alto', platano: 'bajo' };
const m = (fecha: string, tipo: Movimiento['tipo'], valor: number, categoria: string, idCultivo = '', idLote = LOTES[idCultivo] ?? ''): Movimiento =>
  ({ fecha, tipo, valor, categoria, idCultivo, idLote, idFinca: 'esperanza', descripcion: '' });

const movimientos: Movimiento[] = [
  m('2026-10-02', 'INGRESO', 1_200_000, 'VENTA', 'cafe'),
  m('2026-10-05', 'GASTO', 300_000, 'MANO_DE_OBRA', 'cafe'),
  m('2026-10-09', 'GASTO', 100_000, 'TRANSPORTE'),
  m('2026-10-15', 'GASTO', 200_000, 'MANO_DE_OBRA'),
  m('2026-09-20', 'GASTO', 50_000, 'ABONOS_Y_SEMILLAS', 'platano'),
  m('2026-09-21', 'GASTO', 30_000, 'HERRAMIENTAS_Y_EQUIPO', '', 'alto'),
];

test('lo que entro, lo que salio y lo que queda', () => {
  expect(totales(movimientos.filter(x => x.fecha.startsWith('2026-10'))))
    .toEqual({ ingresos: 1_200_000, gastos: 600_000, balance: 600_000 });
});

test('en que se va la plata: por categoria, de mayor a menor, con porcentaje', () => {
  expect(gastosPorCategoria(movimientos.filter(x => x.fecha.startsWith('2026-10')))).toEqual([
    { categoria: 'MANO_DE_OBRA', valor: 500_000, porcentaje: 83 },
    { categoria: 'TRANSPORTE', valor: 100_000, porcentaje: 17 },
  ]);
});

test('que cultivo deja mas: ventas menos gastos asignados a el', () => {
  expect(porCultivo(movimientos)).toEqual([
    { idCultivo: 'cafe', ingresos: 1_200_000, gastos: 300_000, balance: 900_000 },
    { idCultivo: 'platano', ingresos: 0, gastos: 50_000, balance: -50_000 },
  ]);
});

test('mes a mes, incluido el cambio de año', () => {
  expect(mesAnterior('2026-01')).toBe('2025-12');
  expect(mesSiguiente('2026-12')).toBe('2027-01');
  expect(ultimosMeses(movimientos, '2026-10', 3).map(x => [x.mes, x.gastos]))
    .toEqual([['2026-08', 0], ['2026-09', 80_000], ['2026-10', 600_000]]);
});

test('que lote y que finca dejan mas: el lote suma lo de sus cultivos', () => {
  expect(agrupar(movimientos, 'idLote')).toEqual([
    { id: 'alto', ingresos: 1_200_000, gastos: 330_000, balance: 870_000 },
    { id: 'bajo', ingresos: 0, gastos: 50_000, balance: -50_000 },
  ]);
  expect(agrupar(movimientos, 'idFinca')).toEqual([
    { id: 'esperanza', ingresos: 1_200_000, gastos: 680_000, balance: 520_000 },
  ]);
});

test('por cada $1.000 que gasto, cuanto le entro', () => {
  expect(porCadaMil({ ingresos: 1_800_000, gastos: 1_000_000, balance: 800_000 })).toBe(1800);
  expect(porCadaMil({ ingresos: 300_000, gastos: 500_000, balance: -200_000 })).toBe(600);
  expect(porCadaMil({ ingresos: 300_000, gastos: 0, balance: 300_000 })).toBeNull();
});

const c = (fecha: string, idCultivo: string, cantidad: number, unidad = 'KILOGRAMO'): Cosecha => ({ fecha, idCultivo, cantidad, unidad });

test('cosecha del mes comparada con el mes anterior, sin mezclar unidades', () => {
  const cosechas = [c('2026-10-03', 'cafe', 120), c('2026-10-20', 'cafe', 30), c('2026-09-10', 'cafe', 100),
    c('2026-09-12', 'platano', 4, 'CANASTILLA'), c('2026-08-01', 'cafe', 999)];
  expect(cosechaDelMes(cosechas, '2026-10')).toEqual([
    { idCultivo: 'cafe', unidad: 'KILOGRAMO', cantidad: 150, mesPasado: 100 },
    { idCultivo: 'platano', unidad: 'CANASTILLA', cantidad: 0, mesPasado: 4 },
  ]);
});

test('cuanto cuesta producir cada kilo: solo si todo se cosecho en la misma unidad', () => {
  expect(costoPorUnidad(300_000, [c('2026-10-03', 'cafe', 100), c('2026-10-20', 'cafe', 50)]))
    .toEqual({ unidad: 'KILOGRAMO', valor: 2000 });
  expect(costoPorUnidad(300_000, [c('2026-10-03', 'cafe', 100), c('2026-10-20', 'cafe', 5, 'ARROBA')])).toBeNull();
  expect(costoPorUnidad(0, [c('2026-10-03', 'cafe', 100)])).toBeNull();
});

test('tiempo de trabajo en horas y jornales, e insumos sumados', () => {
  const l = (horas: number, trabajadores: number, insumos: Labor['insumos'] = []): Labor =>
    ({ fecha: '2026-10-01', idCultivo: 'cafe', horas, trabajadores, insumos });
  const labores = [l(4, 2, [{ tipoInsumo: 'ABONO_FERTILIZANTE', cantidad: 2, unidad: 'BULTO' }]),
    l(8, 1, [{ tipoInsumo: 'ABONO_FERTILIZANTE', cantidad: 1, unidad: 'BULTO' }, { tipoInsumo: 'AGUA', cantidad: 20, unidad: 'LITRO' }])];
  expect(tiempoDeTrabajo(labores)).toEqual({ horas: 16, jornales: 2 });
  expect(insumosUsados(labores)).toEqual([
    { tipoInsumo: 'AGUA', unidad: 'LITRO', cantidad: 20 },
    { tipoInsumo: 'ABONO_FERTILIZANTE', unidad: 'BULTO', cantidad: 3 },
  ]);
});

test('cantidades en palabras', () => {
  expect(cantidadConUnidad(120, 'Kilogramo')).toBe('120 kilogramos');
  expect(cantidadConUnidad(1, 'Bulto')).toBe('1 bulto');
  expect(cantidadConUnidad(3, 'Unidad')).toBe('3 unidades');
  expect(cantidadConUnidad(1500, 'Metro cuadrado')).toBe('1.500 metros cuadrado');
});
