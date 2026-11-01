import type { Entidad } from '../modulos/registros/dominio/modelo';
import {
  FormularioCosecha,
  FormularioCultivo,
  FormularioFinca,
  FormularioGasto,
  FormularioLabor,
  FormularioLote,
  FormularioOtroIngreso,
  FormularioVenta,
  type PropsFormulario,
} from './Formularios';

/** Como se muestra cada tipo de registro: icono, nombres y su formulario. */
export type Formulario = (p: PropsFormulario<Entidad>) => React.JSX.Element;

export const REGISTROS: Record<Entidad, {
  icono: string; singular: string; plural: string; nuevo: string; Componente: Formulario;
}> = {
  FINCA: { icono: '🏡', singular: 'Finca', plural: 'Fincas', nuevo: 'Nueva finca', Componente: FormularioFinca as Formulario },
  LOTE: { icono: '🗺️', singular: 'Lote', plural: 'Lotes', nuevo: 'Nuevo lote', Componente: FormularioLote as Formulario },
  CULTIVO: { icono: '🌱', singular: 'Cultivo', plural: 'Cultivos', nuevo: 'Nuevo cultivo', Componente: FormularioCultivo as Formulario },
  COSECHA: { icono: '🧺', singular: 'Cosecha', plural: 'Cosechas', nuevo: 'Nueva cosecha', Componente: FormularioCosecha as Formulario },
  VENTA: { icono: '🤝', singular: 'Venta', plural: 'Ventas', nuevo: 'Nueva venta', Componente: FormularioVenta as Formulario },
  GASTO: { icono: '💸', singular: 'Gasto', plural: 'Gastos', nuevo: 'Nuevo gasto', Componente: FormularioGasto as Formulario },
  OTRO_INGRESO: {
    icono: '💵', singular: 'Otro ingreso', plural: 'Otros ingresos', nuevo: 'Nuevo ingreso',
    Componente: FormularioOtroIngreso as Formulario,
  },
  LABOR: { icono: '🧑‍🌾', singular: 'Labor', plural: 'Labores', nuevo: 'Nueva labor', Componente: FormularioLabor as Formulario },
};

export const GRUPOS: { titulo: string; entidades: Entidad[] }[] = [
  { titulo: 'Mi finca', entidades: ['FINCA', 'LOTE', 'CULTIVO'] },
  { titulo: 'Cosecha y ventas', entidades: ['COSECHA', 'VENTA'] },
  { titulo: 'Dinero', entidades: ['GASTO', 'OTRO_INGRESO'] },
  { titulo: 'Trabajo en la finca', entidades: ['LABOR'] },
];
