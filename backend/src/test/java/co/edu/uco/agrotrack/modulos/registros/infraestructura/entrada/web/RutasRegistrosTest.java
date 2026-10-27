package co.edu.uco.agrotrack.modulos.registros.infraestructura.entrada.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;

/** Nombres de cada tipo de registro en la URL (detalle del adaptador web, no del dominio). */
class RutasRegistrosTest {

	@Test
	void cadaTipoDeRegistroTieneSuRutaYSeRecuperaDesdeElla() {
		assertThat(RutasRegistros.ruta(Entidad.OTRO_INGRESO)).isEqualTo("otros-ingresos");
		for (Entidad entidad : Entidad.values()) {
			assertThat(RutasRegistros.entidad(RutasRegistros.ruta(entidad))).isEqualTo(entidad);
		}
	}

	@Test
	void unaRutaQueNoExisteRespondeNoEncontrado() {
		assertThatThrownBy(() -> RutasRegistros.entidad("vacas")).isInstanceOf(ExcepcionAgroTrack.class);
	}
}
