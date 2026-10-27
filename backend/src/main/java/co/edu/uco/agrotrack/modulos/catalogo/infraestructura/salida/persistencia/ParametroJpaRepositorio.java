package co.edu.uco.agrotrack.modulos.catalogo.infraestructura.salida.persistencia;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ParametroJpaRepositorio extends JpaRepository<ParametroJpa, UUID> {

	List<ParametroJpa> findByActivoTrueOrderByTipoAscOrdenAsc();

	List<ParametroJpa> findByActualizadoEnAfterOrderByTipoAscOrdenAsc(Instant desde);

	boolean existsByTipoAndCodigoAndActivoTrue(String tipo, String codigo);
}
