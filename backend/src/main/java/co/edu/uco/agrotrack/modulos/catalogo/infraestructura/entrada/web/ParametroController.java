package co.edu.uco.agrotrack.modulos.catalogo.infraestructura.entrada.web;

import java.time.Instant;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.entrada.ConsultarCatalogo;

/** Adaptador de entrada: {@code GET /api/v1/parametros?desde=}. */
@RestController
@RequestMapping("/api/v1/parametros")
class ParametroController {

	private final ConsultarCatalogo catalogo;

	ParametroController(ConsultarCatalogo catalogo) {
		this.catalogo = catalogo;
	}

	@GetMapping
	List<ParametroRespuesta> listar(@RequestParam(required = false) Instant desde) {
		return catalogo.listar(desde).stream().map(ParametroRespuesta::de).toList();
	}
}
