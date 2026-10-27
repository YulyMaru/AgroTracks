package co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida;

import java.util.Optional;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.OperacionSincronizada;

/** Puerto de salida: operaciones ya aplicadas (idempotencia, ADR-007). */
public interface OperacionesSincronizadasRepositorio {

	Optional<OperacionSincronizada> buscar(UUID idOperacion);

	void guardar(OperacionSincronizada operacion);
}
