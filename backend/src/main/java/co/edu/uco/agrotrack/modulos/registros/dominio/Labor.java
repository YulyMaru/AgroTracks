package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** 3.8 Labor hecha en un cultivo, con sus horas, trabajadores e insumos usados. */
public class Labor extends Registro {

	private UUID idCultivo;
	private String tipoLabor;
	private LocalDate fecha;
	private String descripcion;
	private BigDecimal horas;
	private Integer trabajadores;
	private List<Insumo> insumos = List.of();

	public Labor(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	public UUID getIdCultivo() {
		return idCultivo;
	}

	public void setIdCultivo(UUID idCultivo) {
		this.idCultivo = idCultivo;
	}

	public String getTipoLabor() {
		return tipoLabor;
	}

	public void setTipoLabor(String tipoLabor) {
		this.tipoLabor = tipoLabor;
	}

	public LocalDate getFecha() {
		return fecha;
	}

	public void setFecha(LocalDate fecha) {
		this.fecha = fecha;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public BigDecimal getHoras() {
		return horas;
	}

	public void setHoras(BigDecimal horas) {
		this.horas = horas;
	}

	public Integer getTrabajadores() {
		return trabajadores;
	}

	public void setTrabajadores(Integer trabajadores) {
		this.trabajadores = trabajadores;
	}

	public List<Insumo> getInsumos() {
		return insumos;
	}

	/** Los insumos se reemplazan completos en cada edicion (puede quedar vacia). */
	public void setInsumos(List<Insumo> insumos) {
		this.insumos = List.copyOf(insumos);
	}
}
