package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Venta;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Fila de la tabla ventas. Solo la conoce el adaptador de persistencia. */
@Entity
@Table(name = "ventas")
class VentaJpa extends RegistroJpa<Venta> {

	@Column(name = "id_cultivo", nullable = false)
	private UUID idCultivo;

	@Column(nullable = false)
	private LocalDate fecha;

	@Column(nullable = false, precision = 14, scale = 3)
	private BigDecimal cantidad;

	@Column(nullable = false, length = 30)
	private String unidad;

	@Column(name = "valor_total", nullable = false)
	private Long valorTotal;

	protected VentaJpa() {
	}

	VentaJpa(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	@Override
	protected void copiarDatos(Venta registro) {
		idCultivo = registro.getIdCultivo();
		fecha = registro.getFecha();
		cantidad = registro.getCantidad();
		unidad = registro.getUnidad();
		valorTotal = registro.getValorTotal();
	}

	@Override
	protected Venta crearDominio() {
		Venta registro = new Venta(getId(), getIdUsuario());
		registro.setIdCultivo(idCultivo);
		registro.setFecha(fecha);
		registro.setCantidad(cantidad);
		registro.setUnidad(unidad);
		registro.setValorTotal(valorTotal);
		return registro;
	}
}
