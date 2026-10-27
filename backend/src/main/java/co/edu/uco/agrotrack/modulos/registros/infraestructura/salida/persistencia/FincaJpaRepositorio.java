package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

interface FincaJpaRepositorio extends RegistroJpaRepositorio<FincaJpa> {

	boolean existsByIdUsuarioAndNombreIgnoreCaseAndEliminadoFalseAndIdNot(UUID idUsuario, String nombre, UUID id);
}
