package co.edu.uco.agrotrack.modulos.registros.infraestructura.entrada.web;

import java.util.Arrays;

import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;

/**
 * Como se llama cada tipo de registro en la URL: {@code /api/v1/registros/otros-ingresos}. Es un
 * detalle de la API web, por eso vive en el adaptador y no en el dominio.
 */
final class RutasRegistros {

	private RutasRegistros() {
	}

	static String ruta(Entidad entidad) {
		return entidad.tabla().replace('_', '-');
	}

	static Entidad entidad(String ruta) {
		return Arrays.stream(Entidad.values())
				.filter(e -> ruta(e).equals(ruta))
				.findFirst()
				.orElseThrow(() -> ExcepcionAgroTrack.noEncontrado("ese tipo de registro"));
	}
}
