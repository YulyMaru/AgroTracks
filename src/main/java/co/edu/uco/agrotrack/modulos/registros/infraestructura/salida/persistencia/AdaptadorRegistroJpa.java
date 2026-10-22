package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.BiFunction;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Registro;

/** Implementacion comun del puerto {@link RepositorioRegistro} con Spring Data JPA. */
abstract class AdaptadorRegistroJpa<D extends Registro, J extends RegistroJpa<D>> implements RepositorioRegistro<D> {

	private final RegistroJpaRepositorio<J> repositorio;
	private final BiFunction<UUID, UUID, J> nuevaFila;

	protected AdaptadorRegistroJpa(RegistroJpaRepositorio<J> repositorio, BiFunction<UUID, UUID, J> nuevaFila) {
		this.repositorio = repositorio;
		this.nuevaFila = nuevaFila;
	}

	@Override
	public Optional<D> buscar(UUID id) {
		return repositorio.findById(id).map(RegistroJpa::aDominio);
	}

	@Override
	public D guardar(D registro) {
		J fila = repositorio.findById(registro.getId())
				.orElseGet(() -> nuevaFila.apply(registro.getId(), registro.getIdUsuario()));
		fila.copiarDe(registro);
		return repositorio.saveAndFlush(fila).aDominio();
	}

	@Override
	public List<D> vigentes(UUID idUsuario) {
		return repositorio.findByIdUsuarioAndEliminadoFalseOrderByCreadoEnDesc(idUsuario).stream()
				.map(RegistroJpa::aDominio)
				.toList();
	}

	@Override
	public List<D> modificadosDesde(UUID idUsuario, Instant desde) {
		return repositorio.findByIdUsuarioAndActualizadoEnAfter(idUsuario, desde).stream()
				.map(RegistroJpa::aDominio)
				.toList();
	}
}
