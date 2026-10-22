package co.edu.uco.agrotrack.modulos.autenticacion.dominio;

import java.util.UUID;

/** Cuenta del campesino. La clave nunca se guarda: solo su hash. */
public class Usuario {

	private final UUID id;
	private final String correo;
	private final String nombre;
	private final String claveHash;
	private final boolean activo;

	public Usuario(UUID id, String correo, String nombre, String claveHash, boolean activo) {
		this.id = id;
		this.correo = correo;
		this.nombre = nombre;
		this.claveHash = claveHash;
		this.activo = activo;
	}

	/** Cuenta nueva: el correo se guarda en minusculas para que no haya dos cuentas iguales. */
	public static Usuario nuevo(String correo, String nombre, String claveHash) {
		return new Usuario(UUID.randomUUID(), correo.toLowerCase(), nombre, claveHash, true);
	}

	public UUID getId() {
		return id;
	}

	public String getCorreo() {
		return correo;
	}

	public String getNombre() {
		return nombre;
	}

	public String getClaveHash() {
		return claveHash;
	}

	public boolean isActivo() {
		return activo;
	}
}
