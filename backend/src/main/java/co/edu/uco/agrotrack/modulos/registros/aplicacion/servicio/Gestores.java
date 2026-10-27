package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Registro;

/** Reglas compartidas por los gestores de registros. */
final class Gestores {

	private Gestores() {
	}

	/**
	 * En una edicion no se puede cambiar a que finca, lote o cultivo pertenece un registro: los
	 * registros que dependen de el quedarian incoherentes. Si el padre esta mal, se elimina y se
	 * vuelve a crear.
	 */
	static <E extends Registro> void padreSinCambios(RepositorioRegistro<E> repositorio, UUID idRegistro,
			Function<E, UUID> padreActual, UUID padreNuevo, String queEs) {
		repositorio.buscar(idRegistro).ifPresent(existente -> {
			if (!Objects.equals(padreActual.apply(existente), padreNuevo)) {
				throw new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION, "No se puede cambiar " + queEs
						+ " de un registro ya guardado. Elimínalo y regístralo de nuevo.");
			}
		});
	}

	static void noEliminable(boolean tieneDependientes, String mensaje) {
		if (tieneDependientes) {
			throw new ExcepcionAgroTrack(CodigoError.CONFLICTO, mensaje);
		}
	}
}
