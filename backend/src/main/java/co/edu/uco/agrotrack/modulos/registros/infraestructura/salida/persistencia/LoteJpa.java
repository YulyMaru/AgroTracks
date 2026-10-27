package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.math.BigDecimal;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Lote;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Fila de la tabla lotes. Solo la conoce el adaptador de persistencia. */
@Entity
@Table(name = "lotes")
class LoteJpa extends RegistroJpa<Lote> {

	@Column(name = "id_finca", nullable = false)
	private UUID idFinca;

	@Column(nullable = false, length = 120)
	private String nombre;

	@Column(nullable = false, precision = 14, scale = 4)
	private BigDecimal area;

	@Column(name = "unidad_area", nullable = false, length = 30)
	private String unidadArea;

	protected LoteJpa() {
	}

	LoteJpa(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	@Override
	protected void copiarDatos(Lote registro) {
		idFinca = registro.getIdFinca();
		nombre = registro.getNombre();
		area = registro.getArea();
		unidadArea = registro.getUnidadArea();
	}

	@Override
	protected Lote crearDominio() {
		Lote registro = new Lote(getId(), getIdUsuario());
		registro.setIdFinca(idFinca);
		registro.setNombre(nombre);
		registro.setArea(area);
		registro.setUnidadArea(unidadArea);
		return registro;
	}
}
