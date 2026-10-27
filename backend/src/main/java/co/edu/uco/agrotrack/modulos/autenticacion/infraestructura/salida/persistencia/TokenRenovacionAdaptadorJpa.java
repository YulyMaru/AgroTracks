package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.salida.persistencia;

import java.util.Optional;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.TokenRenovacionRepositorio;
import co.edu.uco.agrotrack.modulos.autenticacion.dominio.TokenRenovacion;

/** Adaptador de salida: refresh tokens en la tabla tokens_renovacion. */
@Component
class TokenRenovacionAdaptadorJpa implements TokenRenovacionRepositorio {

	private final TokenRenovacionJpaRepositorio repositorio;

	TokenRenovacionAdaptadorJpa(TokenRenovacionJpaRepositorio repositorio) {
		this.repositorio = repositorio;
	}

	@Override
	public Optional<TokenRenovacion> buscarPorHash(String tokenHash) {
		return repositorio.findByTokenHash(tokenHash).map(TokenRenovacionJpa::aDominio);
	}

	@Override
	public void guardar(TokenRenovacion token) {
		TokenRenovacionJpa fila = repositorio.findById(token.getId())
				.map(existente -> {
					existente.copiarDe(token);
					return existente;
				})
				.orElseGet(() -> new TokenRenovacionJpa(token));
		repositorio.save(fila);
	}
}
