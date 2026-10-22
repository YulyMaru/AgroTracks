package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.CosechaDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.CosechaVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CosechaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Cosecha;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;

/** 3.4 Cosecha de un cultivo del usuario. */
public class GestorCosecha implements GestorRegistro<Cosecha, CosechaDatos> {

	private final CosechaRepositorio cosechas;
	private final Referencias referencias;
	private final ValidadorCatalogo catalogo;

	public GestorCosecha(CosechaRepositorio cosechas, Referencias referencias, ValidadorCatalogo catalogo) {
		this.cosechas = cosechas;
		this.referencias = referencias;
		this.catalogo = catalogo;
	}

	@Override
	public Entidad entidad() {
		return Entidad.COSECHA;
	}

	@Override
	public Class<CosechaDatos> claseDatos() {
		return CosechaDatos.class;
	}

	@Override
	public RepositorioRegistro<Cosecha> repositorio() {
		return cosechas;
	}

	@Override
	public void validar(UUID idUsuario, UUID idRegistro, CosechaDatos datos) {
		Gestores.padreSinCambios(cosechas, idRegistro, Cosecha::getIdCultivo, datos.idCultivo(), "el cultivo");
		referencias.cultivo(idUsuario, datos.idCultivo());
		catalogo.validar(ValidadorCatalogo.UNIDAD, datos.unidad(), "unidad");
	}

	@Override
	public Cosecha crear(UUID id, UUID idUsuario, CosechaDatos datos) {
		Cosecha cosecha = new Cosecha(id, idUsuario);
		cosecha.setIdCultivo(datos.idCultivo());
		actualizar(cosecha, datos);
		return cosecha;
	}

	@Override
	public void actualizar(Cosecha cosecha, CosechaDatos datos) {
		cosecha.setFecha(datos.fecha());
		cosecha.setCantidad(datos.cantidad());
		cosecha.setUnidad(datos.unidad());
	}

	@Override
	public CosechaVista vista(Cosecha r) {
		return new CosechaVista(r.getId(), r.getVersion(), r.isEliminado(), r.getActualizadoEn(), r.getIdCultivo(), r.getFecha(), r.getCantidad(), r.getUnidad());
	}
}
