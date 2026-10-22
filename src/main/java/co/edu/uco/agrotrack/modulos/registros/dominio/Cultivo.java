package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.time.LocalDate;
import java.util.UUID;

/** 3.3 Cultivo, siempre dentro de un lote. */
public class Cultivo extends Registro {

	private UUID idLote;
	private String tipoCultivo;
	private String especie;
	private LocalDate fechaSiembra;

	public Cultivo(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	public UUID getIdLote() {
		return idLote;
	}

	public void setIdLote(UUID idLote) {
		this.idLote = idLote;
	}

	public String getTipoCultivo() {
		return tipoCultivo;
	}

	public void setTipoCultivo(String tipoCultivo) {
		this.tipoCultivo = tipoCultivo;
	}

	public String getEspecie() {
		return especie;
	}

	public void setEspecie(String especie) {
		this.especie = especie;
	}

	public LocalDate getFechaSiembra() {
		return fechaSiembra;
	}

	public void setFechaSiembra(LocalDate fechaSiembra) {
		this.fechaSiembra = fechaSiembra;
	}
}
