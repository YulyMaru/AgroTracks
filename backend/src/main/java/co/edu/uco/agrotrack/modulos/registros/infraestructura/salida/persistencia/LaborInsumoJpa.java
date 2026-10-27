package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.math.BigDecimal;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.Insumo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Fila de la tabla labor_insumos (seccion 3.8.1). Se reemplazan completos al editar la labor. */
@Entity
@Table(name = "labor_insumos")
class LaborInsumoJpa {

	@Id
	private UUID id;

	@Column(name = "tipo_insumo", nullable = false, length = 60)
	private String tipoInsumo;

	@Column(nullable = false, precision = 14, scale = 3)
	private BigDecimal cantidad;

	@Column(nullable = false, length = 30)
	private String unidad;

	protected LaborInsumoJpa() {
	}

	LaborInsumoJpa(Insumo insumo) {
		this.id = UUID.randomUUID();
		this.tipoInsumo = insumo.tipoInsumo();
		this.cantidad = insumo.cantidad();
		this.unidad = insumo.unidad();
	}

	Insumo aDominio() {
		return new Insumo(tipoInsumo, cantidad, unidad);
	}
}
