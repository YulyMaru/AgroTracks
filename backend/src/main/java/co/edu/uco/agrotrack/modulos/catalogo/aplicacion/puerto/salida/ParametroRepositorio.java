package co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.salida;

import java.time.Instant;
import java.util.List;

import co.edu.uco.agrotrack.modulos.catalogo.dominio.Parametro;

/** Puerto de salida: donde estan guardados los parametros. */
public interface ParametroRepositorio {

	List<Parametro> activos();

	List<Parametro> modificadosDesde(Instant desde);

	boolean existeActivo(String tipo, String codigo);
}
