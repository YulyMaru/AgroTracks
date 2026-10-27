package co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.OperacionPendiente;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;

/** Puerto de salida hacia el modulo de registros: aplicar un cambio y leer lo que cambio. */
public interface RegistrosPuerto {

	/** Resultado de aplicar un cambio: version del registro y si ya estaba aplicado. */
	record CambioAplicado(int version, boolean yaAplicado) {
	}

	CambioAplicado aplicar(UUID idUsuario, OperacionPendiente operacion);

	/**
	 * Registros que cambiaron, tal como los entrega el modulo de registros. La sincronizacion no los
	 * lee: solo los pasa al celular, por eso son contenido opaco ({@code List<?>}).
	 */
	List<?> modificadosDesde(UUID idUsuario, TipoRegistro tipo, Instant desde);
}
