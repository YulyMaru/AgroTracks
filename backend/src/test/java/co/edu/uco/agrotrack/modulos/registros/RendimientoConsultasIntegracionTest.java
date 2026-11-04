package co.edu.uco.agrotrack.modulos.registros;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Rendimiento de las consultas del backend con el volumen maximo de los spikes (SPIKE-009, SPIKE-013,
 * SPIKE-015, SPIKE-016): 500 fincas, 2.000 lotes, 50 cultivos y 10.000 gastos de un mismo usuario.
 * Umbral de los spikes: 3 s por consulta. Se mide la respuesta HTTP completa (seguridad, consulta y
 * JSON) contra la base H2 en memoria de las pruebas; en PostgreSQL se debe repetir con
 * TestcontainersConfiguration.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class RendimientoConsultasIntegracionTest {

	private static final int FINCAS = 500;
	private static final int LOTES = 2_000;
	private static final int CULTIVOS = 50;
	private static final int GASTOS = 10_000;
	private static final long UMBRAL_MS = 3_000;

	@Autowired
	MockMvc mvc;

	@Autowired
	JsonMapper json;

	@Autowired
	JdbcTemplate jdbc;

	String token;
	final Map<String, Long> tiempos = new LinkedHashMap<>();

	@BeforeAll
	void cargarDatos() throws Exception {
		String sufijo = UUID.randomUUID().toString().substring(0, 8);
		String cuerpo = json.writeValueAsString(Map.of("correo", "volumen-" + sufijo + "@agrotrack.test",
				"nombreUsuario", "volumen_" + sufijo, "nombre", "Campesino", "clave", "claveSegura123"));
		JsonNode sesion = json.readTree(mvc.perform(post("/api/v1/autenticacion/registro")
				.contentType(MediaType.APPLICATION_JSON).content(cuerpo))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
		token = sesion.get("accessToken").asString();
		UUID usuario = UUID.fromString(sesion.get("idUsuario").asString());

		Timestamp ahora = Timestamp.from(Instant.now());
		List<UUID> fincas = ids(FINCAS);
		List<UUID> lotes = ids(LOTES);
		List<UUID> cultivos = ids(CULTIVOS);

		jdbc.batchUpdate("INSERT INTO fincas (id, id_usuario, nombre, municipio, vereda, version, eliminado, creado_en,"
				+ " actualizado_en) VALUES (?, ?, ?, 'Rionegro', 'Llanogrande', 1, FALSE, ?, ?)",
				filas(FINCAS, i -> new Object[] { fincas.get(i), usuario, "Finca " + i, ahora, ahora }));
		jdbc.batchUpdate("INSERT INTO lotes (id, id_usuario, id_finca, nombre, area, unidad_area, version, eliminado,"
				+ " creado_en, actualizado_en) VALUES (?, ?, ?, ?, 2, 'HECTAREA', 1, FALSE, ?, ?)",
				filas(LOTES, i -> new Object[] { lotes.get(i), usuario, fincas.get(i % FINCAS), "Lote " + i, ahora, ahora }));
		jdbc.batchUpdate("INSERT INTO cultivos (id, id_usuario, id_lote, tipo_cultivo, especie, fecha_siembra, version,"
				+ " eliminado, creado_en, actualizado_en) VALUES (?, ?, ?, 'CAFE', 'Castillo', ?, 1, FALSE, ?, ?)",
				filas(CULTIVOS, i -> new Object[] { cultivos.get(i), usuario, lotes.get(i), LocalDate.of(2025, 3, 1),
						ahora, ahora }));
		jdbc.batchUpdate("INSERT INTO gastos (id, id_usuario, fecha, categoria, concepto, valor, nivel_asignacion,"
				+ " id_asignacion, id_finca, version, eliminado, creado_en, actualizado_en)"
				+ " VALUES (?, ?, ?, 'MANO_DE_OBRA', ?, ?, 'FINCA', ?, ?, 1, FALSE, ?, ?)",
				filas(GASTOS, i -> {
					UUID finca = fincas.get(i % FINCAS);
					return new Object[] { UUID.randomUUID(), usuario, LocalDate.of(2026, 1 + i % 10, 1 + i % 28),
							"Jornal " + i, 50_000 + i, finca, finca, ahora, ahora };
				}));
	}

	@Test
	void listarFincasLotesCultivosYGastosConElVolumenMaximo() throws Exception {
		assertThat(medir("GET /registros/fincas", "/api/v1/registros/fincas")).isEqualTo(FINCAS);
		assertThat(medir("GET /registros/lotes", "/api/v1/registros/lotes")).isEqualTo(LOTES);
		assertThat(medir("GET /registros/cultivos", "/api/v1/registros/cultivos")).isEqualTo(CULTIVOS);
		assertThat(medir("GET /registros/gastos", "/api/v1/registros/gastos")).isEqualTo(GASTOS);
	}

	@Test
	void descargarTodoParaLaConsultaOfflineConElVolumenMaximo() throws Exception {
		long inicio = System.nanoTime();
		JsonNode cambios = json.readTree(mvc.perform(get("/api/v1/sincronizacion/cambios")
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		long ms = (System.nanoTime() - inicio) / 1_000_000;
		tiempos.put("GET /sincronizacion/cambios (12.550 registros)", ms);
		assertThat(cambios.get("cambios").get("GASTO").size()).isEqualTo(GASTOS);
		assertThat(ms).isLessThan(UMBRAL_MS);
	}

	@Test
	void resumenEconomicoSqlDeDiezMilGastos() {
		long inicio = System.nanoTime();
		List<Map<String, Object>> porMes = jdbc.queryForList("SELECT EXTRACT(MONTH FROM fecha) AS mes, SUM(valor) AS"
				+ " total, count(*) AS n FROM gastos g JOIN usuarios u ON u.id = g.id_usuario WHERE u.correo LIKE"
				+ " 'volumen-%' AND g.eliminado = FALSE GROUP BY EXTRACT(MONTH FROM fecha)");
		long ms = (System.nanoTime() - inicio) / 1_000_000;
		tiempos.put("SUM(valor) por mes de 10.000 gastos (SQL)", ms);
		assertThat(porMes.stream().mapToLong(f -> ((Number) f.get("n")).longValue()).sum()).isEqualTo(GASTOS);
		assertThat(ms).isLessThan(5_000);
	}

	@AfterAll
	void informe() {
		StringBuilder informe = new StringBuilder("\n=== Rendimiento backend (H2 en memoria) ===\n");
		tiempos.forEach((consulta, ms) -> informe.append(String.format("%-48s %6d ms%n", consulta, ms)));
		System.out.println(informe);
	}

	private int medir(String nombre, String ruta) throws Exception {
		// Primera peticion (en frio) y segunda (JVM y conexiones calientes): las dos deben cumplir.
		long frio = System.nanoTime();
		mvc.perform(get(ruta).header("Authorization", "Bearer " + token)).andExpect(status().isOk());
		long msFrio = (System.nanoTime() - frio) / 1_000_000;
		tiempos.put(nombre + " (primera)", msFrio);
		assertThat(msFrio).as(nombre + " en frio").isLessThan(UMBRAL_MS);
		long inicio = System.nanoTime();
		String cuerpo = mvc.perform(get(ruta).header("Authorization", "Bearer " + token))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		long ms = (System.nanoTime() - inicio) / 1_000_000;
		tiempos.put(nombre, ms);
		assertThat(ms).as(nombre).isLessThan(UMBRAL_MS);
		return json.readTree(cuerpo).size();
	}

	private static List<UUID> ids(int n) {
		List<UUID> lista = new ArrayList<>(n);
		for (int i = 0; i < n; i++) {
			lista.add(UUID.randomUUID());
		}
		return lista;
	}

	private static List<Object[]> filas(int n, java.util.function.IntFunction<Object[]> fila) {
		List<Object[]> lista = new ArrayList<>(n);
		for (int i = 0; i < n; i++) {
			lista.add(fila.apply(i));
		}
		return lista;
	}
}
