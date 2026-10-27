package co.edu.uco.agrotrack.modulos.registros.dominio;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;

/** Reglas comunes de todo registro: version (R4), borrado logico (R5) y dueno (R2). Sin Spring. */
class RegistroTest {

	private final UUID duena = UUID.randomUUID();

	private Finca nueva() {
		return new Finca(UUID.randomUUID(), duena);
	}

	@Test
	void unRegistroNuevoEmpiezaEnLaVersion1YVigente() {
		Finca finca = nueva();
		assertThat(finca.getVersion()).isEqualTo(1);
		assertThat(finca.isEliminado()).isFalse();
		assertThat(finca.perteneceA(duena)).isTrue();
		assertThat(finca.perteneceA(UUID.randomUUID())).isFalse();
	}

	@Test
	void cadaEdicionSubeLaVersionYEliminarTambien() {
		Finca finca = nueva();
		finca.nuevaVersion();
		finca.eliminar();
		assertThat(finca.getVersion()).isEqualTo(3);
		assertThat(finca.isEliminado()).isTrue();
	}

	@Test
	void seAceptaElCambioSiElCelularTieneLaMismaVersion() {
		Finca finca = nueva();
		finca.restaurar(4, false, Instant.now());
		finca.verificarCambio(4);
	}

	@Test
	void unCambioConVersionViejaSeRechazaParaNoPisarOtroCelular() {
		Finca finca = nueva();
		finca.restaurar(5, false, Instant.now());
		assertThatThrownBy(() -> finca.verificarCambio(4))
				.isInstanceOf(ExcepcionAgroTrack.class)
				.hasMessageContaining("otro celular")
				.extracting(e -> ((ExcepcionAgroTrack) e).getCodigo()).isEqualTo(CodigoError.CONFLICTO);
	}

	@Test
	void unRegistroEliminadoYaNoSePuedeCambiar() {
		Finca finca = nueva();
		finca.eliminar();
		assertThatThrownBy(() -> finca.verificarCambio(finca.getVersion()))
				.isInstanceOf(ExcepcionAgroTrack.class)
				.hasMessageContaining("ya fue eliminado");
	}

	@Test
	void elHistorialGuardaLaVersionAnteriorYLaTabla() {
		Finca finca = nueva();
		finca.nuevaVersion();
		HistorialCambio cambio = HistorialCambio.de(finca, Entidad.FINCA, HistorialCambio.Accion.EDITAR, "{}");
		assertThat(cambio.version()).isEqualTo(2);
		assertThat(cambio.tabla()).isEqualTo("fincas");
		assertThat(cambio.idRegistro()).isEqualTo(finca.getId());
		assertThat(cambio.idUsuario()).isEqualTo(duena);
	}

	@Test
	void losInsumosDeUnaLaborNoSePuedenCambiarDesdeAfuera() {
		Labor labor = new Labor(UUID.randomUUID(), duena);
		List<Insumo> insumos = new ArrayList<>();
		insumos.add(new Insumo("AGUA", BigDecimal.ONE, "LITRO"));
		labor.setInsumos(insumos);
		insumos.clear();
		assertThat(labor.getInsumos()).hasSize(1);
	}
}
