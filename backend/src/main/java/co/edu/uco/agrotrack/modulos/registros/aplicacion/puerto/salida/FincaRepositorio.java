package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Finca;

/** Puerto de salida: donde se guardan las fincas. */
public interface FincaRepositorio extends RepositorioRegistro<Finca> {

	/** Si el usuario ya tiene otra finca vigente con ese nombre (sin importar mayusculas). */
	boolean existeNombre(UUID idUsuario, String nombre, UUID excluirId);
}
