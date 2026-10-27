package co.edu.uco.agrotrack.modulos.autenticacion.dominio;

import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;

/** Cuenta del campesino. Entra con su nombre de usuario o su correo. La clave nunca se guarda: solo su hash. */
public class Usuario {

	/** 3 a 30 letras minusculas, numeros, punto o guion bajo; empieza por letra o numero. */
	private static final Pattern NOMBRE_USUARIO = Pattern.compile("^[a-z0-9][a-z0-9._]{2,29}$");

	private final UUID id;
	private final String correo;
	private final String nombreUsuario;
	private final String nombre;
	private final String claveHash;
	private final boolean activo;

	public Usuario(UUID id, String correo, String nombreUsuario, String nombre, String claveHash, boolean activo) {
		this.id = id;
		this.correo = correo;
		this.nombreUsuario = nombreUsuario;
		this.nombre = nombre;
		this.claveHash = claveHash;
		this.activo = activo;
	}

	/**
	 * Cuenta nueva: correo y nombre de usuario se guardan en minusculas para que no haya dos
	 * cuentas iguales que solo cambian en mayusculas.
	 */
	public static Usuario nuevo(String correo, String nombreUsuario, String nombre, String claveHash) {
		return new Usuario(UUID.randomUUID(), correo.trim().toLowerCase(Locale.ROOT), normalizar(nombreUsuario),
				nombre.trim(), claveHash, true);
	}

	/** Nombre de usuario en minusculas y sin espacios a los lados; si no cumple las reglas, se rechaza. */
	public static String normalizar(String nombreUsuario) {
		String limpio = nombreUsuario.trim().toLowerCase(Locale.ROOT);
		if (!NOMBRE_USUARIO.matcher(limpio).matches()) {
			throw ExcepcionAgroTrack.validacion("El nombre de usuario debe tener de 3 a 30 letras o números, "
					+ "sin espacios ni tildes (puede usar punto o guion bajo). Ejemplo: jose.perez");
		}
		return limpio;
	}

	/** Lo que el campesino escribe para entrar: si tiene @ es un correo, si no un nombre de usuario. */
	public static boolean esCorreo(String usuarioOCorreo) {
		return usuarioOCorreo.contains("@");
	}

	public UUID getId() {
		return id;
	}

	public String getCorreo() {
		return correo;
	}

	public String getNombreUsuario() {
		return nombreUsuario;
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
