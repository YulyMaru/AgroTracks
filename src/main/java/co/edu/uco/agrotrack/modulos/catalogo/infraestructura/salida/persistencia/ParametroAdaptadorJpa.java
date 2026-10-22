package co.edu.uco.agrotrack.modulos.catalogo.infraestructura.salida.persistencia;

import java.time.Instant;
import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.salida.ParametroRepositorio;
import co.edu.uco.agrotrack.modulos.catalogo.dominio.Parametro;

/** Adaptador de salida: parametros en la base de datos, con cache para validar codigos rapido. */
@Component
class ParametroAdaptadorJpa implements ParametroRepositorio {

	private final ParametroJpaRepositorio repositorio;

	ParametroAdaptadorJpa(ParametroJpaRepositorio repositorio) {
		this.repositorio = repositorio;
	}

	@Override
	public List<Parametro> activos() {
		return repositorio.findByActivoTrueOrderByTipoAscOrdenAsc().stream().map(ParametroJpa::aDominio).toList();
	}

	@Override
	public List<Parametro> modificadosDesde(Instant desde) {
		return repositorio.findByActualizadoEnAfterOrderByTipoAscOrdenAsc(desde).stream()
				.map(ParametroJpa::aDominio)
				.toList();
	}

	@Override
	@Cacheable(cacheNames = "parametros-existentes", key = "#tipo + ':' + #codigo")
	public boolean existeActivo(String tipo, String codigo) {
		return repositorio.existsByTipoAndCodigoAndActivoTrue(tipo, codigo);
	}
}
