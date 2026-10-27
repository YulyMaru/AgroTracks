package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Labor;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

/** Fila de la tabla labores. Solo la conoce el adaptador de persistencia. */
@Entity
@Table(name = "labores")
class LaborJpa extends RegistroJpa<Labor> {

	@Column(name = "id_cultivo", nullable = false)
	private UUID idCultivo;

	@Column(name = "tipo_labor", nullable = false, length = 60)
	private String tipoLabor;

	@Column(nullable = false)
	private LocalDate fecha;

	@Column(nullable = false, length = 300)
	private String descripcion;

	@Column(nullable = false, precision = 4, scale = 2)
	private BigDecimal horas;

	@Column(nullable = false)
	private Integer trabajadores;

	@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
	@JoinColumn(name = "id_labor", nullable = false)
	private List<LaborInsumoJpa> insumos = new ArrayList<>();

	protected LaborJpa() {
	}

	LaborJpa(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	@Override
	protected void copiarDatos(Labor registro) {
		idCultivo = registro.getIdCultivo();
		tipoLabor = registro.getTipoLabor();
		fecha = registro.getFecha();
		descripcion = registro.getDescripcion();
		horas = registro.getHoras();
		trabajadores = registro.getTrabajadores();
		insumos.clear();
		registro.getInsumos().forEach(i -> insumos.add(new LaborInsumoJpa(i)));
	}

	@Override
	protected Labor crearDominio() {
		Labor registro = new Labor(getId(), getIdUsuario());
		registro.setIdCultivo(idCultivo);
		registro.setTipoLabor(tipoLabor);
		registro.setFecha(fecha);
		registro.setDescripcion(descripcion);
		registro.setHoras(horas);
		registro.setTrabajadores(trabajadores);
		registro.setInsumos(insumos.stream().map(LaborInsumoJpa::aDominio).toList());
		return registro;
	}
}
