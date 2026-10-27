package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface HistorialCambioJpaRepositorio extends JpaRepository<HistorialCambioJpa, UUID> {

	List<HistorialCambioJpa> findByIdUsuarioAndTablaAndIdRegistroOrderByVersionDesc(UUID idUsuario, String tabla,
			UUID idRegistro);
}
