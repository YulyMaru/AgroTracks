package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Finca;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Fila de la tabla fincas. Solo la conoce el adaptador de persistencia. */
@Entity
@Table(name = "fincas")
class FincaJpa extends RegistroJpa<Finca> {

	@Column(nullable = false, length = 120)
	private String nombre;

	@Column(nullable = false, length = 80)
	private String municipio;

	@Column(nullable = false, length = 80)
	private String vereda;

	protected FincaJpa() {
	}

	FincaJpa(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	@Override
	protected void copiarDatos(Finca registro) {
		nombre = registro.getNombre();
		municipio = registro.getMunicipio();
		vereda = registro.getVereda();
	}

	@Override
	protected Finca crearDominio() {
		Finca registro = new Finca(getId(), getIdUsuario());
		registro.setNombre(nombre);
		registro.setMunicipio(municipio);
		registro.setVereda(vereda);
		return registro;
	}
}
