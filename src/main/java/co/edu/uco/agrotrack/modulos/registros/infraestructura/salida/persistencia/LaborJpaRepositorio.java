package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

interface LaborJpaRepositorio extends RegistroJpaRepositorio<LaborJpa> {

	boolean existsByIdCultivoAndEliminadoFalse(UUID id);
}
