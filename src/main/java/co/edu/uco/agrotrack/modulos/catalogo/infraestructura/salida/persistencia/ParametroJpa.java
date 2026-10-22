package co.edu.uco.agrotrack.modulos.catalogo.infraestructura.salida.persistencia;

import co.edu.uco.agrotrack.compartido.infraestructura.persistencia.EntidadJpa;
import co.edu.uco.agrotrack.modulos.catalogo.dominio.Parametro;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Fila de la tabla parametros. */
@Entity
@Table(name = "parametros")
class ParametroJpa extends EntidadJpa {

	@Column(nullable = false, length = 40)
	private String tipo;

	@Column(nullable = false, length = 60)
	private String codigo;

	@Column(nullable = false, length = 120)
	private String etiqueta;

	@Column(nullable = false)
	private int orden;

	@Column(nullable = false)
	private boolean activo;

	protected ParametroJpa() {
	}

	Parametro aDominio() {
		return new Parametro(getId(), tipo, codigo, etiqueta, orden, activo, getActualizadoEn());
	}
}
