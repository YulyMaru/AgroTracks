package co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.servicio;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.Transacciones;
import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.entrada.GestionarSesiones;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.entrada.SesionEmitida;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.CifradorClaves;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.EmisorTokenAcceso;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.TokenRenovacionRepositorio;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.UsuarioRepositorio;
import co.edu.uco.agrotrack.modulos.autenticacion.dominio.TokenRenovacion;
import co.edu.uco.agrotrack.modulos.autenticacion.dominio.Usuario;

/**
 * Casos de uso de sesion (ADR-011): access token corto y refresh token largo con rotacion.
 * No conoce Spring: la base de datos, el cifrado y la firma llegan por puertos.
 */
public class AutenticacionServicio implements GestionarSesiones {

	private static final SecureRandom ALEATORIO = new SecureRandom();

	private final UsuarioRepositorio usuarios;
	private final TokenRenovacionRepositorio tokens;
	private final CifradorClaves cifrador;
	private final EmisorTokenAcceso emisor;
	private final Transacciones transacciones;
	private final Duration vigenciaRenovacion;

	public AutenticacionServicio(UsuarioRepositorio usuarios, TokenRenovacionRepositorio tokens,
			CifradorClaves cifrador, EmisorTokenAcceso emisor, Transacciones transacciones,
			Duration vigenciaRenovacion) {
		this.usuarios = usuarios;
		this.tokens = tokens;
		this.cifrador = cifrador;
		this.emisor = emisor;
		this.transacciones = transacciones;
		this.vigenciaRenovacion = vigenciaRenovacion;
	}

	@Override
	public SesionEmitida registrar(String correo, String nombreUsuario, String nombre, String clave) {
		String usuarioNormalizado = Usuario.normalizar(nombreUsuario);
		return transacciones.ejecutar(() -> {
			if (usuarios.existeCorreo(correo)) {
				throw new ExcepcionAgroTrack(CodigoError.CONFLICTO, "Ya existe una cuenta con ese correo.");
			}
			if (usuarios.existeNombreUsuario(usuarioNormalizado)) {
				throw new ExcepcionAgroTrack(CodigoError.CONFLICTO,
						"Ese nombre de usuario ya lo tiene otra persona. Pruebe con otro, por ejemplo agregando un número.");
			}
			Usuario usuario = usuarios.guardar(Usuario.nuevo(correo, usuarioNormalizado, nombre, cifrador.cifrar(clave)));
			return emitir(usuario);
		});
	}

	@Override
	public SesionEmitida iniciarSesion(String usuarioOCorreo, String clave) {
		String buscado = usuarioOCorreo.trim();
		return transacciones.ejecutar(() -> {
			var encontrado = Usuario.esCorreo(buscado) ? usuarios.buscarPorCorreo(buscado)
					: usuarios.buscarPorNombreUsuario(buscado.toLowerCase(java.util.Locale.ROOT));
			Usuario usuario = encontrado
					.filter(Usuario::isActivo)
					.filter(u -> cifrador.coincide(clave, u.getClaveHash()))
					.orElseThrow(() -> new ExcepcionAgroTrack(CodigoError.AUTENTICACION_REQUERIDA,
							"Usuario o clave incorrectos."));
			return emitir(usuario);
		});
	}

	@Override
	public SesionEmitida renovar(String refreshToken) {
		return transacciones.ejecutar(() -> {
			TokenRenovacion actual = tokens.buscarPorHash(hash(refreshToken))
					.filter(TokenRenovacion::esValido)
					.orElseThrow(() -> new ExcepcionAgroTrack(CodigoError.AUTENTICACION_REQUERIDA,
							"Tu sesión venció. Inicia sesión nuevamente."));
			actual.revocar();
			tokens.guardar(actual);
			Usuario usuario = usuarios.buscarPorId(actual.getIdUsuario())
					.filter(Usuario::isActivo)
					.orElseThrow(() -> new ExcepcionAgroTrack(CodigoError.AUTENTICACION_REQUERIDA,
							"Tu cuenta no está activa."));
			return emitir(usuario);
		});
	}

	@Override
	public void cerrarSesion(String refreshToken) {
		transacciones.ejecutar(() -> {
			tokens.buscarPorHash(hash(refreshToken)).ifPresent(token -> {
				token.revocar();
				tokens.guardar(token);
			});
			return null;
		});
	}

	private SesionEmitida emitir(Usuario usuario) {
		EmisorTokenAcceso.TokenAcceso acceso = emisor.emitir(usuario);
		byte[] bytes = new byte[32];
		ALEATORIO.nextBytes(bytes);
		String refreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		tokens.guardar(TokenRenovacion.nuevo(usuario.getId(), hash(refreshToken), Instant.now().plus(vigenciaRenovacion)));
		return new SesionEmitida(acceso.valor(), refreshToken, "Bearer", acceso.vigenciaSegundos(), usuario.getId(),
				usuario.getNombre());
	}

	private static String hash(String valor) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(digest.digest(valor.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}
}
