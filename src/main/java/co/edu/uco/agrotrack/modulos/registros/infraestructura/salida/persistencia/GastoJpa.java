package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.time.LocalDate;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Gasto;
import co.edu.uco.agrotrack.modulos.registros.dominio.NivelAsignacion;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/** Fila de la tabla gastos. Solo la conoce el adaptador de persistencia. */
@Entity
@Table(name = "gastos")
class GastoJpa extends RegistroJpa<Gasto> {

	@Column(nullable = false)
	private LocalDate fecha;

	@Column(nullable = false, length = 60)
	private String categoria;

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

	protected GastoJpa() {
	}

	GastoJpa(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	@Override
	protected void copiarDatos(Gasto registro) {
		fecha = registro.getFecha();
		categoria = registro.getCategoria();
		concepto = registro.getConcepto();
		valor = registro.getValor();
		nivelAsignacion = registro.getNivelAsignacion();
		idAsignacion = registro.getIdAsignacion();
		idFinca = registro.getIdFinca();
	}

	@Override
	protected Gasto crearDominio() {
		Gasto registro = new Gasto(getId(), getIdUsuario());
		registro.setFecha(fecha);
		registro.setCategoria(categoria);
		registro.setConcepto(concepto);
		registro.setValor(valor);
		registro.setNivelAsignacion(nivelAsignacion);
		registro.setIdAsignacion(idAsignacion);
		registro.setIdFinca(idFinca);
		return registro;
	}
}
