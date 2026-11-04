package co.edu.uco.agrotrack.modulos.sincronizacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.Transacciones;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Idempotencia y transacciones (SPIKE-001, SPIKE-007, SPIKE-013, SPIKE-015, SPIKE-016, SPIKE-020,
 * SPIKE-024; ADR-007, ADR-013): la MISMA operacion enviada 5 veces deja exactamente 1 registro, y un
 * trabajo que falla a mitad de camino no deja nada guardado.
 */
@SpringBootTest
@AutoConfigureMockMvc
class IdempotenciaIntegracionTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JsonMapper json;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	Transacciones transacciones;

	String token;

	@BeforeEach
	void registrar() throws Exception {
		String sufijo = UUID.randomUUID().toString().substring(0, 8);
		String cuerpo = json.writeValueAsString(Map.of("correo", "idem-" + sufijo + "@agrotrack.test",
				"nombreUsuario", "idem_" + sufijo, "nombre", "Campesino", "clave", "claveSegura123"));
		token = json.readTree(mvc.perform(post("/api/v1/autenticacion/registro")
				.contentType(MediaType.APPLICATION_JSON).content(cuerpo))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString()).get("accessToken").asString();
	}

	@Test
	void cincoEnviosDeLaMismaOperacionDejanUnSoloRegistro() throws Exception {
		UUID finca = UUID.randomUUID();
		UUID gasto = UUID.randomUUID();
		List<Map<String, Object>> cola = List.of(
				operacion("FINCA", finca, Map.of("nombre", "La Cumbre", "municipio", "Rionegro", "vereda", "Abreo")),
				operacion("GASTO", gasto, Map.of("fecha", LocalDate.now().toString(), "categoria", "MANO_DE_OBRA",
						"concepto", "Desyerba", "valor", 120_000, "nivelAsignacion", "FINCA",
						"idAsignacion", finca.toString())));

		List<String> estados = new ArrayList<>();
		for (int envio = 1; envio <= 5; envio++) {
			JsonNode respuesta = sincronizar("/api/v1/sincronizacion/operaciones", cola);
			respuesta.get("resultados").forEach(r -> estados.add(r.get("estado").asString()));
		}

		assertThat(estados.subList(0, 2)).containsOnly("SINCRONIZADO");
		assertThat(estados.subList(2, 10)).containsOnly("YA_REGISTRADO");
		assertThat(contar("fincas", finca)).isEqualTo(1);
		assertThat(contar("gastos", gasto)).isEqualTo(1);
		assertThat(jdbc.queryForObject("SELECT count(*) FROM operaciones_sincronizadas WHERE id_operacion IN (?, ?)",
				Integer.class, UUID.fromString((String) cola.get(0).get("idOperacion")),
				UUID.fromString((String) cola.get(1).get("idOperacion")))).isEqualTo(2);

		// El celular puede preguntar por una operacion si perdio la respuesta.
		mvc.perform(get("/api/v1/sincronizacion/operaciones/" + cola.get(0).get("idOperacion"))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk());
	}

	@Test
	void laRutaDeTransaccionesSoloAceptaGastosEIngresos() throws Exception {
		UUID finca = UUID.randomUUID();
		JsonNode respuesta = sincronizar("/api/v1/sincronizacion/transacciones", List.of(
				operacion("FINCA", finca, Map.of("nombre", "No va", "municipio", "Rionegro", "vereda", "X"))));
		assertThat(respuesta.get("resultados").get(0).get("estado").asString()).isEqualTo("ERROR");
		assertThat(contar("fincas", finca)).isZero();
	}

	@Test
	void unTrabajoQueFallaAMitadNoDejaNadaGuardado() {
		UUID usuario = jdbc.queryForObject("SELECT id FROM usuarios ORDER BY creado_en DESC LIMIT 1", UUID.class);
		UUID finca = UUID.randomUUID();
		assertThatThrownBy(() -> transacciones.ejecutar(() -> {
			jdbc.update("INSERT INTO fincas (id, id_usuario, nombre, municipio, vereda, version, eliminado, creado_en,"
					+ " actualizado_en) VALUES (?, ?, 'A medias', 'Rionegro', 'X', 1, FALSE, CURRENT_TIMESTAMP,"
					+ " CURRENT_TIMESTAMP)", finca, usuario);
			throw new IllegalStateException("se cayo el servidor");
		})).hasMessage("se cayo el servidor");
		assertThat(contar("fincas", finca)).isZero();
	}

	private int contar(String tabla, UUID id) {
		return jdbc.queryForObject("SELECT count(*) FROM " + tabla + " WHERE id = ?", Integer.class, id);
	}

	private JsonNode sincronizar(String ruta, List<Map<String, Object>> operaciones) throws Exception {
		return json.readTree(mvc.perform(post(ruta).header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(Map.of("operaciones", operaciones))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.resultados").isArray())
				.andReturn().getResponse().getContentAsString());
	}

	private static Map<String, Object> operacion(String entidad, UUID idRegistro, Map<String, Object> contenido) {
		Map<String, Object> operacion = new HashMap<>();
		operacion.put("idOperacion", UUID.randomUUID().toString());
		operacion.put("entidad", entidad);
		operacion.put("accion", "CREAR");
		operacion.put("idRegistro", idRegistro.toString());
		operacion.put("versionBase", 0);
		operacion.put("creadoEn", Instant.now().toString());
		operacion.put("reintentos", 0);
		operacion.put("contenido", contenido);
		return operacion;
	}
}
