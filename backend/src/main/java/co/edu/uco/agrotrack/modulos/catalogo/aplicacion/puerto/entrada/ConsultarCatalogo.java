package co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.entrada;

import java.time.Instant;
import java.util.List;

import co.edu.uco.agrotrack.modulos.catalogo.dominio.Parametro;

/** Puerto de entrada del catalogo. Es lo unico que otros modulos pueden usar de el. */
public interface ConsultarCatalogo {

	/**
	 * Sin {@code desde}: parametros activos. Con {@code desde}: todo lo modificado despues
	 * (incluye desactivados para que el movil los oculte en su copia local).
	 */
	List<Parametro> listar(Instant desde);

	boolean existeActivo(String tipo, String codigo);
}
