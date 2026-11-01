import type { CambioSinEnviar } from '../dominio/reglas';
import type {
  Accion,
  Entidad,
  EstadoEnvio,
  EstructuraFinca,
  MovimientoDinero,
  Opcion,
  Parametro,
  ProduccionRegistrada,
  RegistroGuardado,
  TrabajoRegistrado,
} from '../dominio/modelo';

/** Puerto de salida: los registros guardados en el celular. */
export interface RepositorioRegistros {
  buscar<E extends Entidad>(entidad: E, id: string): Promise<RegistroGuardado<E> | null>;
  /** Guarda los datos del formulario mas la finca calculada (solo gastos y otros ingresos). */
  insertar(entidad: Entidad, id: string, datos: object, idFinca: string | null, version: number): Promise<void>;
  actualizar(entidad: Entidad, id: string, datos: object, idFinca: string | null, version: number): Promise<void>;
  marcarEliminado(entidad: Entidad, id: string, version: number): Promise<void>;
  borrar(entidad: Entidad, id: string): Promise<void>;
  /** Copia que llego del servidor (con su version y si esta eliminado). */
  guardarCopia(entidad: Entidad, registro: Record<string, unknown>): Promise<void>;

  /** Finca de un lote o de un cultivo (null si no existe). */
  fincaDe(nivel: 'LOTE' | 'CULTIVO', id: string): Promise<string | null>;
  loteDeCultivo(idCultivo: string): Promise<string | null>;
  /** Cuantos registros vigentes dependen de una finca, lote o cultivo. */
  contarDependientes(entidad: Entidad, id: string): Promise<number>;

  /** Registros vigentes de un tipo, con los nombres de su finca, lote o cultivo (camelCase). */
  resumenes(entidad: Entidad): Promise<Record<string, string>[]>;
  contarVigentes(entidad: Entidad): Promise<number>;
  fincas(): Promise<Opcion[]>;
  lotes(idFinca: string): Promise<Opcion[]>;
  cultivos(idLote?: string): Promise<{ id: string; tipoCultivo: string; especie: string; lote: string; finca: string }[]>;
  nombre(entidad: 'FINCA' | 'LOTE', id: string): Promise<string>;
  /** Valores que ya escribio en un dato (municipio, concepto...), del mas reciente al mas viejo. */
  valoresUsados(entidad: Entidad, dato: string): Promise<string[]>;
  /** Ventas, otros ingresos y gastos vigentes. */
  movimientosDeDinero(): Promise<MovimientoDinero[]>;
  /** Cosechas vigentes. */
  produccion(): Promise<ProduccionRegistrada[]>;
  /** Labores vigentes, con su tiempo de trabajo y los insumos usados. */
  trabajos(): Promise<TrabajoRegistrado[]>;
  /** Fincas, lotes y cultivos vigentes (el nombre del cultivo sin traducir: tipoCultivo y especie). */
  estructura(): Promise<{
    fincas: EstructuraFinca['fincas'];
    lotes: EstructuraFinca['lotes'];
    cultivos: { id: string; tipoCultivo: string; especie: string; idLote: string }[];
  }>;
}

/** Puerto de salida: el catalogo guardado en el celular. */
export interface CatalogoLocal {
  activos(tipo: string): Promise<Parametro[]>;
  todos(): Promise<Parametro[]>;
  guardar(parametros: (Parametro & { orden: number; activo: boolean })[]): Promise<void>;
}

/** Puerto de salida hacia la cola de cambios (modulo de sincronizacion). */
export interface ColaCambios {
  encolar(entidad: Entidad, accion: Accion, idRegistro: string, versionBase: number, contenido: object): Promise<void>;
  sinEnviarDe(idRegistro: string): Promise<CambioSinEnviar[]>;
  reemplazarContenido(idOperacion: string, contenido: object): Promise<void>;
  quitar(idsOperacion: string[]): Promise<void>;
  /** Estado de envio de los registros de un tipo que tienen cambios sin enviar. */
  estadosSinEnviar(entidad: Entidad): Promise<{ idRegistro: string; estado: EstadoEnvio; mensaje: string }[]>;
  /** Mientras se envia la cola no se reescriben operaciones que podrian estar viajando. */
  envioEnCurso(): boolean;
}
