package co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.entrada;

import java.util.UUID;

/** Tokens de una sesion: access token corto y refresh token largo. */
public record SesionEmitida(String accessToken, String refreshToken, String tipo, long expiraEnSegundos,
		UUID idUsuario, String nombre) {
}
