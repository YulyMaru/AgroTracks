package co.edu.uco.agrotrack.compartido.infraestructura.seguridad;

import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;

/** Obtiene el idUsuario del JWT: cada operacion se autoriza contra el (ADR-011). */
public final class UsuarioAutenticado {

	private UsuarioAutenticado() {
	}

	public static UUID id(Jwt jwt) {
		return UUID.fromString(jwt.getSubject());
	}
}
