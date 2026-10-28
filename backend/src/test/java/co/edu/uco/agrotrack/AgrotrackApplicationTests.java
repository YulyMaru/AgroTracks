package co.edu.uco.agrotrack;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Carga el contexto con el perfil dev (H2), sin Docker. Para probar contra un PostgreSQL 16
 * real (el mismo de Cloud SQL), anotar con {@code @Import(TestcontainersConfiguration.class)}.
 */
@SpringBootTest
class AgrotrackApplicationTests {

	@Test
	void contextLoads() {
	}

}
