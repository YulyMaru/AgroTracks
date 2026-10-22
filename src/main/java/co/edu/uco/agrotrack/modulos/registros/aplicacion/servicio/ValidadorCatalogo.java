package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.List;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CatalogoPuerto;

/** Verifica que un codigo (unidad, tipo de cultivo, categoria...) exista activo en el catalogo. */
public class ValidadorCatalogo {

	public static final String UNIDAD_AREA = "UNIDAD_AREA";
	public static final String UNIDAD = "UNIDAD";
	public static final String TIPO_CULTIVO = "TIPO_CULTIVO";
	public static final String CATEGORIA_GASTO = "CATEGORIA_GASTO";
	public static final String TIPO_INGRESO = "TIPO_INGRESO";
	public static final String TIPO_LABOR = "TIPO_LABOR";
	public static final String TIPO_INSUMO = "TIPO_INSUMO";

	private final CatalogoPuerto catalogo;

	public ValidadorCatalogo(CatalogoPuerto catalogo) {
		this.catalogo = catalogo;
	}

	/** Lanza ERROR_VALIDACION si el codigo no esta activo en el catalogo de ese tipo. */
	public void validar(String tipo, String codigo, String campo) {
		if (codigo != null && !catalogo.existeActivo(tipo, codigo)) {
			throw new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION, "El valor de " + campo + " no es válido.",
					List.of(campo + ": '" + codigo + "' no existe en el catálogo " + tipo));
		}
	}
}
