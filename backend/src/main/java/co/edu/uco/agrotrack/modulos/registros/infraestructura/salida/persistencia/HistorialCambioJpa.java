package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.time.Instant;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.HistorialCambio;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Fila de la tabla historial_cambios. */
@Entity
@Table(name = "historial_cambios")
class HistorialCambioJpa {

	@Id
	private UUID id;

	@Column(name = "id_usuario", nullable = false)
	private UUID idUsuario;

	@Column(nullable = false, length = 40)
	private String tabla;

	@Column(name = "id_registro", nullable = false)
	private UUID idRegistro;

	@Column(nullable = false)
	private int version;

	@Column(nullable = false, length = 10)
	private String accion;

	@Column(name = "datos_anteriores", nullable = false, length = 4000)
	private String datosAnteriores;

	@Column(nullable = false)
	private Instant fecha;

	protected HistorialCambioJpa() {
	}

	HistorialCambioJpa(HistorialCambio cambio) {
		this.id = cambio.id();
		this.idUsuario = cambio.idUsuario();
		this.tabla = cambio.tabla();
		this.idRegistro = cambio.idRegistro();
		this.version = cambio.version();
		this.accion = cambio.accion().name();
		this.datosAnteriores = cambio.datosAnteriores();
		this.fecha = cambio.fecha();
	}

	HistorialCambio aDominio() {
		return new HistorialCambio(id, idUsuario, tabla, idRegistro, version, HistorialCambio.Accion.valueOf(accion),
				datosAnteriores, fecha);
	}
}
