package co.edu.uco.agrotrack.modulos.autenticacion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Sesion con JWT de punta a punta (SPIKE-011, SPIKE-015, SPIKE-016, SPIKE-024; ADR-011): rutas
 * protegidas, token invalido o firmado con otra clave, duracion del access token, renovacion con
 * rotacion del refresh token y cierre de sesion.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SesionJwtIntegracionTest {

	private static final String RUTA_PROTEGIDA = "/api/v1/registros/fincas";

	@Autowired
	MockMvc mvc;

	@Autowired
	JsonMapper json;

	JsonNode sesion;

	@BeforeEach
	void registrar() throws Exception {
		String sufijo = UUID.randomUUID().toString().substring(0, 8);
		String cuerpo = json.writeValueAsString(Map.of("correo", "sesion-" + sufijo + "@agrotrack.test",
				"nombreUsuario", "sesion_" + sufijo, "nombre", "Campesina", "clave", "claveSegura123"));
		sesion = json.readTree(mvc.perform(post("/api/v1/autenticacion/registro")
				.contentType(MediaType.APPLICATION_JSON).content(cuerpo))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString());
	}

	@Test
	void sinTokenOConTokenInvalidoNingunaRutaProtegidaResponde() throws Exception {
		String[] rutas = { RUTA_PROTEGIDA, "/api/v1/registros/gastos", "/api/v1/sincronizacion/cambios",
				"/api/v1/parametros", "/actuator/metrics" };
		String tokenAjeno = tokenFirmadoConOtraClave();
		for (String ruta : rutas) {
			mvc.perform(get(ruta)).andExpect(status().isUnauthorized())
					.andExpect(jsonPath("$.codigo").value("AUTENTICACION_REQUERIDA"));
			mvc.perform(get(ruta).header("Authorization", "Bearer no-es-un-jwt"))
					.andExpect(status().isUnauthorized());
			mvc.perform(get(ruta).header("Authorization", "Bearer " + tokenAjeno))
					.andExpect(status().isUnauthorized());
		}
		mvc.perform(get(RUTA_PROTEGIDA).header("Authorization", "Bearer " + acceso(sesion)))
				.andExpect(status().isOk());
	}

	@Test
	void elAccessTokenDura15MinutosYNoLlevaLaClave() throws Exception {
		JsonNode carga = json.readTree(Base64.getUrlDecoder().decode(acceso(sesion).split("\\.")[1]));
		assertThat(carga.get("exp").asLong() - carga.get("iat").asLong()).isEqualTo(15 * 60);
		assertThat(carga.toString()).doesNotContain("claveSegura123");
	}

	@Test
	void laRenovacionEntregaTokensNuevosYElRefreshViejoYaNoSirve() throws Exception {
		String refreshViejo = sesion.get("refreshToken").asString();
		JsonNode renovada = json.readTree(mvc.perform(post("/api/v1/autenticacion/renovacion")
				.contentType(MediaType.APPLICATION_JSON).content(refresh(refreshViejo)))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString());

		assertThat(renovada.get("refreshToken").asString()).isNotEqualTo(refreshViejo);
		mvc.perform(get(RUTA_PROTEGIDA).header("Authorization", "Bearer " + acceso(renovada)))
				.andExpect(status().isOk());

		// Rotacion: un refresh token ya usado no vuelve a servir.
		mvc.perform(post("/api/v1/autenticacion/renovacion")
				.contentType(MediaType.APPLICATION_JSON).content(refresh(refreshViejo)))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void cerrarSesionRevocaElRefreshToken() throws Exception {
		String token = sesion.get("refreshToken").asString();
		mvc.perform(post("/api/v1/autenticacion/cierre-sesion")
				.contentType(MediaType.APPLICATION_JSON).content(refresh(token)))
				.andExpect(status().isNoContent());
		mvc.perform(post("/api/v1/autenticacion/renovacion")
				.contentType(MediaType.APPLICATION_JSON).content(refresh(token)))
				.andExpect(status().isUnauthorized());
	}

	private String refresh(String token) {
		return json.writeValueAsString(Map.of("refreshToken", token));
	}

	private static String acceso(JsonNode sesion) {
		return sesion.get("accessToken").asString();
	}

	/** Un JWT bien formado pero firmado con una clave distinta a la del servidor. */
	private static String tokenFirmadoConOtraClave() throws Exception {
		Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
		String cabecera = b64.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
		long ahora = System.currentTimeMillis() / 1000;
		String carga = b64.encodeToString(("{\"sub\":\"" + UUID.randomUUID() + "\",\"iat\":" + ahora + ",\"exp\":"
				+ (ahora + 600) + "}").getBytes(StandardCharsets.UTF_8));
		javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
		mac.init(new javax.crypto.spec.SecretKeySpec(
				"otra-clave-que-no-es-la-del-servidor-32bytes".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
		String firma = b64.encodeToString(mac.doFinal((cabecera + "." + carga).getBytes(StandardCharsets.UTF_8)));
		return cabecera + "." + carga + "." + firma;
	}
}
