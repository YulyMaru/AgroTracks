package co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.entrada;

/** Puerto de entrada: registro, inicio de sesion y renovacion silenciosa de tokens (ADR-011). */
public interface GestionarSesiones {

	SesionEmitida registrar(String correo, String nombre, String clave);

	SesionEmitida iniciarSesion(String correo, String clave);

	SesionEmitida renovar(String refreshToken);

	void cerrarSesion(String refreshToken);
}
