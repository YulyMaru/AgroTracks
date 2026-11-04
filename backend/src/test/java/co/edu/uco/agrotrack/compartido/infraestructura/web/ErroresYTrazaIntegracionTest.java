package co.edu.uco.agrotrack.compartido.infraestructura.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Manejo centralizado de errores y trazabilidad (SPIKE-021, SPIKE-024; ADR-021, ADR-024): todos los
 * errores tienen la misma estructura, un mensaje en espanol para el campesino y el idTraza de la
 * peticion, el mismo que viaja en el header X-Trace-Id.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ErroresYTrazaIntegracionTest {

	private static final List<String> CAMPOS = List.of("codigo", "mensaje", "detalles", "fechaHora", "idTraza");

	@Autowired
	MockMvc mvc;

	@Autowired
	JsonMapper json;

	String token;

	@BeforeEach
	void registrar() throws Exception {
		String sufijo = UUID.randomUUID().toString().substring(0, 8);
		String cuerpo = json.writeValueAsString(Map.of("correo", "traza-" + sufijo + "@agrotrack.test",
				"nombreUsuario", "traza_" + sufijo, "nombre", "Campesino", "clave", "claveSegura123"));
		token = json.readTree(mvc.perform(post("/api/v1/autenticacion/registro")
				.contentType(MediaType.APPLICATION_JSON).content(cuerpo))
				.andReturn().getResponse().getContentAsString()).get("accessToken").asString();
	}

	@Test
	void elIdTrazaQueMandaElCelularVuelveEnLaRespuesta() throws Exception {
		MockHttpServletResponse respuesta = mvc.perform(get("/api/v1/sincronizacion/estado")
				.header(FiltroTraza.HEADER, "traza-del-celular-123")).andReturn().getResponse();
		assertThat(respuesta.getHeader(FiltroTraza.HEADER)).isEqualTo("traza-del-celular-123");

		// Si no llega (o llega demasiado largo), el servidor genera uno.
		String generado = mvc.perform(get("/api/v1/sincronizacion/estado")).andReturn().getResponse()
				.getHeader(FiltroTraza.HEADER);
		assertThat(UUID.fromString(generado)).isNotNull();
		assertThat(mvc.perform(get("/api/v1/sincronizacion/estado").header(FiltroTraza.HEADER, "x".repeat(65)))
				.andReturn().getResponse().getHeader(FiltroTraza.HEADER)).hasSize(36);
	}

	@Test
	void todosLosErroresTienenLaMismaEstructuraYSuIdTraza() throws Exception {
		UUID id = UUID.randomUUID();
		Map<String, MockHttpServletRequestBuilder> casos = Map.of(
				"401 sin sesion", get("/api/v1/registros/fincas"),
				"400 datos invalidos", post("/api/v1/registros/fincas/" + id).header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON).content("{\"nombre\":\"\"}"),
				"400 json roto", post("/api/v1/sincronizacion/operaciones").header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON).content("{ esto no es json"),
				"404 ruta", get("/api/v1/no-existe").header("Authorization", "Bearer " + token),
				"404 registro", put("/api/v1/registros/fincas/" + id).param("version", "1")
						.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
						.content("{\"nombre\":\"A\",\"municipio\":\"B\",\"vereda\":\"C\"}"),
				"405 metodo", delete("/api/v1/sincronizacion/estado").header("Authorization", "Bearer " + token),
				"401 clave", post("/api/v1/autenticacion/inicio-sesion").contentType(MediaType.APPLICATION_JSON)
						.content("{\"usuario\":\"nadie\",\"clave\":\"claveMala123\"}"));

		for (var caso : casos.entrySet()) {
			String traza = "traza-" + caso.getKey().replace(' ', '-');
			MockHttpServletResponse respuesta = mvc.perform(caso.getValue().header(FiltroTraza.HEADER, traza))
					.andReturn().getResponse();
			assertThat(respuesta.getStatus()).as(caso.getKey()).isBetween(400, 499);
			JsonNode cuerpo = json.readTree(respuesta.getContentAsString());
			assertThat(cuerpo.propertyNames()).as(caso.getKey()).containsExactlyInAnyOrderElementsOf(CAMPOS);
			assertThat(cuerpo.get("mensaje").asString()).as(caso.getKey()).isNotBlank().doesNotContain("Exception");
			assertThat(cuerpo.get("idTraza").asString()).as(caso.getKey()).isEqualTo(traza);
			assertThat(respuesta.getHeader(FiltroTraza.HEADER)).as(caso.getKey()).isEqualTo(traza);
		}
	}
}
