package co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida;

/** Puerto de salida: cifrar claves y comprobarlas (BCrypt en la implementacion actual). */
public interface CifradorClaves {

	String cifrar(String clave);

	boolean coincide(String clave, String claveHash);
}
