package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.LoteRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Lote;

/** Adaptador de salida: guarda y lee lotes con JPA. */
@Component
class LoteAdaptadorJpa extends AdaptadorRegistroJpa<Lote, LoteJpa> implements LoteRepositorio {

	private final LoteJpaRepositorio repositorio;

	LoteAdaptadorJpa(LoteJpaRepositorio repositorio) {
		super(repositorio, LoteJpa::new);
		this.repositorio = repositorio;
	}

	@Override
	public boolean existeNombreEnFinca(UUID idFinca, String nombre, UUID excluirId) {
		return repositorio.existsByIdFincaAndNombreIgnoreCaseAndEliminadoFalseAndIdNot(idFinca, nombre, excluirId);
	}
}
