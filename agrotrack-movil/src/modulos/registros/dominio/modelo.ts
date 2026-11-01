/**
 * Modelo de datos v2 (docs/ModeloDeDatos.md), igual que el backend. Los datos de cada formulario
 * van en camelCase, tal como los recibe el backend. Todos son obligatorios.
 */
export type Entidad = 'FINCA' | 'LOTE' | 'CULTIVO' | 'COSECHA' | 'VENTA' | 'GASTO' | 'OTRO_INGRESO' | 'LABOR';
export type Accion = 'CREAR' | 'EDITAR' | 'ELIMINAR';
export type NivelAsignacion = 'FINCA' | 'LOTE' | 'CULTIVO';
/** Estado de envio de un registro: si tiene cambios por enviar, con problema, o todo enviado. */
export type EstadoEnvio = 'PENDIENTE' | 'ERROR' | 'SINCRONIZADO';

export const ENTIDADES: Entidad[] = ['FINCA', 'LOTE', 'CULTIVO', 'COSECHA', 'VENTA', 'GASTO', 'OTRO_INGRESO', 'LABOR'];

export interface Insumo {
  tipoInsumo: string;
  cantidad: number;
  unidad: string;
}

export interface FincaDatos { nombre: string; municipio: string; vereda: string }
export interface LoteDatos { idFinca: string; nombre: string; area: number; unidadArea: string }
export interface CultivoDatos { idLote: string; tipoCultivo: string; especie: string; fechaSiembra: string }
export interface CosechaDatos { idCultivo: string; fecha: string; cantidad: number; unidad: string }
export interface VentaDatos extends CosechaDatos { valorTotal: number }
export interface GastoDatos {
  fecha: string; categoria: string; concepto: string; valor: number;
  nivelAsignacion: NivelAsignacion; idAsignacion: string;
}
export interface OtroIngresoDatos {
  fecha: string; tipoIngreso: string; concepto: string; valor: number;
  nivelAsignacion: NivelAsignacion; idAsignacion: string;
}
export interface LaborDatos {
  idCultivo: string; tipoLabor: string; fecha: string; descripcion: string; horas: number;
  trabajadores: number; insumos: Insumo[];
}

export interface DatosPorEntidad {
  FINCA: FincaDatos;
  LOTE: LoteDatos;
  CULTIVO: CultivoDatos;
  COSECHA: CosechaDatos;
  VENTA: VentaDatos;
  GASTO: GastoDatos;
  OTRO_INGRESO: OtroIngresoDatos;
  LABOR: LaborDatos;
}

/** Registro guardado en el celular: sus datos, la version que tendra en el servidor y si se elimino. */
export interface RegistroGuardado<E extends Entidad> {
  datos: DatosPorEntidad[E];
  version: number;
  eliminado: boolean;
}

/** Codigo del catalogo (unidad, tipo de cultivo...). */
export interface Parametro {
  tipo: string;
  codigo: string;
  etiqueta: string;
}

/** Una opcion para elegir en un formulario. */
export interface Opcion { valor: string; etiqueta: string }

/** Dinero que entro o salio, para el analisis de cuentas. */
export interface MovimientoDinero {
  fecha: string;
  tipo: 'INGRESO' | 'GASTO';
  valor: number;
  /** Categoria del gasto, tipo de ingreso, o VENTA para las ventas de cosecha. */
  categoria: string;
  /** Cultivo al que se asigno ('' si fue a la finca o a un lote). */
  idCultivo: string;
  /** Lote al que pertenece ('' si fue a toda la finca). */
  idLote: string;
  idFinca: string;
  /** Lo que escribio el campesino (concepto); '' en las ventas. */
  descripcion: string;
}

/** Lo que se cosecho, para ver cuanto se produce. */
export interface ProduccionRegistrada {
  fecha: string;
  idCultivo: string;
  cantidad: number;
  unidad: string;
}

/** Una labor hecha en un cultivo: el tiempo de trabajo y lo que se uso. */
export interface TrabajoRegistrado {
  fecha: string;
  idCultivo: string;
  horas: number;
  trabajadores: number;
  insumos: Insumo[];
}

/** Fincas, lotes y cultivos vigentes, para agrupar el analisis por cada uno. */
export interface EstructuraFinca {
  fincas: { id: string; nombre: string }[];
  lotes: { id: string; nombre: string; idFinca: string }[];
  cultivos: { id: string; nombre: string; idLote: string }[];
}

/** Nombre para mostrar de un codigo del catalogo (tipo y codigo -> "Mano de obra"). */
export type Etiquetas = (tipo: string, codigo: string) => string;

/**
 * Un registro vigente para su lista: sus datos (camelCase, con el nombre de su finca, lote o
 * cultivo) y como va su envio. Como se muestra en pantalla lo decide la capa de pantallas.
 */
export interface RegistroEnLista {
  id: string;
  datos: Record<string, string>;
  envio: EstadoEnvio;
  mensajeError: string;
}
