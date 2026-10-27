package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida;

/** Puerto de salida hacia el modulo de catalogo: si un codigo existe y esta activo. */
public interface CatalogoPuerto {

	boolean existeActivo(String tipo, String codigo);
}
