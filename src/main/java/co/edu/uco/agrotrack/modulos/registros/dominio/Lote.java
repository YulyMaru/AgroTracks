package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.math.BigDecimal;
import java.util.UUID;

/** 3.2 Lote de una finca. Su finca no cambia despues de creado. */
public class Lote extends Registro {

	private UUID idFinca;
	private String nombre;
	private BigDecimal area;
	private String unidadArea;

	public Lote(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	public UUID getIdFinca() {
		return idFinca;
	}

	public void setIdFinca(UUID idFinca) {
		this.idFinca = idFinca;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public BigDecimal getArea() {
		return area;
	}

	public void setArea(BigDecimal area) {
		this.area = area;
	}

	public String getUnidadArea() {
		return unidadArea;
	}

	public void setUnidadArea(String unidadArea) {
		this.unidadArea = unidadArea;
	}
}
