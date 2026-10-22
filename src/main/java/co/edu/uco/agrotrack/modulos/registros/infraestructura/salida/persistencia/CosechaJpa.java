package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Cosecha;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Fila de la tabla cosechas. Solo la conoce el adaptador de persistencia. */
@Entity
@Table(name = "cosechas")
class CosechaJpa extends RegistroJpa<Cosecha> {

	@Column(name = "id_cultivo", nullable = false)
	private UUID idCultivo;

	@Column(nullable = false)
	private LocalDate fecha;

	@Column(nullable = false, precision = 14, scale = 3)
	private BigDecimal cantidad;

	@Column(nullable = false, length = 30)
	private String unidad;

	protected CosechaJpa() {
	}

	CosechaJpa(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	@Override
	protected void copiarDatos(Cosecha registro) {
		idCultivo = registro.getIdCultivo();
		fecha = registro.getFecha();
		cantidad = registro.getCantidad();
		unidad = registro.getUnidad();
	}

	@Override
	protected Cosecha crearDominio() {
		Cosecha registro = new Cosecha(getId(), getIdUsuario());
		registro.setIdCultivo(idCultivo);
		registro.setFecha(fecha);
		registro.setCantidad(cantidad);
		registro.setUnidad(unidad);
		return registro;
	}
}
