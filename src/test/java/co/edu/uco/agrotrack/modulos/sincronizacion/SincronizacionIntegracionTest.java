package co.edu.uco.agrotrack.modulos.sincronizacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.test.web.servlet.MockMvc;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.FincaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.GastoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.LaborRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.NivelAsignacion;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Valida la sincronizacion al reconectar (HU-23, HU-44) con el modelo de datos v2
 * (docs/ModeloDeDatos.md): todo obligatorio, crear/editar/eliminar con version e historial.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SincronizacionIntegracionTest {

	private static final Instant BASE = Instant.parse("2026-10-01T10:00:00Z");

	@Autowired
	MockMvc mvc;

	@Autowired
	JsonMapper json;

	@Autowired
	FincaRepositorio fincas;

	@Autowired
	GastoRepositorio gastos;

	@Autowired
	LaborRepositorio labores;

	String token;
	String hoy;

	@BeforeEach
	void registrarUsuario() throws Exception {
		hoy = LocalDate.now().toString();
		String correo = "campesino-" + UUID.randomUUID() + "@agrotrack.test";
		String cuerpo = json.writeValueAsString(Map.of("correo", correo, "nombreUsuario",
				"campesino_" + UUID.randomUUID().toString().substring(0, 8), "nombre", "Campesino", "clave", "claveSegura123"));
		String respuesta = mvc.perform(post("/api/v1/autenticacion/registro")
				.contentType(MediaType.APPLICATION_JSON).content(cuerpo))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		token = json.readTree(respuesta).get("accessToken").asString();
	}

	@Test
	void sincronizaTodaLaColaOfflineEnOrdenYSinDuplicarAlReintentar() throws Exception {
		UUID finca = UUID.randomUUID();
		UUID lote = UUID.randomUUID();
		UUID cultivo = UUID.randomUUID();
		UUID gasto = UUID.randomUUID();
		UUID labor = UUID.randomUUID();

		// Llegan desordenadas a proposito: el servidor debe aplicar primero la finca.
		List<Map<String, Object>> cola = List.of(
				crear("VENTA", UUID.randomUUID(), 50, Map.of("idCultivo", cultivo.toString(), "fecha", hoy,
						"cantidad", 10, "unidad", "ARROBA", "valorTotal", 1_200_000)),
				crear("GASTO", gasto, 60, Map.of("fecha", hoy, "categoria", "ABONOS_Y_SEMILLAS",
						"concepto", "Dos bultos de abono", "valor", 85_000, "nivelAsignacion", "LOTE",
						"idAsignacion", lote.toString())),
				crear("OTRO_INGRESO", UUID.randomUUID(), 70, Map.of("fecha", hoy, "tipoIngreso", "ALQUILER",
						"concepto", "Alquiler de potrero", "valor", 300_000, "nivelAsignacion", "FINCA",
						"idAsignacion", finca.toString())),
				crear("COSECHA", UUID.randomUUID(), 40, Map.of("idCultivo", cultivo.toString(), "fecha", hoy,
						"cantidad", 12.5, "unidad", "ARROBA")),
				crear("LABOR", labor, 80, Map.of("idCultivo", cultivo.toString(), "tipoLabor", "FERTILIZACION",
						"fecha", hoy, "descripcion", "Abonada de la loma", "horas", 6, "trabajadores", 2,
						"insumos", List.of(
								Map.of("tipoInsumo", "ABONO_FERTILIZANTE", "cantidad", 2, "unidad", "BULTO"),
								Map.of("tipoInsumo", "AGUA", "cantidad", 200, "unidad", "LITRO")))),
				crear("CULTIVO", cultivo, 30, Map.of("idLote", lote.toString(), "tipoCultivo", "CAFE",
						"especie", "Castillo", "fechaSiembra", hoy)),
				crear("LOTE", lote, 20, Map.of("idFinca", finca.toString(), "nombre", "Lote alto", "area", 2,
						"unidadArea", "CUADRA")),
				crear("FINCA", finca, 10, Map.of("nombre", "La Esperanza", "municipio", "Rionegro",
						"vereda", "Llanogrande")));

		JsonNode primera = sincronizar(cola);
		assertThat(primera.get("conError").asInt()).as(primera.toString()).isZero();
		assertThat(primera.get("sincronizadas").asInt()).isEqualTo(8);
		assertThat(primera.get("resultados").get(0).get("idRegistro").asString()).isEqualTo(finca.toString());
		assertThat(primera.get("resultados").get(0).get("versionActual").asInt()).isEqualTo(1);

		// El gasto se asigno al lote: la finca se completa sola.
		var gastoGuardado = gastos.buscar(gasto).orElseThrow();
		assertThat(gastoGuardado.getIdFinca()).isEqualTo(finca);
		assertThat(gastoGuardado.getNivelAsignacion()).isEqualTo(NivelAsignacion.LOTE);
		assertThat(labores.buscar(labor).orElseThrow().getInsumos()).hasSize(2);

		// Reintento (p. ej. se perdio la respuesta por mala senal): 3 veces la misma cola.
		for (int i = 0; i < 3; i++) {
			JsonNode reintento = sincronizar(cola);
			assertThat(reintento.get("yaRegistradas").asInt()).isEqualTo(8);
			assertThat(reintento.get("sincronizadas").asInt()).isZero();
		}

		mvc.perform(get("/api/v1/sincronizacion/cambios").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cambios.FINCA.length()").value(1))
				.andExpect(jsonPath("$.cambios.LOTE[0].unidadArea").value("CUADRA"))
				.andExpect(jsonPath("$.cambios.CULTIVO[0].especie").value("Castillo"))
				.andExpect(jsonPath("$.cambios.GASTO[0].idFinca").value(finca.toString()))
				.andExpect(jsonPath("$.cambios.LABOR[0].insumos.length()").value(2))
				.andExpect(jsonPath("$.cambios.VENTA[0].valorTotal").value(1_200_000));
	}

	@Test
	void editaYEliminaSinConexionGuardandoElHistorial() throws Exception {
		UUID finca = UUID.randomUUID();
		JsonNode respuesta = sincronizar(List.of(
				crear("FINCA", finca, 0, finca("El Porvenir")),
				editar("FINCA", finca, 1, 10, finca("El Porvenir Alto")),
				editar("FINCA", finca, 2, 20, finca("El Porvenir de Arriba")),
				eliminar("FINCA", finca, 3, 30)));

		assertThat(respuesta.get("conError").asInt()).as(respuesta.toString()).isZero();
		assertThat(respuesta.get("resultados").get(3).get("versionActual").asInt()).isEqualTo(4);
		var guardada = fincas.buscar(finca).orElseThrow();
		assertThat(guardada.isEliminado()).isTrue();
		assertThat(guardada.getNombre()).isEqualTo("El Porvenir de Arriba");

		mvc.perform(get("/api/v1/registros/fincas/" + finca + "/historial").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3))
				.andExpect(jsonPath("$[0].accion").value("ELIMINAR"))
				.andExpect(jsonPath("$[2].accion").value("EDITAR"))
				.andExpect(jsonPath("$[2].version").value(1));

		// El celular tambien recibe el borrado para quitarlo de su copia.
		mvc.perform(get("/api/v1/sincronizacion/cambios").header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.cambios.FINCA[0].eliminado").value(true));
		// Y ya no aparece en la lista.
		mvc.perform(get("/api/v1/registros/fincas").header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void unaEdicionConVersionViejaNoPisaElCambioDeOtroCelular() throws Exception {
		UUID finca = UUID.randomUUID();
		mvc.perform(post("/api/v1/registros/fincas/" + finca).header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(finca("San José"))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.version").value(1));
		// Crear de nuevo con el mismo id no duplica.
		mvc.perform(post("/api/v1/registros/fincas/" + finca).header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(finca("San José"))))
				.andExpect(status().isOk());

		mvc.perform(put("/api/v1/registros/fincas/" + finca).param("version", "1")
				.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(finca("San José de la Montaña"))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.version").value(2));

		mvc.perform(put("/api/v1/registros/fincas/" + finca).param("version", "1")
				.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(finca("Otro nombre"))))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.codigo").value("CONFLICTO"));
		assertThat(fincas.buscar(finca).orElseThrow().getNombre()).isEqualTo("San José de la Montaña");
	}

	@Test
	void noSeEliminaNiSeCambiaDeFincaLoQueTieneRegistrosQueDependen() throws Exception {
		UUID finca = UUID.randomUUID();
		UUID otraFinca = UUID.randomUUID();
		UUID lote = UUID.randomUUID();
		JsonNode respuesta = sincronizar(List.of(
				crear("FINCA", finca, 0, finca("La Palma")),
				crear("FINCA", otraFinca, 1, finca("El Retiro")),
				crear("LOTE", lote, 2, Map.of("idFinca", finca.toString(), "nombre", "Bajo", "area", 1,
						"unidadArea", "HECTAREA")),
				eliminar("FINCA", finca, 1, 3),
				editar("LOTE", lote, 1, 4, Map.of("idFinca", otraFinca.toString(), "nombre", "Bajo", "area", 1,
						"unidadArea", "HECTAREA"))));

		assertThat(respuesta.get("sincronizadas").asInt()).isEqualTo(3);
		assertThat(respuesta.get("resultados").get(3).get("codigoError").asString()).isEqualTo("CONFLICTO");
		assertThat(respuesta.get("resultados").get(4).get("codigoError").asString()).isEqualTo("ERROR_VALIDACION");
		assertThat(fincas.buscar(finca).orElseThrow().isEliminado()).isFalse();
	}

	@Test
	void ningunDatoPuedeLlegarVacioNiFueraDelCatalogoNiConFechaFutura() throws Exception {
		UUID finca = UUID.randomUUID();
		UUID lote = UUID.randomUUID();
		String manana = LocalDate.now().plusDays(1).toString();
		JsonNode respuesta = sincronizar(List.of(
				crear("FINCA", finca, 0, finca("Buena Vista")),
				crear("LOTE", lote, 1, Map.of("idFinca", finca.toString(), "nombre", "Alto", "area", 3,
						"unidadArea", "HECTAREA")),
				// Vereda con solo espacios.
				crear("FINCA", UUID.randomUUID(), 2, Map.of("nombre", "Otra", "municipio", "Marinilla",
						"vereda", "   ")),
				// Lote sin unidad de area.
				crear("LOTE", UUID.randomUUID(), 3, Map.of("idFinca", finca.toString(), "nombre", "Bajo",
						"area", 1)),
				// Fanegada ya no esta en el catalogo.
				crear("LOTE", UUID.randomUUID(), 4, Map.of("idFinca", finca.toString(), "nombre", "Medio",
						"area", 1, "unidadArea", "FANEGADA")),
				// Siembra en el futuro.
				crear("CULTIVO", UUID.randomUUID(), 5, Map.of("idLote", lote.toString(), "tipoCultivo", "MAIZ",
						"especie", "Amarillo", "fechaSiembra", manana)),
				// Pesos con centavos.
				crear("GASTO", UUID.randomUUID(), 6, Map.of("fecha", hoy, "categoria", "TRANSPORTE",
						"concepto", "Flete", "valor", 50_000.5, "nivelAsignacion", "FINCA",
						"idAsignacion", finca.toString()))));

		assertThat(respuesta.get("sincronizadas").asInt()).isEqualTo(2);
		assertThat(respuesta.get("conError").asInt()).isEqualTo(5);
	}

	@Test
	void unCampoQueElModeloNoDefineSeRechazaEnVezDePerderseEnSilencio() throws Exception {
		UUID idFinca = UUID.randomUUID();
		Map<String, Object> datos = new HashMap<>(finca("El Porvenir"));
		datos.put("observacion", "Junto al rio");
		JsonNode resultado = sincronizar(List.of(crear("FINCA", idFinca, 0, datos))).get("resultados").get(0);

		assertThat(resultado.get("estado").asString()).isEqualTo("ERROR");
		assertThat(resultado.get("detalles").get(0).asString()).contains("observacion");
		assertThat(fincas.buscar(idFinca)).isEmpty();
	}

	@Test
	void sinSesionRespondeErrorEstandarizado() throws Exception {
		mvc.perform(post("/api/v1/sincronizacion/operaciones").contentType(MediaType.APPLICATION_JSON)
				.content("{\"operaciones\":[]}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.codigo").value("AUTENTICACION_REQUERIDA"));
	}

	@Test
	void estadoDelServidorEsPublico() throws Exception {
		mvc.perform(get("/api/v1/sincronizacion/estado"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.disponible").value(true));
	}

	private JsonNode sincronizar(List<Map<String, Object>> operaciones) throws Exception {
		String respuesta = mvc.perform(post("/api/v1/sincronizacion/operaciones")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(Map.of("operaciones", new ArrayList<>(operaciones)))))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		return json.readTree(respuesta);
	}

	private static Map<String, Object> finca(String nombre) {
		return Map.of("nombre", nombre, "municipio", "Rionegro", "vereda", "Llanogrande");
	}

	private static Map<String, Object> crear(String entidad, UUID id, int segundos, Map<String, Object> datos) {
		return operacion(entidad, "CREAR", id, 0, segundos, datos);
	}

	private static Map<String, Object> editar(String entidad, UUID id, int versionBase, int segundos,
			Map<String, Object> datos) {
		return operacion(entidad, "EDITAR", id, versionBase, segundos, datos);
	}

	private static Map<String, Object> eliminar(String entidad, UUID id, int versionBase, int segundos) {
		return operacion(entidad, "ELIMINAR", id, versionBase, segundos, Map.of());
	}

	private static Map<String, Object> operacion(String entidad, String accion, UUID idRegistro, int versionBase,
			int segundos, Map<String, Object> contenido) {
		Map<String, Object> operacion = new HashMap<>();
		operacion.put("idOperacion", UUID.randomUUID().toString());
		operacion.put("entidad", entidad);
		operacion.put("accion", accion);
		operacion.put("idRegistro", idRegistro.toString());
		operacion.put("versionBase", versionBase);
		operacion.put("creadoEn", BASE.plusSeconds(segundos).toString());
		operacion.put("reintentos", 0);
		operacion.put("contenido", contenido);
		return operacion;
	}
}
