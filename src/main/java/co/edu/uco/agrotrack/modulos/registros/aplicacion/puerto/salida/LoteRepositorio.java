package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Lote;

/** Puerto de salida: donde se guardan los lotes. */
public interface LoteRepositorio extends RepositorioRegistro<Lote> {

	/** Si la finca ya tiene otro lote vigente con ese nombre (sin importar mayusculas). */
	boolean existeNombreEnFinca(UUID idFinca, String nombre, UUID excluirId);
}
