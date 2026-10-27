package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.util.Arrays;

import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;

/** Los 8 tipos de registro del modelo de datos v2, con el nombre de su tabla (para el historial). */
public enum Entidad {
	FINCA("fincas"),
	LOTE("lotes"),
	CULTIVO("cultivos"),
	COSECHA("cosechas"),
	VENTA("ventas"),
	GASTO("gastos"),
	OTRO_INGRESO("otros_ingresos"),
	LABOR("labores");

	private final String tabla;

	Entidad(String tabla) {
		this.tabla = tabla;
	}

	public String tabla() {
		return tabla;
	}

	/** Nombre en la URL: {@code /api/v1/registros/otros-ingresos}. */
	public String ruta() {
		return tabla.replace('_', '-');
	}

	public static Entidad deRuta(String ruta) {
		return Arrays.stream(values())
				.filter(e -> e.ruta().equals(ruta))
				.findFirst()
				.orElseThrow(() -> ExcepcionAgroTrack.noEncontrado("ese tipo de registro"));
	}
}
