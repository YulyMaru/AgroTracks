package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.time.LocalDate;
import java.util.UUID;

/** 3.6 Gasto asignado a la finca, a un lote o a un cultivo. La finca se calcula sola. */
public class Gasto extends Registro {

	private LocalDate fecha;
	private String categoria;
	private String concepto;
	private Long valor;
	private NivelAsignacion nivelAsignacion;
	private UUID idAsignacion;
	private UUID idFinca;

	public Gasto(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public void setFecha(LocalDate fecha) {
		this.fecha = fecha;
	}

	public String getCategoria() {
		return categoria;
	}

	public void setCategoria(String categoria) {
		this.categoria = categoria;
	}

	public String getConcepto() {
		return concepto;
	}

	public void setConcepto(String concepto) {
		this.concepto = concepto;
	}

	public Long getValor() {
		return valor;
	}

	public void setValor(Long valor) {
		this.valor = valor;
	}

	public NivelAsignacion getNivelAsignacion() {
		return nivelAsignacion;
	}

	public void setNivelAsignacion(NivelAsignacion nivelAsignacion) {
		this.nivelAsignacion = nivelAsignacion;
	}

	public UUID getIdAsignacion() {
		return idAsignacion;
	}

	public void setIdAsignacion(UUID idAsignacion) {
		this.idAsignacion = idAsignacion;
	}

	public UUID getIdFinca() {
		return idFinca;
	}

	public void setIdFinca(UUID idFinca) {
		this.idFinca = idFinca;
	}
}
