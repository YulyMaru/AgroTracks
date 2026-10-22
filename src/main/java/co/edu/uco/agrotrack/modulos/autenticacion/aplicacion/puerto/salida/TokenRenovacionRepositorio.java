package co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida;

import java.util.Optional;

import co.edu.uco.agrotrack.modulos.autenticacion.dominio.TokenRenovacion;

/** Puerto de salida: refresh tokens guardados (solo su hash). */
public interface TokenRenovacionRepositorio {

	Optional<TokenRenovacion> buscarPorHash(String tokenHash);

	void guardar(TokenRenovacion token);
}
