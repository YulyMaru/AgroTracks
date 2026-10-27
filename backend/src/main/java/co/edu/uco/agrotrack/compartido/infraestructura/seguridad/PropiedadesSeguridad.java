package co.edu.uco.agrotrack.compartido.infraestructura.seguridad;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Parametros de seguridad. El secreto llega por variable de entorno (ADR-030). */
@ConfigurationProperties("agrotrack.seguridad")
public record PropiedadesSeguridad(String jwtSecreto, long accessTokenMinutos, long refreshTokenDias) {

	public PropiedadesSeguridad {
		if (jwtSecreto == null || jwtSecreto.length() < 32) {
			throw new IllegalStateException("agrotrack.seguridad.jwt-secreto debe tener al menos 32 caracteres");
		}
	}
}
