package co.edu.uco.agrotrack.modulos.registros.dominio;

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
}
