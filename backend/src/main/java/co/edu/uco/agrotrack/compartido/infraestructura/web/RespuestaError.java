package co.edu.uco.agrotrack.compartido.infraestructura.web;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;

/** Estructura unica de error (ADR-024): { codigo, mensaje, detalles, fechaHora, idTraza }. */
public record RespuestaError(String codigo, String mensaje, List<String> detalles, Instant fechaHora, String idTraza) {

	public static RespuestaError de(CodigoError codigo, String mensaje, List<String> detalles, String idTraza) {
		return new RespuestaError(codigo.name(), mensaje, detalles, Instant.now(), idTraza);
	}

	/** Estado HTTP de cada codigo de negocio. */
	public static HttpStatus estadoHttp(CodigoError codigo) {
		return switch (codigo) {
			case ERROR_VALIDACION -> HttpStatus.BAD_REQUEST;
			case AUTENTICACION_REQUERIDA -> HttpStatus.UNAUTHORIZED;
			case ACCESO_DENEGADO -> HttpStatus.FORBIDDEN;
			case NO_ENCONTRADO -> HttpStatus.NOT_FOUND;
			case CONFLICTO, OPERACION_YA_REGISTRADA -> HttpStatus.CONFLICT;
			case ERROR_INTERNO -> HttpStatus.INTERNAL_SERVER_ERROR;
			case SERVICIO_NO_DISPONIBLE -> HttpStatus.SERVICE_UNAVAILABLE;
		};
	}
}
