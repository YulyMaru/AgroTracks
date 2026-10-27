package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.HistorialRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.HistorialCambio;

/** Adaptador de salida: historial de cambios en la tabla historial_cambios. */
@Component
class HistorialAdaptadorJpa implements HistorialRepositorio {

	private final HistorialCambioJpaRepositorio repositorio;

	HistorialAdaptadorJpa(HistorialCambioJpaRepositorio repositorio) {
		this.repositorio = repositorio;
	}

	@Override
	public void guardar(HistorialCambio cambio) {
		repositorio.save(new HistorialCambioJpa(cambio));
	}

	@Override
	public List<HistorialCambio> deRegistro(UUID idUsuario, String tabla, UUID idRegistro) {
		return repositorio.findByIdUsuarioAndTablaAndIdRegistroOrderByVersionDesc(idUsuario, tabla, idRegistro)
				.stream()
				.map(HistorialCambioJpa::aDominio)
				.toList();
	}
}
