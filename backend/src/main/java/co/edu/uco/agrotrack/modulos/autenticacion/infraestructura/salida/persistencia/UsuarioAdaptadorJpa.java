package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.salida.persistencia;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.UsuarioRepositorio;
import co.edu.uco.agrotrack.modulos.autenticacion.dominio.Usuario;

/** Adaptador de salida: cuentas en la tabla usuarios. */
@Component
class UsuarioAdaptadorJpa implements UsuarioRepositorio {

	private final UsuarioJpaRepositorio repositorio;

	UsuarioAdaptadorJpa(UsuarioJpaRepositorio repositorio) {
		this.repositorio = repositorio;
	}

	@Override
	public boolean existeCorreo(String correo) {
		return repositorio.existsByCorreoIgnoreCase(correo);
	}

	@Override
	public boolean existeNombreUsuario(String nombreUsuario) {
		return repositorio.existsByNombreUsuario(nombreUsuario);
	}

	@Override
	public Optional<Usuario> buscarPorNombreUsuario(String nombreUsuario) {
		return repositorio.findByNombreUsuario(nombreUsuario).map(UsuarioJpa::aDominio);
	}

	@Override
	public Optional<Usuario> buscarPorCorreo(String correo) {
		return repositorio.findByCorreoIgnoreCase(correo).map(UsuarioJpa::aDominio);
	}

	@Override
	public Optional<Usuario> buscarPorId(UUID id) {
		return repositorio.findById(id).map(UsuarioJpa::aDominio);
	}

	@Override
	public Usuario guardar(Usuario usuario) {
		UsuarioJpa fila = repositorio.findById(usuario.getId())
				.map(existente -> {
					existente.copiarDe(usuario);
					return existente;
				})
				.orElseGet(() -> new UsuarioJpa(usuario));
		return repositorio.save(fila).aDominio();
	}
}
