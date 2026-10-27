package co.edu.uco.agrotrack.modulos.sincronizacion.dominio;

import java.time.Instant;
import java.util.UUID;

/**
 * Registro de idempotencia (ADR-007): una operacion ya aplicada. Si el celular la reenvia, no se
 * vuelve a aplicar.
 */
public record OperacionSincronizada(UUID idOperacion, UUID idUsuario, TipoRegistro entidad, Accion accion,
		UUID idRegistro, int versionResultante, Instant creadoEnCliente, Instant procesadoEn) {

	public boolean esDe(UUID idUsuario) {
		return this.idUsuario.equals(idUsuario);
	}
}
