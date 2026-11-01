/**
 * Analisis de las cuentas de la finca: cuanto entro, cuanto salio, en que se va la plata y que
 * cultivo deja mas. Funciones puras: se calculan con los datos del celular, sin internet.
 */
export interface Movimiento {
  fecha: string;
  tipo: 'INGRESO' | 'GASTO';
  valor: number;
  categoria: string;
  /** '' si el dinero fue para toda la finca o un lote. */
  idCultivo: string;
  /** '' si el dinero fue para toda la finca. */
  idLote: string;
  idFinca: string;
  /** Lo que escribio el campesino; '' en las ventas de cosecha. */
  descripcion: string;
}

export interface Cosecha {
  fecha: string;
  idCultivo: string;
  cantidad: number;
  unidad: string;
}

export interface Labor {
  fecha: string;
  idCultivo: string;
  horas: number;
  trabajadores: number;
  insumos: { tipoInsumo: string; cantidad: number; unidad: string }[];
}

export interface Totales {
  ingresos: number;
  gastos: number;
  /** Lo que queda: ingresos - gastos (puede ser negativo). */
  balance: number;
}

/** "2026-10-21" -> "2026-10". */
export const mesDe = (fecha: string) => fecha.slice(0, 7);

export function mesAnterior(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
}

export function mesSiguiente(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
}

export const delMes = (movimientos: Movimiento[], mes: string) => movimientos.filter(m => mesDe(m.fecha) === mes);

export function totales(movimientos: Movimiento[]): Totales {
  const suma = (tipo: Movimiento['tipo']) =>
    movimientos.filter(m => m.tipo === tipo).reduce((total, m) => total + m.valor, 0);
  const ingresos = suma('INGRESO');
  const gastos = suma('GASTO');
  return { ingresos, gastos, balance: ingresos - gastos };
}

/** Gastos agrupados por categoria, del mayor al menor, con el porcentaje de cada uno. */
export function gastosPorCategoria(movimientos: Movimiento[]): { categoria: string; valor: number; porcentaje: number }[] {
  const gastos = movimientos.filter(m => m.tipo === 'GASTO');
  const total = gastos.reduce((t, m) => t + m.valor, 0);
  const porCategoria = new Map<string, number>();
  gastos.forEach(m => porCategoria.set(m.categoria, (porCategoria.get(m.categoria) ?? 0) + m.valor));
  return [...porCategoria.entries()]
    .map(([categoria, valor]) => ({ categoria, valor, porcentaje: total > 0 ? Math.round((valor / total) * 100) : 0 }))
    .sort((a, b) => b.valor - a.valor);
}

/**
 * Lo que deja cada cultivo: lo que entro por el (ventas y otros ingresos asignados) menos los gastos
 * asignados a el. Del que mas deja al que menos. No incluye lo asignado a la finca o a un lote.
 */
export function porCultivo(movimientos: Movimiento[]): ({ idCultivo: string } & Totales)[] {
  return agrupar(movimientos, 'idCultivo').map(({ id, ...t }) => ({ idCultivo: id, ...t }));
}

/**
 * Lo que deja cada cultivo, lote o finca, del que mas deja al que menos. Un lote incluye lo de sus
 * cultivos, y una finca lo de sus lotes y cultivos (HU-15, HU-16, HU-18).
 */
export function agrupar(movimientos: Movimiento[], clave: 'idCultivo' | 'idLote' | 'idFinca'): ({ id: string } & Totales)[] {
  const ids = [...new Set(movimientos.filter(m => m[clave]).map(m => m[clave]))];
  return ids
    .map(id => ({ id, ...totales(movimientos.filter(m => m[clave] === id)) }))
    .sort((a, b) => b.balance - a.balance);
}

/**
 * Cuanta plata entro por cada $1.000 que se gasto (HU-42), mas facil de entender que un porcentaje:
 * 1.800 quiere decir que por cada $1.000 invertidos volvieron $1.800. null si no hubo gastos.
 */
export function porCadaMil(t: Totales): number | null {
  return t.gastos > 0 ? Math.round((t.ingresos / t.gastos) * 1000) : null;
}

/**
 * Lo cosechado en un mes por cultivo y unidad, junto a lo del mes anterior para comparar
 * (HU-39, HU-40). Del que mas se cosecho al que menos.
 */
export function cosechaDelMes(cosechas: Cosecha[], mes: string):
  { idCultivo: string; unidad: string; cantidad: number; mesPasado: number }[] {
  const anterior = mesAnterior(mes);
  const grupos = new Map<string, { idCultivo: string; unidad: string; cantidad: number; mesPasado: number }>();
  for (const c of cosechas) {
    const enMes = mesDe(c.fecha) === mes;
    if (!enMes && mesDe(c.fecha) !== anterior) {
      continue;
    }
    const llave = `${c.idCultivo}|${c.unidad}`;
    const grupo = grupos.get(llave) ?? { idCultivo: c.idCultivo, unidad: c.unidad, cantidad: 0, mesPasado: 0 };
    if (enMes) {
      grupo.cantidad += c.cantidad;
    } else {
      grupo.mesPasado += c.cantidad;
    }
    grupos.set(llave, grupo);
  }
  return [...grupos.values()].sort((a, b) => b.cantidad - a.cantidad || b.mesPasado - a.mesPasado);
}

/** Todo lo cosechado, sumado por unidad (no se pueden sumar kilos con arrobas). */
export function cosechadoPorUnidad(cosechas: Cosecha[]): { unidad: string; cantidad: number }[] {
  const porUnidad = new Map<string, number>();
  cosechas.forEach(c => porUnidad.set(c.unidad, (porUnidad.get(c.unidad) ?? 0) + c.cantidad));
  return [...porUnidad.entries()].map(([unidad, cantidad]) => ({ unidad, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
}

/**
 * Cuanto costo producir cada kilo, arroba... (HU-21, HU-41): lo gastado en el cultivo dividido por
 * todo lo cosechado. Solo si todo se cosecho en una misma unidad; si no, no se puede comparar.
 */
export function costoPorUnidad(gastos: number, cosechas: Cosecha[]): { unidad: string; valor: number } | null {
  const porUnidad = cosechadoPorUnidad(cosechas);
  if (gastos <= 0 || porUnidad.length !== 1 || porUnidad[0].cantidad <= 0) {
    return null;
  }
  return { unidad: porUnidad[0].unidad, valor: Math.round(gastos / porUnidad[0].cantidad) };
}

/** Horas de una persona en un dia de trabajo: un jornal. */
export const HORAS_POR_JORNAL = 8;

/** Tiempo de trabajo (HU-36): horas de todas las personas y su equivalente en jornales. */
export function tiempoDeTrabajo(labores: Labor[]): { horas: number; jornales: number } {
  const horas = labores.reduce((total, l) => total + l.horas * l.trabajadores, 0);
  return { horas, jornales: Math.round((horas / HORAS_POR_JORNAL) * 10) / 10 };
}

/** Lo que se uso en las labores (HU-37), sumado por tipo de insumo y unidad, de mayor a menor. */
export function insumosUsados(labores: Labor[]): { tipoInsumo: string; unidad: string; cantidad: number }[] {
  const grupos = new Map<string, { tipoInsumo: string; unidad: string; cantidad: number }>();
  labores.flatMap(l => l.insumos).forEach(i => {
    const llave = `${i.tipoInsumo}|${i.unidad}`;
    const grupo = grupos.get(llave) ?? { tipoInsumo: i.tipoInsumo, unidad: i.unidad, cantidad: 0 };
    grupo.cantidad += i.cantidad;
    grupos.set(llave, grupo);
  });
  return [...grupos.values()].sort((a, b) => b.cantidad - a.cantidad);
}

/** Los n movimientos mas recientes, del mas nuevo al mas viejo. */
export function ultimosMovimientos(movimientos: Movimiento[], n: number): Movimiento[] {
  return [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, n);
}

/** Entradas y salidas de los ultimos n meses hasta el indicado, del mas viejo al mas nuevo. */
export function ultimosMeses(movimientos: Movimiento[], hasta: string, n: number): ({ mes: string } & Totales)[] {
  const meses: string[] = [hasta];
  while (meses.length < n) {
    meses.unshift(mesAnterior(meses[0]));
  }
  return meses.map(mes => ({ mes, ...totales(delMes(movimientos, mes)) }));
}
