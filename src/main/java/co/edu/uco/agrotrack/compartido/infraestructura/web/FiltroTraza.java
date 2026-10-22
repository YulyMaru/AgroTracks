package co.edu.uco.agrotrack.compartido.infraestructura.web;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Propaga el header X-Trace-Id (o genera uno) en logs y respuestas (ADR-021, ADR-024). */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class FiltroTraza extends OncePerRequestFilter {

	public static final String HEADER = "X-Trace-Id";
	public static final String CLAVE_MDC = "idTraza";

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String idTraza = request.getHeader(HEADER);
		if (idTraza == null || idTraza.isBlank() || idTraza.length() > 64) {
			idTraza = UUID.randomUUID().toString();
		}
		MDC.put(CLAVE_MDC, idTraza);
		response.setHeader(HEADER, idTraza);
		try {
			chain.doFilter(request, response);
		} finally {
			MDC.remove(CLAVE_MDC);
		}
	}
}
