package co.edu.uco.agrotrack;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import io.micrometer.core.instrument.MeterRegistry;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * La plataforma del backend (SPIKE-016, SPIKE-019, SPIKE-021, SPIKE-029): migraciones de Flyway,
 * documentacion OpenAPI, salud y metricas de Actuator/Micrometer, y catalogo de parametros con
 * consulta incremental y desactivacion sin romper los datos historicos.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PlataformaIntegracionTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JsonMapper json;

	@Autowired
	Flyway flyway;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	MeterRegistry metricas;

	String token;

	@BeforeEach
	void registrar() throws Exception {
		String sufijo = UUID.randomUUID().toString().substring(0, 8);
		String cuerpo = json.writeValueAsString(Map.of("correo", "plataforma-" + sufijo + "@agrotrack.test",
				"nombreUsuario", "plataforma_" + sufijo, "nombre", "Campesino", "clave", "claveSegura123"));
		token = json.readTree(mvc.perform(post("/api/v1/autenticacion/registro")
				.contentType(MediaType.APPLICATION_JSON).content(cuerpo))
				.andReturn().getResponse().getContentAsString()).get("accessToken").asString();
	}

	@Test
	void flywayAplicoLasCincoMigracionesEnOrdenYNoQuedaNadaPendiente() {
		MigrationInfo[] aplicadas = flyway.info().applied();
		assertThat(Arrays.stream(aplicadas).map(m -> m.getVersion().getVersion()))
				.containsExactly("1", "2", "3", "4", "5");
		assertThat(aplicadas).allMatch(m -> m.getState() == MigrationState.SUCCESS);
		assertThat(flyway.info().pending()).isEmpty();
		// Volver a migrar no aplica nada (las migraciones son reproducibles y no se repiten).
		assertThat(flyway.migrate().migrationsExecuted).isZero();
		// Hibernate arranco con ddl-auto=validate: el esquema de Flyway coincide con las entidades.
	}

	@Test
	void openApiDocumentaLasRutasDeLaApi() throws Exception {
		JsonNode documento = json.readTree(mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString());
		assertThat(documento.get("openapi").asString()).startsWith("3.");
		assertThat(documento.get("paths").propertyNames()).contains("/api/v1/autenticacion/inicio-sesion",
				"/api/v1/autenticacion/renovacion", "/api/v1/sincronizacion/operaciones",
				"/api/v1/sincronizacion/cambios", "/api/v1/parametros", "/api/v1/registros/{tipo}");
	}

	@Test
	void saludPublicaYMetricasDeSincronizacion() throws Exception {
		mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
		mvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());

		double antes = contador();
		Map<String, Object> operacion = new HashMap<>();
		operacion.put("idOperacion", UUID.randomUUID().toString());
		operacion.put("entidad", "FINCA");
		operacion.put("accion", "CREAR");
		operacion.put("idRegistro", UUID.randomUUID().toString());
		operacion.put("versionBase", 0);
		operacion.put("creadoEn", Instant.now().toString());
		operacion.put("reintentos", 2);
		operacion.put("contenido", Map.of("nombre", "Metrica", "municipio", "Rionegro", "vereda", "X"));
		mvc.perform(post("/api/v1/sincronizacion/operaciones").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(Map.of("operaciones", List.of(operacion)))))
				.andExpect(status().isOk());

		assertThat(contador()).isEqualTo(antes + 1);
		assertThat(metricas.find("agrotrack.sincronizacion.lote").timer()).isNotNull();
		assertThat(metricas.find("agrotrack.sincronizacion.reintentos").counter()).isNotNull();
		mvc.perform(get("/actuator/metrics/agrotrack.sincronizacion.operaciones")
				.header("Authorization", "Bearer " + token)).andExpect(status().isOk());
	}

	@Test
	void catalogoCompletoIncrementalYDesactivacionSinRomperLoHistorico() throws Exception {
		JsonNode todos = parametros(null);
		assertThat(todos.size()).isGreaterThan(20);
		assertThat(todos).allMatch(p -> p.get("activo").asBoolean());
		Instant marca = Instant.now();
		assertThat(parametros(marca.plusSeconds(60)).size()).isZero();

		// Un gasto ya guardado con la categoria SERVICIOS...
		UUID finca = UUID.randomUUID();
		UUID gasto = UUID.randomUUID();
		crear("fincas", finca, Map.of("nombre", "Historica", "municipio", "Rionegro", "vereda", "X"));
		crear("gastos", gasto, Map.of("fecha", LocalDate.now().toString(), "categoria", "SERVICIOS",
				"concepto", "Luz", "valor", 40_000, "nivelAsignacion", "FINCA", "idAsignacion", finca.toString()));
		try {
			// ...y luego se desactiva la categoria en el catalogo.
			jdbc.update("UPDATE parametros SET activo = FALSE, actualizado_en = ? WHERE tipo = 'CATEGORIA_GASTO'"
					+ " AND codigo = 'SERVICIOS'", java.sql.Timestamp.from(Instant.now().plusSeconds(1)));

			JsonNode cambios = parametros(marca);
			assertThat(cambios.size()).isEqualTo(1);
			assertThat(cambios.get(0).get("codigo").asString()).isEqualTo("SERVICIOS");
			assertThat(cambios.get(0).get("activo").asBoolean()).isFalse();
			assertThat(parametros(null)).noneMatch(p -> p.get("codigo").asString().equals("SERVICIOS"));

			// El gasto historico sigue ahi, con su categoria.
			mvc.perform(get("/api/v1/registros/gastos").header("Authorization", "Bearer " + token))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$[0].id").value(gasto.toString()))
					.andExpect(jsonPath("$[0].categoria").value("SERVICIOS"));
		} finally {
			jdbc.update("UPDATE parametros SET activo = TRUE WHERE tipo = 'CATEGORIA_GASTO' AND codigo = 'SERVICIOS'");
		}
	}

	private double contador() {
		return metricas.find("agrotrack.sincronizacion.operaciones").counters().stream()
				.mapToDouble(c -> c.count()).sum();
	}

	private void crear(String tipo, UUID id, Map<String, Object> datos) throws Exception {
		mvc.perform(post("/api/v1/registros/" + tipo + "/" + id).header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(datos)))
				.andExpect(status().isCreated());
	}

	private JsonNode parametros(Instant desde) throws Exception {
		var peticion = get("/api/v1/parametros").header("Authorization", "Bearer " + token);
		if (desde != null) {
			peticion = peticion.param("desde", desde.toString());
		}
		return json.readTree(mvc.perform(peticion).andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString());
	}
}
