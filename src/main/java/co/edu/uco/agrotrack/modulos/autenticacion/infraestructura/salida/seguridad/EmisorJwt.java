package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.salida.seguridad;

import java.time.Duration;
import java.time.Instant;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.compartido.infraestructura.seguridad.PropiedadesSeguridad;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.EmisorTokenAcceso;
import co.edu.uco.agrotrack.modulos.autenticacion.dominio.Usuario;

/** Adaptador de salida: access token JWT HS256 con el idUsuario como subject (ADR-011). */
@Component
class EmisorJwt implements EmisorTokenAcceso {

	private final JwtEncoder jwtEncoder;
	private final Duration vigencia;

	EmisorJwt(JwtEncoder jwtEncoder, PropiedadesSeguridad propiedades) {
		this.jwtEncoder = jwtEncoder;
		this.vigencia = Duration.ofMinutes(propiedades.accessTokenMinutos());
	}

	@Override
	public TokenAcceso emitir(Usuario usuario) {
		Instant ahora = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer("agrotrack")
				.subject(usuario.getId().toString())
				.issuedAt(ahora)
				.expiresAt(ahora.plus(vigencia))
				.claim("nombre", usuario.getNombre())
				.build();
		String valor = jwtEncoder
				.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
				.getTokenValue();
		return new TokenAcceso(valor, vigencia.toSeconds());
	}
}
