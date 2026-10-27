package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.entrada.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.entrada.GestionarSesiones;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.entrada.SesionEmitida;
import co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.entrada.web.AutenticacionPeticiones.InicioSesionPeticion;
import co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.entrada.web.AutenticacionPeticiones.RegistroPeticion;
import co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.entrada.web.AutenticacionPeticiones.RenovacionPeticion;
import jakarta.validation.Valid;

/** Adaptador de entrada: {@code /api/v1/autenticacion}. */
@RestController
@RequestMapping("/api/v1/autenticacion")
class AutenticacionController {

	private final GestionarSesiones sesiones;

	AutenticacionController(GestionarSesiones sesiones) {
		this.sesiones = sesiones;
	}

	@PostMapping("/registro")
	@ResponseStatus(HttpStatus.CREATED)
	SesionEmitida registrar(@Valid @RequestBody RegistroPeticion peticion) {
		return sesiones.registrar(peticion.correo(), peticion.nombreUsuario(), peticion.nombre(), peticion.clave());
	}

	@PostMapping("/inicio-sesion")
	SesionEmitida iniciarSesion(@Valid @RequestBody InicioSesionPeticion peticion) {
		return sesiones.iniciarSesion(peticion.usuario(), peticion.clave());
	}

	@PostMapping("/renovacion")
	SesionEmitida renovar(@Valid @RequestBody RenovacionPeticion peticion) {
		return sesiones.renovar(peticion.refreshToken());
	}

	@PostMapping("/cierre-sesion")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void cerrarSesion(@Valid @RequestBody RenovacionPeticion peticion) {
		sesiones.cerrarSesion(peticion.refreshToken());
	}
}
