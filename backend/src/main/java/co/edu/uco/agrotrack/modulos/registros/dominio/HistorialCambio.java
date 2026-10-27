package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.time.Instant;
import java.util.UUID;

/**
 * Historial de cambios (seccion 3.9, R4 y R5): copia completa en JSON de como estaba un registro
 * antes de editarlo o eliminarlo. Asi nada se pierde y ninguna columna queda vacia.
 */
public record HistorialCambio(UUID id, UUID idUsuario, String tabla, UUID idRegistro, int version, Accion accion,
		String datosAnteriores, Instant fecha) {

	public enum Accion {
		EDITAR, ELIMINAR
	}

	public static HistorialCambio de(Registro registro, Entidad entidad, Accion accion, String datosAnteriores) {
		return new HistorialCambio(UUID.randomUUID(), registro.getIdUsuario(), entidad.tabla(), registro.getId(),
				registro.getVersion(), accion, datosAnteriores, Instant.now());
	}
}
