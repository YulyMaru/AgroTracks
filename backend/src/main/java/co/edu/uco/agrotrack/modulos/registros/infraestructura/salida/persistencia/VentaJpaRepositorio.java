package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

interface VentaJpaRepositorio extends RegistroJpaRepositorio<VentaJpa> {

	boolean existsByIdCultivoAndEliminadoFalse(UUID id);
}
