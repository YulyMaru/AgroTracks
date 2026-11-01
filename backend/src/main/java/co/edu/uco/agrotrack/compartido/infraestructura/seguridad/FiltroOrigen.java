package co.edu.uco.agrotrack.compartido.infraestructura.seguridad;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Acepta solo peticiones que pasaron por Cloudflare (ADR-027, ADR-031): Cloudflare agrega el header
 * X-Origen-Agrotrack con un secreto. La direccion *.run.app de Cloud Run es publica, y sin este filtro
 * se podria llamar al backend saltandose el WAF. Si el secreto no esta configurado (desarrollo), no se exige.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class FiltroOrigen extends OncePerRequestFilter {

	public static final String HEADER = "X-Origen-Agrotrack";

	private final byte[] secreto;
	private final RespuestasErrorSeguridad errores;

	public FiltroOrigen(@Value("${agrotrack.seguridad.origen-secreto:}") String secreto,
			RespuestasErrorSeguridad errores) {
		this.secreto = secreto.getBytes(StandardCharsets.UTF_8);
		this.errores = errores;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		// Cloud Run revisa la salud directamente en el contenedor, sin pasar por Cloudflare
		return secreto.length == 0 || request.getRequestURI().startsWith("/actuator/health");
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String recibido = request.getHeader(HEADER);
		if (recibido == null || !MessageDigest.isEqual(secreto, recibido.getBytes(StandardCharsets.UTF_8))) {
			errores.origenNoPermitido(response);
			return;
		}
		chain.doFilter(request, response);
	}
}
