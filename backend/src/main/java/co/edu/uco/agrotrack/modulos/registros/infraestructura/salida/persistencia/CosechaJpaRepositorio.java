package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

interface CosechaJpaRepositorio extends RegistroJpaRepositorio<CosechaJpa> {

	boolean existsByIdCultivoAndEliminadoFalse(UUID id);
}
