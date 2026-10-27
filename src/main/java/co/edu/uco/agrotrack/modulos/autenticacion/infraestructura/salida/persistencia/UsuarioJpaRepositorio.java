package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.salida.persistencia;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface UsuarioJpaRepositorio extends JpaRepository<UsuarioJpa, UUID> {

	Optional<UsuarioJpa> findByCorreoIgnoreCase(String correo);

	boolean existsByCorreoIgnoreCase(String correo);

	Optional<UsuarioJpa> findByNombreUsuario(String nombreUsuario);

	boolean existsByNombreUsuario(String nombreUsuario);
}
