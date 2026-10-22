package co.edu.uco.agrotrack.modulos.registros.infraestructura.entrada.web;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.edu.uco.agrotrack.compartido.infraestructura.seguridad.UsuarioAutenticado;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.GestionarRegistros;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.CambioVista;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;

/**
 * Adaptador de entrada: API directa de los registros (con conexion). {@code {tipo}} es fincas,
 * lotes, cultivos, cosechas, ventas, gastos, otros-ingresos o labores. El id lo genera el celular (R3).
 * <ul>
 * <li>{@code POST /{tipo}/{id}} crea (201) o devuelve el que ya existia (200).</li>
 * <li>{@code PUT /{tipo}/{id}?version=N} edita si el registro sigue en la version N.</li>
 * <li>{@code DELETE /{tipo}/{id}?version=N} elimina (borrado logico).</li>
 * <li>{@code GET /{tipo}/{id}/historial} copias anteriores del registro.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/registros/{tipo}")
class RegistrosController {

	private final GestionarRegistros registros;

	RegistrosController(GestionarRegistros registros) {
		this.registros = registros;
	}

	@GetMapping
	List<Object> listar(@AuthenticationPrincipal Jwt jwt, @PathVariable String tipo) {
		return registros.listar(UsuarioAutenticado.id(jwt), Entidad.deRuta(tipo));
	}

	@PostMapping("/{id}")
	ResponseEntity<Object> crear(@AuthenticationPrincipal Jwt jwt, @PathVariable String tipo, @PathVariable UUID id,
			@RequestBody Map<String, Object> datos) {
		var resultado = registros.crear(UsuarioAutenticado.id(jwt), Entidad.deRuta(tipo), id, datos);
		return ResponseEntity.status(resultado.yaAplicado() ? HttpStatus.OK : HttpStatus.CREATED)
				.body(resultado.registro());
	}

	@PutMapping("/{id}")
	Object editar(@AuthenticationPrincipal Jwt jwt, @PathVariable String tipo, @PathVariable UUID id,
			@RequestParam int version, @RequestBody Map<String, Object> datos) {
		return registros.editar(UsuarioAutenticado.id(jwt), Entidad.deRuta(tipo), id, version, datos).registro();
	}

	@DeleteMapping("/{id}")
	Object eliminar(@AuthenticationPrincipal Jwt jwt, @PathVariable String tipo, @PathVariable UUID id,
			@RequestParam int version) {
		return registros.eliminar(UsuarioAutenticado.id(jwt), Entidad.deRuta(tipo), id, version).registro();
	}

	@GetMapping("/{id}/historial")
	List<CambioVista> historial(@AuthenticationPrincipal Jwt jwt, @PathVariable String tipo, @PathVariable UUID id) {
		return registros.historial(UsuarioAutenticado.id(jwt), Entidad.deRuta(tipo), id);
	}
}
