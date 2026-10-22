package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** 3.5 Venta de la produccion de un cultivo, en pesos enteros. */
public class Venta extends Registro {

	private UUID idCultivo;
	private LocalDate fecha;
	private BigDecimal cantidad;
	private String unidad;
	private Long valorTotal;

	public Venta(UUID id, UUID idUsuario) {
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

	public Long getValorTotal() {
		return valorTotal;
	}

	public void setValorTotal(Long valorTotal) {
		this.valorTotal = valorTotal;
	}
}
