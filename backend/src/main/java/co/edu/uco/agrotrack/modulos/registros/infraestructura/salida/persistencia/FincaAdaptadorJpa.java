package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.FincaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Finca;

/** Adaptador de salida: guarda y lee fincas con JPA. */
@Component
class FincaAdaptadorJpa extends AdaptadorRegistroJpa<Finca, FincaJpa> implements FincaRepositorio {

	private final FincaJpaRepositorio repositorio;

	FincaAdaptadorJpa(FincaJpaRepositorio repositorio) {
		super(repositorio, FincaJpa::new);
		this.repositorio = repositorio;
	}

	@Override
	public boolean existeNombre(UUID idUsuario, String nombre, UUID excluirId) {
		return repositorio.existsByIdUsuarioAndNombreIgnoreCaseAndEliminadoFalseAndIdNot(idUsuario, nombre, excluirId);
	}
}
