package co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.Accion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.EstadoOperacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** Datos que entran y salen del puerto de sincronizacion. */
public final class SincronizacionModelos {

	private SincronizacionModelos() {
	}

	/**
	 * Una fila de la cola local {@code operaciones_pendientes} (ADR-005, docs/ModeloDeDatos.md seccion 5).
	 * <ul>
	 * <li>{@code versionBase}: version que tenia el registro en el celular (0 al crear).</li>
	 * <li>{@code contenido}: datos del formulario; vacio al eliminar.</li>
	 * </ul>
	 */
	public record OperacionPendiente(
			@NotNull UUID idOperacion,
			@NotNull TipoRegistro entidad,
			@NotNull Accion accion,
			@NotNull UUID idRegistro,
			@NotNull @PositiveOrZero Integer versionBase,
			@NotNull Map<String, Object> contenido,
			@NotNull Instant creadoEn,
			@NotNull @PositiveOrZero Integer reintentos) {
	}

	/**
	 * Resultado de una operacion. {@code versionActual} es la version del registro en el servidor
	 * despues de aplicarla (0 si hubo error).
	 */
	public record ResultadoOperacion(UUID idOperacion, TipoRegistro entidad, Accion accion, UUID idRegistro,
			EstadoOperacion estado, int versionActual, String codigoError, String mensaje, List<String> detalles) {
	}

	public record RespuestaSincronizacion(int totalRecibidas, int sincronizadas, int yaRegistradas, int conError,
			String mensaje, Instant fechaServidor, List<ResultadoOperacion> resultados) {
	}

	public record EstadoOperacionVista(UUID idOperacion, TipoRegistro entidad, Accion accion, UUID idRegistro,
			int versionResultante, Instant procesadoEn) {
	}

	/**
	 * Cambios del servidor desde la ultima sincronizacion, por tipo de registro. Incluye los
	 * eliminados ({@code eliminado = true}) para que el celular tambien los quite.
	 */
	public record CambiosVista(Instant fechaServidor, Map<TipoRegistro, List<?>> cambios) {
	}
}
