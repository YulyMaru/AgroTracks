package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Registro;

/** Puerto de salida comun a todos los registros del campesino. */
public interface RepositorioRegistro<E extends Registro> {

	Optional<E> buscar(UUID id);

	/** Guarda y devuelve el registro como quedo (con su fecha de actualizacion). */
	E guardar(E registro);

	/** Registros vigentes del usuario (R5: nunca se muestran los eliminados), del mas nuevo al mas viejo. */
	List<E> vigentes(UUID idUsuario);

	/** Todo lo que cambio desde una fecha, incluidos los eliminados. */
	List<E> modificadosDesde(UUID idUsuario, Instant desde);
}
