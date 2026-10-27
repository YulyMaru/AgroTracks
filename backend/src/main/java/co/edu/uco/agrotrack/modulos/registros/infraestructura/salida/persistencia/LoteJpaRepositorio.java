package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

interface LoteJpaRepositorio extends RegistroJpaRepositorio<LoteJpa> {

	boolean existsByIdFincaAndNombreIgnoreCaseAndEliminadoFalseAndIdNot(UUID idFinca, String nombre, UUID id);

	boolean existsByIdFincaAndEliminadoFalse(UUID id);
}
