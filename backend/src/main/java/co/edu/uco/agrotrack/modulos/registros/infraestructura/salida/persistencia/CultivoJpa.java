package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.time.LocalDate;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Cultivo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Fila de la tabla cultivos. Solo la conoce el adaptador de persistencia. */
@Entity
@Table(name = "cultivos")
class CultivoJpa extends RegistroJpa<Cultivo> {

	@Column(name = "id_lote", nullable = false)
	private UUID idLote;

	@Column(name = "tipo_cultivo", nullable = false, length = 60)
	private String tipoCultivo;

	@Column(nullable = false, length = 120)
	private String especie;

	@Column(name = "fecha_siembra", nullable = false)
	private LocalDate fechaSiembra;

	protected CultivoJpa() {
	}

	CultivoJpa(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	@Override
	protected void copiarDatos(Cultivo registro) {
		idLote = registro.getIdLote();
		tipoCultivo = registro.getTipoCultivo();
		especie = registro.getEspecie();
		fechaSiembra = registro.getFechaSiembra();
	}

	@Override
	protected Cultivo crearDominio() {
		Cultivo registro = new Cultivo(getId(), getIdUsuario());
		registro.setIdLote(idLote);
		registro.setTipoCultivo(tipoCultivo);
		registro.setEspecie(especie);
		registro.setFechaSiembra(fechaSiembra);
		return registro;
	}
}
