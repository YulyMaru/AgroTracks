package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.NivelAsignacion;

interface OtroIngresoJpaRepositorio extends RegistroJpaRepositorio<OtroIngresoJpa> {

	boolean existsByIdFincaAndEliminadoFalse(UUID id);

	boolean existsByNivelAsignacionAndIdAsignacionAndEliminadoFalse(NivelAsignacion nivel, UUID idAsignacion);
}
