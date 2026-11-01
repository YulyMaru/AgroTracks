import { cantidadConUnidad, fechaCorta, fechaHoy, formatoNumero, mesCorto, nombreMes } from '../../../compartido/dominio/formato';
import {
  agrupar,
  costoPorUnidad,
  cosechadoPorUnidad,
  cosechaDelMes,
  delMes,
  gastosPorCategoria,
  insumosUsados,
  mesAnterior,
  mesDe,
  mesSiguiente,
  porCadaMil,
  tiempoDeTrabajo,
  totales,
  ultimosMeses,
  ultimosMovimientos,
  type Totales,
} from '../dominio/analisis';
import type { FuenteMovimientos } from './puertos';

/** Mes que se esta mirando y sus vecinos, para las flechas ‹ ›. */
export interface Periodo {
  mes: string;
  titulo: string;
  anterior: string;
  /** null si el mes es el actual (no se puede ver el futuro). */
  siguiente: string | null;
}

/** Lo que muestra "¿Cómo voy?" → "La plata", para un mes. */
export interface VistaAnalisis extends Periodo {
  totales: Totales;
  /** Cuanto entro por cada $1.000 que salio (null si no salio nada). */
  porCadaMil: number | null;
  categorias: { nombre: string; valor: number; porcentaje: number }[];
  meses: ({ nombre: string } & Totales)[];
  /** Lo ultimo que se anoto de dinero (de cualquier mes). */
  ultimos: { titulo: string; detalle: string; valor: number; entro: boolean; esVenta: boolean }[];
  /** Si el campesino ya anoto algo de dinero alguna vez. */
  hayDatos: boolean;
}

/** "La cosecha": cuanto se cosecho de cada cultivo en el mes, comparado con el mes anterior. */
export interface VistaCosecha extends Periodo {
  cultivos: { nombre: string; cantidad: string; mesPasado: string; cambio: 'MAS' | 'MENOS' | 'IGUAL' | 'NUEVO' }[];
  hayDatos: boolean;
}

/** Ficha de un cultivo con todo lo que se ha anotado de el. */
export interface FichaCultivo {
  nombre: string;
  /** "Lote alto · Finca La Esperanza". */
  lugar: string;
  totales: Totales;
  porCadaMil: number | null;
  /** "Cada kilogramo le costó $1.200" (null si no se puede calcular). */
  costo: { unidad: string; valor: number } | null;
  cosechado: string[];
  trabajo: { horas: string; jornales: string } | null;
  insumos: string[];
}

/** "Mis cultivos": lo que deja cada finca, lote y cultivo desde que se empezo a anotar. */
export interface VistaLugares {
  fincas: ({ nombre: string } & Totales)[];
  lotes: ({ nombre: string } & Totales)[];
  fichas: FichaCultivo[];
  hayDatos: boolean;
}

/** Casos de uso del analisis (HU-14 a HU-21 y HU-35 a HU-42). Se calcula con los datos del celular. */
export function crearCasosAnalisis(p: { fuente: FuenteMovimientos }) {
  const periodo = (mes: string): Periodo => ({
    mes,
    titulo: nombreMes(mes),
    anterior: mesAnterior(mes),
    siguiente: mes < mesDe(fechaHoy()) ? mesSiguiente(mes) : null,
  });

  return {
    mesActual: () => mesDe(fechaHoy()),

    async analizar(mes: string): Promise<VistaAnalisis> {
      const [movimientos, nombreCategoria, cultivos] = await Promise.all([
        p.fuente.movimientos(), p.fuente.nombreCategoria(), p.fuente.nombresCultivos(),
      ]);
      const delPeriodo = delMes(movimientos, mes);
      const t = totales(delPeriodo);
      return {
        ...periodo(mes),
        totales: t,
        porCadaMil: porCadaMil(t),
        categorias: gastosPorCategoria(delPeriodo).map(c => ({ ...c, nombre: nombreCategoria('GASTO', c.categoria) })),
        meses: ultimosMeses(movimientos, mes, 6).map(m => ({ ...m, nombre: mesCorto(m.mes) })),
        ultimos: ultimosMovimientos(movimientos, 5).map(m => ({
          titulo: m.descripcion || `Venta de ${cultivos[m.idCultivo] ?? 'cosecha'}`,
          detalle: `${fechaCorta(m.fecha)} • ${nombreCategoria(m.tipo, m.categoria)}`,
          valor: m.valor,
          entro: m.tipo === 'INGRESO',
          esVenta: m.categoria === 'VENTA',
        })),
        hayDatos: movimientos.length > 0,
      };
    },

    async cosecha(mes: string): Promise<VistaCosecha> {
      const [cosechas, etiquetas, cultivos] = await Promise.all([
        p.fuente.cosechas(), p.fuente.etiquetas(), p.fuente.nombresCultivos(),
      ]);
      return {
        ...periodo(mes),
        cultivos: cosechaDelMes(cosechas, mes).map(c => {
          const unidad = etiquetas('UNIDAD', c.unidad);
          return {
            nombre: cultivos[c.idCultivo] ?? 'Cultivo eliminado',
            cantidad: cantidadConUnidad(c.cantidad, unidad),
            mesPasado: cantidadConUnidad(c.mesPasado, unidad),
            cambio: c.mesPasado === 0 ? 'NUEVO' : c.cantidad > c.mesPasado ? 'MAS' : c.cantidad < c.mesPasado ? 'MENOS' : 'IGUAL',
          };
        }),
        hayDatos: cosechas.length > 0,
      };
    },

    async lugares(): Promise<VistaLugares> {
      const [movimientos, cosechas, labores, estructura, etiquetas] = await Promise.all([
        p.fuente.movimientos(), p.fuente.cosechas(), p.fuente.labores(), p.fuente.estructura(), p.fuente.etiquetas(),
      ]);
      const nombreFinca = new Map(estructura.fincas.map(f => [f.id, f.nombre]));
      const lote = new Map(estructura.lotes.map(l => [l.id, l]));
      const fichas = estructura.cultivos.map((c): FichaCultivo => {
        const t = totales(movimientos.filter(m => m.idCultivo === c.id));
        const suyas = cosechas.filter(x => x.idCultivo === c.id);
        const tiempo = tiempoDeTrabajo(labores.filter(l => l.idCultivo === c.id));
        const suLote = lote.get(c.idLote);
        const costo = costoPorUnidad(t.gastos, suyas);
        return {
          nombre: c.nombre,
          lugar: suLote ? `${suLote.nombre} · ${nombreFinca.get(suLote.idFinca) ?? ''}` : '',
          totales: t,
          porCadaMil: porCadaMil(t),
          costo: costo && { unidad: etiquetas('UNIDAD', costo.unidad).toLowerCase(), valor: costo.valor },
          cosechado: cosechadoPorUnidad(suyas).map(x => cantidadConUnidad(x.cantidad, etiquetas('UNIDAD', x.unidad))),
          trabajo: tiempo.horas > 0
            ? { horas: formatoNumero(tiempo.horas), jornales: formatoNumero(tiempo.jornales) } : null,
          insumos: insumosUsados(labores.filter(l => l.idCultivo === c.id)).map(i =>
            `${etiquetas('TIPO_INSUMO', i.tipoInsumo)}: ${cantidadConUnidad(i.cantidad, etiquetas('UNIDAD', i.unidad))}`),
        };
      });
      return {
        fincas: agrupar(movimientos, 'idFinca').map(f => ({ ...f, nombre: nombreFinca.get(f.id) ?? 'Finca eliminada' })),
        lotes: agrupar(movimientos, 'idLote').map(l => {
          const datos = lote.get(l.id);
          return { ...l, nombre: datos ? `${datos.nombre} (${nombreFinca.get(datos.idFinca) ?? ''})` : 'Lote eliminado' };
        }),
        fichas,
        hayDatos: estructura.cultivos.length > 0,
      };
    },
  };
}

export type CasosAnalisis = ReturnType<typeof crearCasosAnalisis>;
