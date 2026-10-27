package co.edu.uco.agrotrack.compartido.infraestructura.web;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ConflictoDeDatos;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;

/** Manejo centralizado de errores (ADR-024). Mensajes en espanol, claros y accionables. */
@RestControllerAdvice
public class ManejadorGlobalErrores {

	private static final Logger LOG = LoggerFactory.getLogger(ManejadorGlobalErrores.class);

	@ExceptionHandler(ExcepcionAgroTrack.class)
	ResponseEntity<RespuestaError> negocio(ExcepcionAgroTrack ex) {
		return respuesta(ex.getCodigo(), ex.getMessage(), ex.getDetalles());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<RespuestaError> validacion(MethodArgumentNotValidException ex) {
		List<String> detalles = ex.getBindingResult().getFieldErrors().stream()
				.map(e -> e.getField() + ": " + e.getDefaultMessage()).toList();
		return respuesta(CodigoError.ERROR_VALIDACION, "Revisa los datos enviados.", detalles);
	}

	@ExceptionHandler(HandlerMethodValidationException.class)
	ResponseEntity<RespuestaError> validacionParametros(HandlerMethodValidationException ex) {
		List<String> detalles = ex.getAllErrors().stream().map(e -> String.valueOf(e.getDefaultMessage())).toList();
		return respuesta(CodigoError.ERROR_VALIDACION, "Revisa los datos enviados.", detalles);
	}

	@ExceptionHandler({ HttpMessageNotReadableException.class, MissingServletRequestParameterException.class,
			MethodArgumentTypeMismatchException.class })
	ResponseEntity<RespuestaError> solicitudInvalida(Exception ex) {
		return respuesta(CodigoError.ERROR_VALIDACION, "La solicitud tiene un formato inválido.",
				List.of(String.valueOf(ex.getMessage())));
	}

	@ExceptionHandler({ ConflictoDeDatos.class, DataIntegrityViolationException.class })
	ResponseEntity<RespuestaError> integridad(RuntimeException ex) {
		LOG.warn("Violacion de integridad: {}", ex.getMessage());
		return respuesta(CodigoError.CONFLICTO, "La información entra en conflicto con datos existentes.", List.of());
	}

	/** Fallo temporal (BD caida o lenta): 503 para que el movil reintente con backoff (ADR-001). */
	@ExceptionHandler({ CannotCreateTransactionException.class, DataAccessResourceFailureException.class,
			TransientDataAccessException.class })
	ResponseEntity<RespuestaError> noDisponible(Exception ex) {
		LOG.error("Servicio de datos no disponible", ex);
		return respuesta(CodigoError.SERVICIO_NO_DISPONIBLE,
				"El servidor no está disponible en este momento. Tus datos siguen guardados en el celular.", List.of());
	}

	@ExceptionHandler(AccessDeniedException.class)
	ResponseEntity<RespuestaError> accesoDenegado(AccessDeniedException ex) {
		return respuesta(CodigoError.ACCESO_DENEGADO, "No tienes permiso para realizar esta acción.", List.of());
	}

	@ExceptionHandler(NoResourceFoundException.class)
	ResponseEntity<RespuestaError> rutaInexistente(NoResourceFoundException ex) {
		return respuesta(CodigoError.NO_ENCONTRADO, "El recurso solicitado no existe.", List.of());
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	ResponseEntity<RespuestaError> metodoNoSoportado(HttpRequestMethodNotSupportedException ex) {
		return respuesta(CodigoError.ERROR_VALIDACION, "Método HTTP no soportado en esta ruta.", List.of());
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<RespuestaError> inesperado(Exception ex) {
		LOG.error("Error no controlado", ex);
		return respuesta(CodigoError.ERROR_INTERNO,
				"Ocurrió un error en el servidor. Tus datos siguen guardados en el celular; intenta de nuevo más tarde.",
				List.of());
	}

	private ResponseEntity<RespuestaError> respuesta(CodigoError codigo, String mensaje, List<String> detalles) {
		return ResponseEntity.status(RespuestaError.estadoHttp(codigo))
				.body(RespuestaError.de(codigo, mensaje, detalles, MDC.get(FiltroTraza.CLAVE_MDC)));
	}
}
