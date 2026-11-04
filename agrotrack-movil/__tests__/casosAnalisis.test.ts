/**
 * Casos de uso del analisis (HU-14 a HU-21 y HU-35 a HU-42): arman lo que muestran "La plata",
 * "La cosecha" y "Mis cultivos" con los datos del celular.
 */
import { cantidadConUnidad } from '../src/compartido/dominio/formato';
import { crearCasosAnalisis } from '../src/modulos/analisis/aplicacion/casosDeUso';
import type { FuenteMovimientos } from '../src/modulos/analisis/aplicacion/puertos';
import type { Cosecha, Labor, Movimiento } from '../src/modulos/analisis/dominio/analisis';

const NOMBRES: Record<string, string> = {
  MANO_DE_OBRA: 'Mano de obra', VENTA: 'Venta', KILOGRAMO: 'Kilogramo', ABONO: 'Abono', BULTO: 'Bulto',
};

const m = (fecha: string, tipo: Movimiento['tipo'], valor: number, categoria: string, idCultivo = '', descripcion = ''): Movimiento =>
  ({ fecha, tipo, valor, categoria, idCultivo, idLote: idCultivo ? 'alto' : '', idFinca: 'esperanza', descripcion });

function fuente(datos: { movimientos?: Movimiento[]; cosechas?: Cosecha[]; labores?: Labor[]; sinCultivos?: boolean }): FuenteMovimientos {
  return {
    movimientos: async () => datos.movimientos ?? [],
    cosechas: async () => datos.cosechas ?? [],
    labores: async () => datos.labores ?? [],
    nombreCategoria: async () => (_tipo, codigo) => NOMBRES[codigo] ?? codigo,
    etiquetas: async () => (_tipo, codigo) => NOMBRES[codigo] ?? codigo,
    nombresCultivos: async () => ({ cafe: 'Café Castillo · Lote alto' }),
    estructura: async () => ({
      fincas: [{ id: 'esperanza', nombre: 'La Esperanza' }],
      lotes: [{ id: 'alto', nombre: 'Lote alto', idFinca: 'esperanza' }],
      cultivos: datos.sinCultivos ? [] : [{ id: 'cafe', nombre: 'Café Castillo', idLote: 'alto' }],
    }),
  };
}

beforeAll(() => {
  jest.useFakeTimers({ now: new Date(2026, 9, 20, 10) });
});
afterAll(() => {
  jest.useRealTimers();
});

describe('la plata del mes', () => {
  const movimientos = [
    m('2026-10-02', 'INGRESO', 1_200_000, 'VENTA', 'cafe'),
    m('2026-10-05', 'GASTO', 300_000, 'MANO_DE_OBRA', 'cafe', 'Desyerba'),
    m('2026-09-10', 'GASTO', 100_000, 'MANO_DE_OBRA', '', 'Jornal'),
  ];

  test('totales, por cada $1.000 y en que se fue la plata', async () => {
    const vista = await crearCasosAnalisis({ fuente: fuente({ movimientos }) }).analizar('2026-10');
    expect(vista.titulo).toBe('Octubre de 2026');
    expect(vista.totales).toEqual({ ingresos: 1_200_000, gastos: 300_000, balance: 900_000 });
    expect(vista.porCadaMil).toBe(4000);
    expect(vista.categorias).toEqual([{ categoria: 'MANO_DE_OBRA', nombre: 'Mano de obra', valor: 300_000, porcentaje: 100 }]);
    expect(vista.meses).toHaveLength(6);
    expect(vista.meses.at(-1)).toMatchObject({ nombre: 'oct', ingresos: 1_200_000 });
    expect(vista.hayDatos).toBe(true);
  });

  test('lo ultimo anotado: las ventas sin descripcion muestran el cultivo', async () => {
    const { ultimos } = await crearCasosAnalisis({ fuente: fuente({ movimientos }) }).analizar('2026-10');
    expect(ultimos.map(u => [u.titulo, u.entro, u.esVenta])).toEqual([
      ['Desyerba', false, false],
      ['Venta de Café Castillo · Lote alto', true, true],
      ['Jornal', false, false],
    ]);
    expect(ultimos[0].detalle).toContain('Mano de obra');
  });

  test('el mes actual no deja ir al siguiente; un mes pasado si', async () => {
    const casos = crearCasosAnalisis({ fuente: fuente({}) });
    expect(casos.mesActual()).toBe('2026-10');
    const actual = await casos.analizar('2026-10');
    expect([actual.anterior, actual.siguiente]).toEqual(['2026-09', null]);
    expect((await casos.analizar('2026-08')).siguiente).toBe('2026-09');
    expect(actual.hayDatos).toBe(false);
    expect(actual.porCadaMil).toBeNull();
  });
});

describe('la cosecha del mes', () => {
  test('compara con el mes pasado y marca si es mas, menos, igual o nuevo', async () => {
    const cosechas: Cosecha[] = [
      { fecha: '2026-10-03', idCultivo: 'cafe', cantidad: 120, unidad: 'KILOGRAMO' },
      { fecha: '2026-09-03', idCultivo: 'cafe', cantidad: 100, unidad: 'KILOGRAMO' },
      { fecha: '2026-10-04', idCultivo: 'borrado', cantidad: 5, unidad: 'BULTO' },
    ];
    const vista = await crearCasosAnalisis({ fuente: fuente({ cosechas }) }).cosecha('2026-10');
    expect(vista.cultivos).toEqual([
      { nombre: 'Café Castillo · Lote alto', cantidad: cantidadConUnidad(120, 'Kilogramo'), mesPasado: cantidadConUnidad(100, 'Kilogramo'), cambio: 'MAS' },
      { nombre: 'Cultivo eliminado', cantidad: cantidadConUnidad(5, 'Bulto'), mesPasado: cantidadConUnidad(0, 'Bulto'), cambio: 'NUEVO' },
    ]);
    expect(vista.hayDatos).toBe(true);
  });

  test('menos o igual que el mes pasado', async () => {
    const casos = (cantidad: number) => crearCasosAnalisis({
      fuente: fuente({
        cosechas: [
          { fecha: '2026-10-03', idCultivo: 'cafe', cantidad, unidad: 'KILOGRAMO' },
          { fecha: '2026-09-03', idCultivo: 'cafe', cantidad: 100, unidad: 'KILOGRAMO' },
        ],
      }),
    });
    expect((await casos(80).cosecha('2026-10')).cultivos[0].cambio).toBe('MENOS');
    expect((await casos(100).cosecha('2026-10')).cultivos[0].cambio).toBe('IGUAL');
  });
});

describe('mis cultivos', () => {
  test('ficha del cultivo con lo que deja, el costo por unidad, el trabajo y los insumos', async () => {
    const vista = await crearCasosAnalisis({
      fuente: fuente({
        movimientos: [
          m('2026-10-02', 'INGRESO', 1_200_000, 'VENTA', 'cafe'),
          m('2026-10-05', 'GASTO', 240_000, 'MANO_DE_OBRA', 'cafe'),
        ],
        cosechas: [{ fecha: '2026-10-03', idCultivo: 'cafe', cantidad: 120, unidad: 'KILOGRAMO' }],
        labores: [{ fecha: '2026-10-01', idCultivo: 'cafe', horas: 8, trabajadores: 2, insumos: [{ tipoInsumo: 'ABONO', cantidad: 2, unidad: 'BULTO' }] }],
      }),
    }).lugares();
    expect(vista.fincas).toEqual([{ id: 'esperanza', nombre: 'La Esperanza', ingresos: 1_200_000, gastos: 240_000, balance: 960_000 }]);
    expect(vista.lotes).toEqual([{ id: 'alto', nombre: 'Lote alto (La Esperanza)', ingresos: 1_200_000, gastos: 240_000, balance: 960_000 }]);
    const [ficha] = vista.fichas;
    expect(ficha).toMatchObject({
      nombre: 'Café Castillo',
      lugar: 'Lote alto · La Esperanza',
      porCadaMil: 5000,
      costo: { unidad: 'kilogramo', valor: 2000 },
      cosechado: [cantidadConUnidad(120, 'Kilogramo')],
      insumos: [`Abono: ${cantidadConUnidad(2, 'Bulto')}`],
    });
    expect(ficha.trabajo).not.toBeNull();
    expect(vista.hayDatos).toBe(true);
  });

  test('un cultivo sin gastos ni labores no inventa costo ni trabajo', async () => {
    const vista = await crearCasosAnalisis({ fuente: fuente({}) }).lugares();
    expect(vista.fichas[0]).toMatchObject({ costo: null, trabajo: null, porCadaMil: null, insumos: [] });
    expect(vista.fincas).toEqual([]);
  });

  test('sin cultivos no hay datos que mostrar; lo eliminado se nombra como tal', async () => {
    const vista = await crearCasosAnalisis({
      fuente: fuente({
        sinCultivos: true,
        movimientos: [{ ...m('2026-10-02', 'GASTO', 1000, 'MANO_DE_OBRA'), idFinca: 'vieja', idLote: 'perdido' }],
      }),
    }).lugares();
    expect(vista.hayDatos).toBe(false);
    expect(vista.fincas[0].nombre).toBe('Finca eliminada');
    expect(vista.lotes[0].nombre).toBe('Lote eliminado');
  });
});
