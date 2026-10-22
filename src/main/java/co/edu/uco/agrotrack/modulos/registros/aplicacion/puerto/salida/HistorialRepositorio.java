package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida;

import java.util.List;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.HistorialCambio;

/** Puerto de salida: el historial de cambios. */
public interface HistorialRepositorio {

	void guardar(HistorialCambio cambio);

	/** Copias de un registro, de la version mas nueva a la mas vieja. */
	List<HistorialCambio> deRegistro(UUID idUsuario, String tabla, UUID idRegistro);
}
