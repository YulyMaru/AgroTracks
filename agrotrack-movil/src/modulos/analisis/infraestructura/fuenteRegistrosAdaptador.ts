import type { CasosRegistros } from '../../registros/aplicacion/casosDeUso';
import type { FuenteMovimientos } from '../aplicacion/puertos';

/**
 * Adaptador de {@link FuenteMovimientos} hacia el modulo de registros (su API publica): el
 * analisis no lee las tablas de registros directamente.
 */
export function crearFuenteRegistrosAdaptador(registros: CasosRegistros): FuenteMovimientos {
  return {
    movimientos: () => registros.movimientosDeDinero(),
    cosechas: () => registros.produccion(),
    labores: () => registros.trabajos(),
    async nombreCategoria() {
      const etiquetas = await registros.cargarEtiquetas();
      return (tipo, codigo) => {
        if (codigo === 'VENTA') {
          return 'Venta de cosecha';
        }
        return etiquetas(tipo === 'GASTO' ? 'CATEGORIA_GASTO' : 'TIPO_INGRESO', codigo);
      };
    },
    etiquetas: () => registros.cargarEtiquetas(),
    async nombresCultivos() {
      const nombres: Record<string, string> = {};
      (await registros.opcionesCultivos()).forEach(o => (nombres[o.valor] = o.etiqueta));
      return nombres;
    },
    estructura: () => registros.estructura(),
  };
}
