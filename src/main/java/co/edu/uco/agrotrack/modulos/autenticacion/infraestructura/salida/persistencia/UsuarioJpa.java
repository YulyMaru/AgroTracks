package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.salida.persistencia;

import co.edu.uco.agrotrack.compartido.infraestructura.persistencia.EntidadJpa;
import co.edu.uco.agrotrack.modulos.autenticacion.dominio.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Fila de la tabla usuarios. */
@Entity
@Table(name = "usuarios")
class UsuarioJpa extends EntidadJpa {

	@Column(nullable = false, unique = true, length = 150)
	private String correo;

	@Column(name = "nombre_usuario", nullable = false, unique = true, length = 150)
	private String nombreUsuario;

	@Column(nullable = false, length = 120)
	private String nombre;

	@Column(name = "clave_hash", nullable = false, length = 100)
	private String claveHash;

	@Column(nullable = false)
	private boolean activo;

	protected UsuarioJpa() {
	}

	UsuarioJpa(Usuario usuario) {
		super(usuario.getId());
		copiarDe(usuario);
	}

	void copiarDe(Usuario usuario) {
		correo = usuario.getCorreo();
		nombreUsuario = usuario.getNombreUsuario();
		nombre = usuario.getNombre();
		claveHash = usuario.getClaveHash();
		activo = usuario.isActivo();
	}

	Usuario aDominio() {
		return new Usuario(getId(), correo, nombreUsuario, nombre, claveHash, activo);
	}
}
