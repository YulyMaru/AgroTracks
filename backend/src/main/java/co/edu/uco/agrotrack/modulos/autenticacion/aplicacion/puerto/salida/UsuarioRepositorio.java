package co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida;

import java.util.Optional;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.autenticacion.dominio.Usuario;

/** Puerto de salida: cuentas guardadas. */
public interface UsuarioRepositorio {

	boolean existeCorreo(String correo);

	boolean existeNombreUsuario(String nombreUsuario);

	Optional<Usuario> buscarPorCorreo(String correo);

	Optional<Usuario> buscarPorNombreUsuario(String nombreUsuario);

	Optional<Usuario> buscarPorId(UUID id);

	Usuario guardar(Usuario usuario);
}
