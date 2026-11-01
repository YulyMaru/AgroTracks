package co.edu.uco.agrotrack.compartido.infraestructura.seguridad;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import tools.jackson.databind.json.JsonMapper;

/** Solo pasan las peticiones que traen el secreto que agrega Cloudflare (ADR-027). Sin Spring. */
class FiltroOrigenTest {

	private final RespuestasErrorSeguridad errores = new RespuestasErrorSeguridad(JsonMapper.builder().build());

	@Test
	void sinSecretoConfiguradoDejaPasarTodo() throws Exception {
		MockFilterChain cadena = new MockFilterChain();
		new FiltroOrigen("", errores).doFilter(peticion("/api/v1/registros/fincas", null), new MockHttpServletResponse(), cadena);
		assertThat(cadena.getRequest()).isNotNull();
	}

	@Test
	void conElSecretoCorrectoDejaPasar() throws Exception {
		MockFilterChain cadena = new MockFilterChain();
		new FiltroOrigen("secreto-de-origen", errores).doFilter(peticion("/api/v1/registros/fincas", "secreto-de-origen"),
				new MockHttpServletResponse(), cadena);
		assertThat(cadena.getRequest()).isNotNull();
	}

	@Test
	void sinElEncabezadoOConOtroValorResponde403() throws Exception {
		for (String valor : new String[] { null, "otro-valor" }) {
			MockFilterChain cadena = new MockFilterChain();
			MockHttpServletResponse respuesta = new MockHttpServletResponse();
			new FiltroOrigen("secreto-de-origen", errores).doFilter(peticion("/api/v1/registros/fincas", valor), respuesta, cadena);
			assertThat(cadena.getRequest()).isNull();
			assertThat(respuesta.getStatus()).isEqualTo(403);
			assertThat(respuesta.getContentAsString()).contains("ACCESO_DENEGADO");
		}
	}

	@Test
	void laSaludNoExigeElEncabezadoPorqueLaRevisaCloudRun() throws Exception {
		MockFilterChain cadena = new MockFilterChain();
		new FiltroOrigen("secreto-de-origen", errores).doFilter(peticion("/actuator/health", null), new MockHttpServletResponse(), cadena);
		assertThat(cadena.getRequest()).isNotNull();
	}

	private static MockHttpServletRequest peticion(String ruta, String origen) {
		MockHttpServletRequest peticion = new MockHttpServletRequest("GET", ruta);
		if (origen != null) {
			peticion.addHeader(FiltroOrigen.HEADER, origen);
		}
		return peticion;
	}
}
