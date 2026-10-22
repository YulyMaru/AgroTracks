package co.edu.uco.agrotrack.compartido.dominio;

/**
 * Los datos chocan con otros ya guardados al confirmar la transaccion (por ejemplo, dos
 * reintentos de la misma operacion al mismo tiempo). La lanza el adaptador de transacciones para
 * que la aplicacion no dependa de las excepciones de Spring.
 */
public class ConflictoDeDatos extends RuntimeException {

	private static final long serialVersionUID = 1L;

	public ConflictoDeDatos(String mensaje, Throwable causa) {
		super(mensaje, causa);
	}
}
