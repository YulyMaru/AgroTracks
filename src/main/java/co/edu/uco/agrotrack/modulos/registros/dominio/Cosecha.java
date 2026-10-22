package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** 3.4 Cosecha de un cultivo. */
public class Cosecha extends Registro {

	private UUID idCultivo;
	private LocalDate fecha;
	private BigDecimal cantidad;
	private String unidad;

	public Cosecha(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	public UUID getIdCultivo() {
		return idCultivo;
	}

	public void setIdCultivo(UUID idCultivo) {
		this.idCultivo = idCultivo;
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public void setFecha(LocalDate fecha) {
		this.fecha = fecha;
	}

	public BigDecimal getCantidad() {
		return cantidad;
	}

	public void setCantidad(BigDecimal cantidad) {
		this.cantidad = cantidad;
	}

	public String getUnidad() {
		return unidad;
	}

	public void setUnidad(String unidad) {
		this.unidad = unidad;
	}
}
