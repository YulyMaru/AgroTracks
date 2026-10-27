package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.util.UUID;

/** 3.1 Finca del campesino: nombre unico entre sus fincas, con municipio y vereda. */
public class Finca extends Registro {

	private String nombre;
	private String municipio;
	private String vereda;

	public Finca(UUID id, UUID idUsuario) {
		super(id, idUsuario);
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getMunicipio() {
		return municipio;
	}

	public void setMunicipio(String municipio) {
		this.municipio = municipio;
	}

	public String getVereda() {
		return vereda;
	}

	public void setVereda(String vereda) {
		this.vereda = vereda;
	}
}
