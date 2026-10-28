package co.edu.uco.agrotrack.compartido.infraestructura.seguridad;

import java.io.IOException;
import java.util.List;

import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.infraestructura.web.FiltroTraza;
import co.edu.uco.agrotrack.compartido.infraestructura.web.RespuestaError;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;

/** Respuestas 401/403 con la misma estructura de error del resto de la API (ADR-024). */
@Component
public class RespuestasErrorSeguridad {

	private final JsonMapper jsonMapper;

	public RespuestasErrorSeguridad(JsonMapper jsonMapper) {
		this.jsonMapper = jsonMapper;
	}

	public AuthenticationEntryPoint noAutenticado() {
		return (request, response, ex) -> escribir(response, CodigoError.AUTENTICACION_REQUERIDA,
				"Tu sesión no es válida o venció. Inicia sesión nuevamente.");
	}

	public AccessDeniedHandler accesoDenegado() {
		return (request, response, ex) -> escribir(response, CodigoError.ACCESO_DENEGADO,
				"No tienes permiso para realizar esta acción.");
	}

	/** La peticion no llego por Cloudflare (FiltroOrigen). */
	public void origenNoPermitido(HttpServletResponse response) throws IOException {
		escribir(response, CodigoError.ACCESO_DENEGADO, "No tienes permiso para realizar esta acción.");
	}

	private void escribir(HttpServletResponse response, CodigoError codigo, String mensaje) throws IOException {
		response.setStatus(RespuestaError.estadoHttp(codigo).value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");
		RespuestaError cuerpo = RespuestaError.de(codigo, mensaje, List.of(), MDC.get(FiltroTraza.CLAVE_MDC));
		response.getWriter().write(jsonMapper.writeValueAsString(cuerpo));
	}
}
