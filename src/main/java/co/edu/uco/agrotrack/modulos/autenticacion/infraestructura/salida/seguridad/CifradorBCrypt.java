package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.salida.seguridad;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.CifradorClaves;

/** Adaptador de salida: claves con el PasswordEncoder de Spring Security (BCrypt). */
@Component
class CifradorBCrypt implements CifradorClaves {

	private final PasswordEncoder passwordEncoder;

	CifradorBCrypt(PasswordEncoder passwordEncoder) {
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public String cifrar(String clave) {
		return passwordEncoder.encode(clave);
	}

	@Override
	public boolean coincide(String clave, String claveHash) {
		return passwordEncoder.matches(clave, claveHash);
	}
}
