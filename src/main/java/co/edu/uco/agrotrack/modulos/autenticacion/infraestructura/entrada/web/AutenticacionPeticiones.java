package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.entrada.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Cuerpos JSON que recibe el controlador de autenticacion. */
final class AutenticacionPeticiones {

	private AutenticacionPeticiones() {
	}

	record RegistroPeticion(
			@NotBlank @Email @Size(max = 150) String correo,
			@NotBlank @Size(max = 120) String nombre,
			@NotBlank @Size(min = 8, max = 72, message = "La clave debe tener entre 8 y 72 caracteres") String clave) {
	}

	record InicioSesionPeticion(@NotBlank @Email String correo, @NotBlank String clave) {
	}

	record RenovacionPeticion(@NotBlank String refreshToken) {
	}
}
