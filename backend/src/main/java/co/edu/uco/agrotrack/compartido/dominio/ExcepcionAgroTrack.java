package co.edu.uco.agrotrack.compartido.dominio;

import java.util.List;

/** Excepcion de negocio con codigo estandarizado y mensaje para el usuario final. */
public class ExcepcionAgroTrack extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private final CodigoError codigo;
	private final List<String> detalles;

	public ExcepcionAgroTrack(CodigoError codigo, String mensaje) {
		this(codigo, mensaje, List.of());
	}

	public ExcepcionAgroTrack(CodigoError codigo, String mensaje, List<String> detalles) {
		super(mensaje);
		this.codigo = codigo;
		this.detalles = List.copyOf(detalles);
	}

	public static ExcepcionAgroTrack noEncontrado(String recurso) {
		return new ExcepcionAgroTrack(CodigoError.NO_ENCONTRADO, "No encontramos " + recurso + ".");
	}

	public static ExcepcionAgroTrack validacion(String mensaje) {
		return new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION, mensaje);
	}

	public CodigoError getCodigo() {
		return codigo;
	}

	public List<String> getDetalles() {
		return detalles;
	}
}
