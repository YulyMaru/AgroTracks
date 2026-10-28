package co.edu.uco.agrotrack;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

/**
 * Reglas del monolito modular hexagonal (doc/adr/adr-32.md). Revisa los imports del codigo fuente:
 * si alguien rompe una regla, esta prueba falla y dice en que archivo.
 * <ol>
 * <li>El dominio es Java puro: no usa Spring, JPA, Jackson ni la web, ni las capas de afuera.</li>
 * <li>La aplicacion (casos de uso y puertos) no usa Spring, JPA ni Jackson, ni la infraestructura.</li>
 * <li>Un modulo solo usa otro modulo desde su infraestructura, y solo su puerto de entrada o su dominio.</li>
 * </ol>
 */
class ArquitecturaHexagonalTest {

	private static final Path FUENTES = Path.of("src/main/java/co/edu/uco/agrotrack");
	private static final String RAIZ = "co.edu.uco.agrotrack.";
	private static final Pattern IMPORT = Pattern.compile("^import\\s+(static\\s+)?([\\w.]+)", Pattern.MULTILINE);
	private static final Pattern MODULO = Pattern.compile("co\\.edu\\.uco\\.agrotrack\\.modulos\\.(\\w+)\\.(.*)");

	private static final List<String> FRAMEWORKS = List.of("org.springframework.", "jakarta.persistence.",
			"jakarta.servlet.", "tools.jackson.", "io.micrometer.");

	@Test
	void elDominioEsJavaPuro() {
		List<String> violaciones = new ArrayList<>();
		for (Path archivo : archivos(".dominio.")) {
			for (String importado : imports(archivo)) {
				if (esFramework(importado) || importado.contains(".aplicacion.")
						|| importado.contains(".infraestructura.")) {
					violaciones.add(nombre(archivo) + " importa " + importado);
				}
			}
		}
		assertThat(violaciones).as("El dominio no debe depender de frameworks ni de otras capas").isEmpty();
	}

	@Test
	void laAplicacionNoConoceLaInfraestructura() {
		List<String> violaciones = new ArrayList<>();
		for (Path archivo : archivos(".aplicacion.")) {
			for (String importado : imports(archivo)) {
				if (esFramework(importado) || importado.contains(".infraestructura.")) {
					violaciones.add(nombre(archivo) + " importa " + importado);
				}
			}
		}
		assertThat(violaciones).as("Los casos de uso solo hablan con puertos").isEmpty();
	}

	@Test
	void losModulosSoloSeHablanPorSusPuertosDeEntrada() {
		List<String> violaciones = new ArrayList<>();
		for (Path archivo : archivos(".modulos.")) {
			Matcher propio = MODULO.matcher(paquete(archivo) + ".");
			if (!propio.matches()) {
				continue;
			}
			String modulo = propio.group(1);
			boolean desdeInfraestructura = propio.group(2).startsWith("infraestructura.");
			for (String importado : imports(archivo)) {
				Matcher otro = MODULO.matcher(importado);
				if (!otro.matches() || otro.group(1).equals(modulo)) {
					continue;
				}
				String capa = otro.group(2);
				boolean publico = capa.startsWith("aplicacion.puerto.entrada.") || capa.startsWith("dominio.");
				if (!desdeInfraestructura || !publico) {
					violaciones.add(nombre(archivo) + " importa " + importado);
				}
			}
		}
		assertThat(violaciones)
				.as("Un modulo solo puede usar otro desde un adaptador, y solo su puerto de entrada o su dominio")
				.isEmpty();
	}

	private static List<Path> archivos(String capa) {
		try (Stream<Path> todos = Files.walk(FUENTES)) {
			return todos.filter(p -> p.toString().endsWith(".java"))
					.filter(p -> (paquete(p) + ".").contains(capa))
					.toList();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	private static String paquete(Path archivo) {
		String relativo = FUENTES.relativize(archivo.getParent()).toString().replace('\\', '.').replace('/', '.');
		return RAIZ + relativo;
	}

	private static List<String> imports(Path archivo) {
		try {
			Matcher m = IMPORT.matcher(Files.readString(archivo));
			List<String> resultado = new ArrayList<>();
			while (m.find()) {
				resultado.add(m.group(2));
			}
			return resultado;
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	private static boolean esFramework(String importado) {
		return FRAMEWORKS.stream().anyMatch(importado::startsWith);
	}

	private static String nombre(Path archivo) {
		return FUENTES.relativize(archivo).toString().replace('\\', '/');
	}
}
