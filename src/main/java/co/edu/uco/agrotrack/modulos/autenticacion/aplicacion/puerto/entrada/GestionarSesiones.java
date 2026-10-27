package co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.entrada;

/** Puerto de entrada: registro, inicio de sesion y renovacion silenciosa de tokens (ADR-011). */
public interface GestionarSesiones {

	SesionEmitida registrar(String correo, String nombreUsuario, String nombre, String clave);

	/** Entra con el nombre de usuario o con el correo. */
	SesionEmitida iniciarSesion(String usuarioOCorreo, String clave);

	SesionEmitida renovar(String refreshToken);

	void cerrarSesion(String refreshToken);
}
