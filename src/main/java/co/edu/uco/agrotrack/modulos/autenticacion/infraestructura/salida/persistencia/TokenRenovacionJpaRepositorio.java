package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.salida.persistencia;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface TokenRenovacionJpaRepositorio extends JpaRepository<TokenRenovacionJpa, UUID> {

	Optional<TokenRenovacionJpa> findByTokenHash(String tokenHash);
}
