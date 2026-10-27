package co.edu.uco.agrotrack.modulos.sincronizacion.infraestructura.salida.persistencia;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Persistable;

import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.Accion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.OperacionSincronizada;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/**
 * Fila de operaciones_sincronizadas. La PK sobre {@code id_operacion} hace que dos reintentos de
 * la misma operacion no se apliquen dos veces.
 */
@Entity
@Table(name = "operaciones_sincronizadas")
class OperacionSincronizadaJpa implements Persistable<UUID> {

	@Id
	@Column(name = "id_operacion")
	private UUID idOperacion;

	@Column(name = "id_usuario", nullable = false)
	private UUID idUsuario;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TipoRegistro entidad;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Accion accion;

	@Column(name = "id_registro", nullable = false)
	private UUID idRegistro;

	@Column(name = "version_resultante", nullable = false)
	private int versionResultante;

	@Column(name = "creado_en_cliente", nullable = false)
	private Instant creadoEnCliente;

	@Column(name = "procesado_en", nullable = false)
	private Instant procesadoEn;

	@Transient
	private boolean nueva = true;

	protected OperacionSincronizadaJpa() {
	}

	OperacionSincronizadaJpa(OperacionSincronizada operacion) {
		this.idOperacion = operacion.idOperacion();
		this.idUsuario = operacion.idUsuario();
		this.entidad = operacion.entidad();
		this.accion = operacion.accion();
		this.idRegistro = operacion.idRegistro();
		this.versionResultante = operacion.versionResultante();
		this.creadoEnCliente = operacion.creadoEnCliente();
		this.procesadoEn = operacion.procesadoEn();
	}

	OperacionSincronizada aDominio() {
		return new OperacionSincronizada(idOperacion, idUsuario, entidad, accion, idRegistro, versionResultante,
				creadoEnCliente, procesadoEn);
	}

	@PostLoad
	void marcarPersistida() {
		nueva = false;
	}

	@Override
	public UUID getId() {
		return idOperacion;
	}

	@Override
	public boolean isNew() {
		return nueva;
	}
}
