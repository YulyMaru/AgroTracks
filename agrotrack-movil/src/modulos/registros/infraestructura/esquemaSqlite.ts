import type { DatosPorEntidad, Entidad } from '../dominio/modelo';

/**
 * Como se guarda cada registro en SQLite: en que tabla y en que columna va cada dato del
 * formulario. Todas las columnas son NOT NULL. Solo lo conocen los adaptadores SQLite.
 */

/** [dato del formulario, columna en SQLite, tipo SQLite]. 'JSON' se guarda como texto. */
type Campo = [string, string, 'TEXT' | 'REAL' | 'INTEGER' | 'JSON'];

interface Definicion {
  tabla: string;
  /** Datos del formulario, en el orden del modelo. */
  campos: Campo[];
  /** Datos que no escribe el campesino sino que se calculan (la finca de un gasto). */
  calculados: Campo[];
}

const asignacion: Campo[] = [['nivelAsignacion', 'nivel_asignacion', 'TEXT'], ['idAsignacion', 'id_asignacion', 'TEXT']];

export const DEFINICIONES: Record<Entidad, Definicion> = {
  FINCA: {
    tabla: 'fincas',
    campos: [['nombre', 'nombre', 'TEXT'], ['municipio', 'municipio', 'TEXT'], ['vereda', 'vereda', 'TEXT']],
    calculados: [],
  },
  LOTE: {
    tabla: 'lotes',
    campos: [['idFinca', 'id_finca', 'TEXT'], ['nombre', 'nombre', 'TEXT'], ['area', 'area', 'REAL'],
      ['unidadArea', 'unidad_area', 'TEXT']],
    calculados: [],
  },
  CULTIVO: {
    tabla: 'cultivos',
    campos: [['idLote', 'id_lote', 'TEXT'], ['tipoCultivo', 'tipo_cultivo', 'TEXT'], ['especie', 'especie', 'TEXT'],
      ['fechaSiembra', 'fecha_siembra', 'TEXT']],
    calculados: [],
  },
  COSECHA: {
    tabla: 'cosechas',
    campos: [['idCultivo', 'id_cultivo', 'TEXT'], ['fecha', 'fecha', 'TEXT'], ['cantidad', 'cantidad', 'REAL'],
      ['unidad', 'unidad', 'TEXT']],
    calculados: [],
  },
  VENTA: {
    tabla: 'ventas',
    campos: [['idCultivo', 'id_cultivo', 'TEXT'], ['fecha', 'fecha', 'TEXT'], ['cantidad', 'cantidad', 'REAL'],
      ['unidad', 'unidad', 'TEXT'], ['valorTotal', 'valor_total', 'INTEGER']],
    calculados: [],
  },
  GASTO: {
    tabla: 'gastos',
    campos: [['fecha', 'fecha', 'TEXT'], ['categoria', 'categoria', 'TEXT'], ['concepto', 'concepto', 'TEXT'],
      ['valor', 'valor', 'INTEGER'], ...asignacion],
    calculados: [['idFinca', 'id_finca', 'TEXT']],
  },
  OTRO_INGRESO: {
    tabla: 'otros_ingresos',
    campos: [['fecha', 'fecha', 'TEXT'], ['tipoIngreso', 'tipo_ingreso', 'TEXT'], ['concepto', 'concepto', 'TEXT'],
      ['valor', 'valor', 'INTEGER'], ...asignacion],
    calculados: [['idFinca', 'id_finca', 'TEXT']],
  },
  LABOR: {
    tabla: 'labores',
    campos: [['idCultivo', 'id_cultivo', 'TEXT'], ['tipoLabor', 'tipo_labor', 'TEXT'], ['fecha', 'fecha', 'TEXT'],
      ['descripcion', 'descripcion', 'TEXT'], ['horas', 'horas', 'REAL'], ['trabajadores', 'trabajadores', 'INTEGER'],
      ['insumos', 'insumos', 'JSON']],
    calculados: [],
  },
};

export const TABLAS_REGISTROS = Object.values(DEFINICIONES).map(d => d.tabla);

/** CREATE TABLE de un tipo de registro: sus datos + version, eliminado y fecha de actualizacion. */
function sqlTabla(entidad: Entidad): string {
  const { tabla, campos, calculados } = DEFINICIONES[entidad];
  const columnas = [...campos, ...calculados]
    .map(([, columna, tipo]) => `${columna} ${tipo === 'JSON' ? 'TEXT' : tipo} NOT NULL`);
  return `CREATE TABLE IF NOT EXISTS ${tabla} (
     id TEXT PRIMARY KEY NOT NULL,
     ${columnas.join(',\n     ')},
     version INTEGER NOT NULL,
     eliminado INTEGER NOT NULL,
     actualizado_en TEXT NOT NULL
   )`;
}

export const SQL_TABLAS_REGISTROS: string[] = [
  ...(Object.keys(DEFINICIONES) as Entidad[]).map(sqlTabla),
  `CREATE TABLE IF NOT EXISTS parametros (
     tipo TEXT NOT NULL,
     codigo TEXT NOT NULL,
     etiqueta TEXT NOT NULL,
     orden INTEGER NOT NULL DEFAULT 0,
     activo INTEGER NOT NULL DEFAULT 1,
     PRIMARY KEY (tipo, codigo)
   )`,
];

/** Datos del formulario (o de la respuesta del servidor) -> columnas de SQLite. */
export function aFila(entidad: Entidad, datos: Record<string, unknown>, conCalculados = false): Record<string, unknown> {
  const { campos, calculados } = DEFINICIONES[entidad];
  const fila: Record<string, unknown> = {};
  for (const [dato, columna, tipo] of conCalculados ? [...campos, ...calculados] : campos) {
    fila[columna] = tipo === 'JSON' ? JSON.stringify(datos[dato]) : datos[dato];
  }
  return fila;
}

/** Fila de SQLite -> datos del formulario (para editar). */
export function aDatos<E extends Entidad>(entidad: E, fila: Record<string, unknown>): DatosPorEntidad[E] {
  const datos: Record<string, unknown> = {};
  for (const [dato, columna, tipo] of DEFINICIONES[entidad].campos) {
    const valor = fila[columna];
    datos[dato] = tipo === 'JSON' ? JSON.parse(String(valor)) : tipo === 'TEXT' ? String(valor) : Number(valor);
  }
  return datos as unknown as DatosPorEntidad[E];
}

/** id_finca -> idFinca (para las filas de las listas). */
export function aCamel(fila: Record<string, unknown>): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(fila)) {
    resultado[clave.replace(/_([a-z])/g, (_, letra: string) => letra.toUpperCase())] = String(valor);
  }
  return resultado;
}
