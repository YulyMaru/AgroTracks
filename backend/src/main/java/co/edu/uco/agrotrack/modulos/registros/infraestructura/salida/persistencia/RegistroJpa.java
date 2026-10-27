package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

import co.edu.uco.agrotrack.compartido.infraestructura.persistencia.EntidadJpa;
import co.edu.uco.agrotrack.modulos.registros.dominio.Registro;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;

/**
 * Columnas comunes de las tablas de registros y la traduccion fila <-> dominio. El dominio no
 * conoce JPA: cada fila sabe copiarse desde el registro y reconstruirlo.
 */
@MappedSuperclass
abstract class RegistroJpa<D extends Registro> extends EntidadJpa {

	@Column(name = "id_usuario", nullable = false, updatable = false)
	private UUID idUsuario;

	@Column(nullable = false)
	private int version;

	@Column(nullable = false)
	private boolean eliminado;

	protected RegistroJpa() {
	}

	protected RegistroJpa(UUID id, UUID idUsuario) {
		super(id);
		this.idUsuario = idUsuario;
	}

	final void copiarDe(D registro) {
		version = registro.getVersion();
		eliminado = registro.isEliminado();
		copiarDatos(registro);
	}

	final D aDominio() {
		D registro = crearDominio();
		registro.restaurar(version, eliminado, getActualizadoEn());
		return registro;
	}

	protected abstract void copiarDatos(D registro);

	protected abstract D crearDominio();

	public UUID getIdUsuario() {
		return idUsuario;
	}
}
