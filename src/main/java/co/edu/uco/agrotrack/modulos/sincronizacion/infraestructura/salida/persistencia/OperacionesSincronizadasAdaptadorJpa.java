package co.edu.uco.agrotrack.modulos.sincronizacion.infraestructura.salida.persistencia;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.OperacionesSincronizadasRepositorio;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.OperacionSincronizada;

/** Adaptador de salida: operaciones aplicadas en la tabla operaciones_sincronizadas. */
@Component
class OperacionesSincronizadasAdaptadorJpa implements OperacionesSincronizadasRepositorio {

	private final OperacionSincronizadaJpaRepositorio repositorio;

	OperacionesSincronizadasAdaptadorJpa(OperacionSincronizadaJpaRepositorio repositorio) {
		this.repositorio = repositorio;
	}

	@Override
	public Optional<OperacionSincronizada> buscar(UUID idOperacion) {
		return repositorio.findById(idOperacion).map(OperacionSincronizadaJpa::aDominio);
	}

	@Override
	public void guardar(OperacionSincronizada operacion) {
		repositorio.save(new OperacionSincronizadaJpa(operacion));
	}
}
