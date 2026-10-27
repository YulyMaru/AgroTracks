package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

/** Consultas Spring Data comunes a todas las tablas de registros. */
@NoRepositoryBean
interface RegistroJpaRepositorio<J extends RegistroJpa<?>> extends JpaRepository<J, UUID> {

	List<J> findByIdUsuarioAndEliminadoFalseOrderByCreadoEnDesc(UUID idUsuario);

	List<J> findByIdUsuarioAndActualizadoEnAfter(UUID idUsuario, Instant desde);
}
