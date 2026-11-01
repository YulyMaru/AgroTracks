import type { Cosecha, Labor, Movimiento } from '../dominio/analisis';

/** Puerto de salida: de donde salen los datos del analisis y sus nombres (modulo de registros). */
export interface FuenteMovimientos {
  movimientos(): Promise<Movimiento[]>;
  cosechas(): Promise<Cosecha[]>;
  labores(): Promise<Labor[]>;
  /** Nombre para mostrar de una categoria de gasto o tipo de ingreso. */
  nombreCategoria(): Promise<(tipo: 'GASTO' | 'INGRESO', codigo: string) => string>;
  /** Nombre para mostrar de un codigo del catalogo (UNIDAD, TIPO_INSUMO...). */
  etiquetas(): Promise<(tipo: string, codigo: string) => string>;
  /** Nombre de cada cultivo por su id, con su lote ("Café Castillo · Lote alto"). */
  nombresCultivos(): Promise<Record<string, string>>;
  /** Fincas, lotes y cultivos vigentes con su nombre. */
  estructura(): Promise<{
    fincas: { id: string; nombre: string }[];
    lotes: { id: string; nombre: string; idFinca: string }[];
    cultivos: { id: string; nombre: string; idLote: string }[];
  }>;
}
