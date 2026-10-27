package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

interface CultivoJpaRepositorio extends RegistroJpaRepositorio<CultivoJpa> {

	boolean existsByIdLoteAndEliminadoFalse(UUID id);
}
