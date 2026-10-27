package co.edu.uco.agrotrack.modulos.sincronizacion.infraestructura.entrada.web;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.edu.uco.agrotrack.compartido.infraestructura.seguridad.UsuarioAutenticado;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.CambiosVista;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.EstadoOperacionVista;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.OperacionPendiente;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.RespuestaSincronizacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizarCambios;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * Adaptador de entrada: API de sincronizacion al reconectar (Flujo-Sincronizacion.png).
 * <ol>
 * <li>{@code GET /estado} - "la conexion es estable?" (publico, responde rapido).</li>
 * <li>{@code POST /operaciones} - envia la cola PENDIENTE (crear, editar, eliminar); respuesta por operacion.</li>
 * <li>{@code GET /cambios?desde=} - trae lo que cambio en el servidor para la copia local.</li>
 * <li>{@code GET /operaciones/{idOperacion}} - confirma si una operacion llego (tras un timeout).</li>
 * </ol>
 */
@RestController
@RequestMapping("/api/v1/sincronizacion")
class SincronizacionController {

	private static final Set<TipoRegistro> TODOS = EnumSet.allOf(TipoRegistro.class);
	private static final Set<TipoRegistro> SOLO_TRANSACCIONES = EnumSet.of(TipoRegistro.GASTO, TipoRegistro.OTRO_INGRESO);

	/** Cuerpo de {@code POST /operaciones}. */
	record SolicitudSincronizacion(@NotEmpty List<@Valid @NotNull OperacionPendiente> operaciones) {
	}

	/** Respuesta del chequeo rapido "la conexion es estable / el backend responde". */
	record EstadoServidor(boolean disponible, Instant fechaServidor, String versionApi, int maxOperacionesPorLote) {
	}

	private final SincronizarCambios sincronizacion;

	SincronizacionController(SincronizarCambios sincronizacion) {
		this.sincronizacion = sincronizacion;
	}

	@GetMapping("/estado")
	EstadoServidor estado() {
		return new EstadoServidor(true, Instant.now(), "v1", sincronizacion.maxOperacionesPorLote());
	}

	@PostMapping("/operaciones")
	RespuestaSincronizacion sincronizar(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody SolicitudSincronizacion solicitud) {
		return sincronizacion.sincronizar(UsuarioAutenticado.id(jwt), solicitud.operaciones(), TODOS);
	}

	/** Ruta definida en ADR-015 / SPIKE-015: solo gastos y otros ingresos. */
	@PostMapping("/transacciones")
	RespuestaSincronizacion sincronizarTransacciones(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody SolicitudSincronizacion solicitud) {
		return sincronizacion.sincronizar(UsuarioAutenticado.id(jwt), solicitud.operaciones(), SOLO_TRANSACCIONES);
	}

	@GetMapping("/operaciones/{idOperacion}")
	EstadoOperacionVista consultarOperacion(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID idOperacion) {
		return sincronizacion.consultarOperacion(UsuarioAutenticado.id(jwt), idOperacion);
	}

	@GetMapping("/cambios")
	CambiosVista cambios(@AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) Instant desde) {
		return sincronizacion.cambiosDesde(UsuarioAutenticado.id(jwt), desde);
	}
}
