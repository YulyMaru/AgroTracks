package co.edu.uco.agrotrack.modulos.autenticacion;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import tools.jackson.databind.json.JsonMapper;

/** Crear cuenta con nombre de usuario y entrar con el usuario o con el correo. */
@SpringBootTest
@AutoConfigureMockMvc
class AutenticacionIntegracionTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JsonMapper json;

	String sufijo;
	String correo;
	String usuario;

	@BeforeEach
	void datos() {
		sufijo = UUID.randomUUID().toString().substring(0, 8);
		correo = "jose-" + sufijo + "@agrotrack.test";
		usuario = "jose.perez_" + sufijo;
	}

	@Test
	void creaLaCuentaYEntraConElUsuarioSinImportarMayusculasOConElCorreo() throws Exception {
		registrar(correo, usuario.toUpperCase()).andExpect(status().isCreated());

		entrar(usuario).andExpect(status().isOk()).andExpect(jsonPath("$.nombre").value("José Pérez"));
		entrar("  " + usuario.toUpperCase() + " ").andExpect(status().isOk());
		entrar(correo).andExpect(status().isOk());
		entrarCon(usuario, "otraClave999").andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.mensaje").value("Usuario o clave incorrectos."));
	}

	@Test
	void elNombreDeUsuarioEsUnicoYSoloTieneLetrasNumerosPuntoOGuionBajo() throws Exception {
		registrar(correo, usuario).andExpect(status().isCreated());
		registrar("otro-" + sufijo + "@agrotrack.test", usuario).andExpect(status().isConflict())
				.andExpect(jsonPath("$.codigo").value("CONFLICTO"));
		registrar("otro2-" + sufijo + "@agrotrack.test", "José Pérez").andExpect(status().isBadRequest());
	}

	private ResultActions registrar(String correo, String nombreUsuario) throws Exception {
		return mvc.perform(post("/api/v1/autenticacion/registro").contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(Map.of("correo", correo, "nombreUsuario", nombreUsuario,
						"nombre", "José Pérez", "clave", "claveSegura123"))));
	}

	private ResultActions entrar(String usuarioOCorreo) throws Exception {
		return entrarCon(usuarioOCorreo, "claveSegura123");
	}

	private ResultActions entrarCon(String usuarioOCorreo, String clave) throws Exception {
		return mvc.perform(post("/api/v1/autenticacion/inicio-sesion").contentType(MediaType.APPLICATION_JSON)
				.content(json.writeValueAsString(Map.of("usuario", usuarioOCorreo, "clave", clave))));
	}
}
