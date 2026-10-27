package co.edu.uco.agrotrack.modulos.autenticacion.dominio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;

/** Reglas de la cuenta y del refresh token. Sin Spring. */
class UsuarioTest {

	@Test
	void unaCuentaNuevaGuardaCorreoYUsuarioEnMinusculas() {
		Usuario usuario = Usuario.nuevo("  Jose@Correo.COM ", "Jose.Perez", " José Pérez ", "hash");
		assertThat(usuario.getCorreo()).isEqualTo("jose@correo.com");
		assertThat(usuario.getNombreUsuario()).isEqualTo("jose.perez");
		assertThat(usuario.getNombre()).isEqualTo("José Pérez");
		assertThat(usuario.isActivo()).isTrue();
	}

	@ParameterizedTest
	@ValueSource(strings = { "jose", "jose.perez", "jose_2026", "123finca" })
	void nombresDeUsuarioValidos(String nombre) {
		assertThat(Usuario.normalizar(nombre)).isEqualTo(nombre);
	}

	@ParameterizedTest
	@ValueSource(strings = { "jo", "josé", "jose perez", ".jose", "_jose", "jose-perez", "unnombredeusuariodemasiadolargoxx" })
	void nombresDeUsuarioQueSeRechazan(String nombre) {
		assertThatThrownBy(() -> Usuario.normalizar(nombre))
				.isInstanceOf(ExcepcionAgroTrack.class)
				.hasMessageContaining("nombre de usuario");
	}

	@Test
	void sabeSiLoQueEscribioEsUnCorreoOUnUsuario() {
		assertThat(Usuario.esCorreo("jose@correo.com")).isTrue();
		assertThat(Usuario.esCorreo("jose.perez")).isFalse();
	}

	@Test
	void unTokenRevocadoOVencidoYaNoSirve() {
		TokenRenovacion vigente = TokenRenovacion.nuevo(UUID.randomUUID(), "hash", Instant.now().plusSeconds(60));
		assertThat(vigente.esValido()).isTrue();
		vigente.revocar();
		assertThat(vigente.esValido()).isFalse();

		TokenRenovacion vencido = TokenRenovacion.nuevo(UUID.randomUUID(), "hash", Instant.now().minusSeconds(1));
		assertThat(vencido.esValido()).isFalse();
	}
}
