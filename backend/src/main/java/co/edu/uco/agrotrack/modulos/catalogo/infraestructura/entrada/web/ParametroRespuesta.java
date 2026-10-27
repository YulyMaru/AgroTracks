package co.edu.uco.agrotrack.modulos.catalogo.infraestructura.entrada.web;

import java.time.Instant;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.catalogo.dominio.Parametro;

/** JSON de un parametro para la app. */
record ParametroRespuesta(UUID id, String tipo, String codigo, String etiqueta, int orden, boolean activo,
		Instant actualizadoEn) {

	static ParametroRespuesta de(Parametro p) {
		return new ParametroRespuesta(p.id(), p.tipo(), p.codigo(), p.etiqueta(), p.orden(), p.activo(),
				p.actualizadoEn());
	}
}
