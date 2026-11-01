import { formatoNumero, formatoPesos } from '../compartido/dominio/formato';
import type { Entidad, Etiquetas } from '../modulos/registros/dominio/modelo';

/**
 * Textos de cada registro en su lista. Es presentacion (como se lee en pantalla), no una regla del
 * negocio, por eso vive en la capa de pantallas y no en el dominio.
 */
type FilaResumen = Record<string, string>;

/** Titulo y detalle de un registro en su lista: "Café Castillo" · "Lote alto · sembrado el ...". */
export function describir(entidad: Entidad, f: FilaResumen, e: Etiquetas): [string, string] {
  const cultivo = () => `${e('TIPO_CULTIVO', f.tipoCultivo)} ${f.especie}`;
  const cantidad = () => `${formatoNumero(f.cantidad)} ${e('UNIDAD', f.unidad).toLowerCase()}`;
  switch (entidad) {
    case 'FINCA':
      return [f.nombre, `${f.municipio} · vereda ${f.vereda}`];
    case 'LOTE':
      return [f.nombre, `${formatoNumero(f.area)} ${e('UNIDAD_AREA', f.unidadArea).toLowerCase()} · ${f.finca}`];
    case 'CULTIVO':
      return [`${e('TIPO_CULTIVO', f.tipoCultivo)} ${f.especie}`, `${f.lote} · sembrado el ${f.fechaSiembra}`];
    case 'COSECHA':
      return [cantidad(), `${cultivo()} · ${f.fecha}`];
    case 'VENTA':
      return [formatoPesos(Number(f.valorTotal)), `${cantidad()} de ${cultivo()} · ${f.fecha}`];
    case 'GASTO':
      return [`${f.concepto} · ${formatoPesos(Number(f.valor))}`, `${e('CATEGORIA_GASTO', f.categoria)} · ${f.finca} · ${f.fecha}`];
    case 'OTRO_INGRESO':
      return [`${f.concepto} · ${formatoPesos(Number(f.valor))}`, `${e('TIPO_INGRESO', f.tipoIngreso)} · ${f.finca} · ${f.fecha}`];
    case 'LABOR': {
      const personas = Number(f.trabajadores) === 1 ? '1 persona' : `${f.trabajadores} personas`;
      return [e('TIPO_LABOR', f.tipoLabor), `${cultivo()} · ${f.fecha} · ${formatoNumero(f.horas)} h · ${personas}`];
    }
  }
}
