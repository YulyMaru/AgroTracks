package co.edu.uco.agrotrack.modulos.sincronizacion.infraestructura.salida.persistencia;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface OperacionSincronizadaJpaRepositorio extends JpaRepository<OperacionSincronizadaJpa, UUID> {
}
