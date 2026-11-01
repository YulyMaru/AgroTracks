import type { Parametro } from './modelo';

/**
 * Copia del catalogo inicial del backend (V4__modelo_de_datos_v2.sql, seccion 4 del modelo) para
 * poder registrar desde el primer uso sin conexion. Al sincronizar se reemplaza por el del servidor.
 */
const p = (tipo: string, pares: [string, string][]): Parametro[] =>
  pares.map(([codigo, etiqueta]) => ({ tipo, codigo, etiqueta }));

export const CATALOGO_RESPALDO: Record<string, Parametro[]> = {
  UNIDAD_AREA: p('UNIDAD_AREA', [['HECTAREA', 'Hectárea'], ['CUADRA', 'Cuadra'], ['METRO_CUADRADO', 'Metro cuadrado']]),
  UNIDAD: p('UNIDAD', [
    ['KILOGRAMO', 'Kilogramo'], ['ARROBA', 'Arroba'], ['CARGA', 'Carga'], ['BULTO', 'Bulto'],
    ['CANASTILLA', 'Canastilla'], ['TONELADA', 'Tonelada'], ['LITRO', 'Litro'], ['UNIDAD', 'Unidad'],
  ]),
  TIPO_CULTIVO: p('TIPO_CULTIVO', [
    ['CAFE', 'Café'], ['PLATANO', 'Plátano'], ['MAIZ', 'Maíz'], ['YUCA', 'Yuca'], ['FRIJOL', 'Fríjol'],
    ['AGUACATE', 'Aguacate'], ['CACAO', 'Cacao'], ['CANA', 'Caña'], ['PAPA', 'Papa'], ['OTRO', 'Otro'],
  ]),
  CATEGORIA_GASTO: p('CATEGORIA_GASTO', [
    ['ABONOS_Y_SEMILLAS', 'Abonos y semillas'], ['MANO_DE_OBRA', 'Mano de obra'], ['TRANSPORTE', 'Transporte'],
    ['AGROQUIMICOS', 'Agroquímicos'], ['HERRAMIENTAS_Y_EQUIPO', 'Herramientas y equipo'], ['SERVICIOS', 'Servicios'],
    ['OTROS', 'Otros'],
  ]),
  TIPO_INGRESO: p('TIPO_INGRESO', [
    ['SUBSIDIO', 'Subsidio'], ['ALQUILER', 'Alquiler'], ['SERVICIO_PRESTADO', 'Servicio prestado'],
    ['VENTA_SUBPRODUCTO', 'Venta de subproducto'], ['OTRO', 'Otro'],
  ]),
  TIPO_LABOR: p('TIPO_LABOR', [
    ['PREPARACION_TERRENO', 'Preparación del terreno'], ['SIEMBRA', 'Siembra'], ['FERTILIZACION', 'Fertilización'],
    ['RIEGO', 'Riego'], ['CONTROL_PLAGAS', 'Control de plagas'], ['DESYERBE', 'Desyerbe'], ['PODA', 'Poda'],
    ['COSECHA', 'Cosecha'], ['POSCOSECHA', 'Poscosecha'], ['OTRA', 'Otra'],
  ]),
  TIPO_INSUMO: p('TIPO_INSUMO', [
    ['SEMILLA', 'Semilla'], ['ABONO_FERTILIZANTE', 'Abono o fertilizante'], ['AGROQUIMICO', 'Agroquímico'],
    ['AGUA', 'Agua'], ['HERRAMIENTA', 'Herramienta'], ['MAQUINARIA', 'Maquinaria'], ['OTRO', 'Otro'],
  ]),
};
