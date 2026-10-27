package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.time.LocalDate;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.NivelAsignacion;
import co.edu.uco.agrotrack.modulos.registros.dominio.OtroIngreso;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/** Fila de la tabla otros_ingresos. Solo la conoce el adaptador de persistencia. */
@Entity
@Table(name = "otros_ingresos")
class OtroIngresoJpa extends RegistroJpa<OtroIngreso> {

	@Column(nullable = false)
	private LocalDate fecha;

	@Column(name = "tipo_ingreso", nullable = false, length = 60)
	private String tipoIngreso;

	@Column(nullable = false, length = 150)
	private String concepto;

	@Column(nullable = false)
	private Long valor;

	@Enumerated(EnumType.STRING)
	@Column(name = "nivel_asignacion", nullable = false, length = 10)
	private NivelAsignacion nivelAsignacion;

	@Column(name = "id_asignacion", nullable = false)
	private UUID idAsignacion;

	@Column(name = "id_finca", nullable = false)
	private UUID idFinca;

	protected OtroIngresoJpa() {
	}

	OtroIngresoJpa(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	@Override
	protected void copiarDatos(OtroIngreso registro) {
		fecha = registro.getFecha();
		tipoIngreso = registro.getTipoIngreso();
		concepto = registro.getConcepto();
		valor = registro.getValor();
		nivelAsignacion = registro.getNivelAsignacion();
		idAsignacion = registro.getIdAsignacion();
		idFinca = registro.getIdFinca();
	}

	@Override
	protected OtroIngreso crearDominio() {
		OtroIngreso registro = new OtroIngreso(getId(), getIdUsuario());
		registro.setFecha(fecha);
		registro.setTipoIngreso(tipoIngreso);
		registro.setConcepto(concepto);
		registro.setValor(valor);
		registro.setNivelAsignacion(nivelAsignacion);
		registro.setIdAsignacion(idAsignacion);
		registro.setIdFinca(idFinca);
		return registro;
	}
}
