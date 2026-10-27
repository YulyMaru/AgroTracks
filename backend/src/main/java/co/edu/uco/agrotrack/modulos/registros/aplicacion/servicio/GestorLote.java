package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.LoteDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.LoteVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.DependenciasRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.LoteRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.registros.dominio.Lote;

/** 3.2 Lote: el nombre es unico dentro de su finca. */
public class GestorLote implements GestorRegistro<Lote, LoteDatos> {

	private final LoteRepositorio lotes;
	private final DependenciasRepositorio dependencias;
	private final Referencias referencias;
	private final ValidadorCatalogo catalogo;

	public GestorLote(LoteRepositorio lotes, DependenciasRepositorio dependencias, Referencias referencias, ValidadorCatalogo catalogo) {
		this.lotes = lotes;
		this.dependencias = dependencias;
		this.referencias = referencias;
		this.catalogo = catalogo;
	}

	@Override
	public Entidad entidad() {
		return Entidad.LOTE;
	}

	@Override
	public Class<LoteDatos> claseDatos() {
		return LoteDatos.class;
	}

	@Override
	public RepositorioRegistro<Lote> repositorio() {
		return lotes;
	}

	@Override
	public void validar(UUID idUsuario, UUID idRegistro, LoteDatos datos) {
		Gestores.padreSinCambios(lotes, idRegistro, Lote::getIdFinca, datos.idFinca(), "la finca");
		referencias.finca(idUsuario, datos.idFinca());
		catalogo.validar(ValidadorCatalogo.UNIDAD_AREA, datos.unidadArea(), "unidadArea");
		if (lotes.existeNombreEnFinca(datos.idFinca(), datos.nombre().trim(), idRegistro)) {
			throw new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION, "Esta finca ya tiene un lote con ese nombre.");
		}
	}

	@Override
	public Lote crear(UUID id, UUID idUsuario, LoteDatos datos) {
		Lote lote = new Lote(id, idUsuario);
		lote.setIdFinca(datos.idFinca());
		actualizar(lote, datos);
		return lote;
	}

	@Override
	public void actualizar(Lote lote, LoteDatos datos) {
		lote.setNombre(datos.nombre().trim());
		lote.setArea(datos.area());
		lote.setUnidadArea(datos.unidadArea());
	}

	@Override
	public void verificarEliminable(Lote lote) {
		Gestores.noEliminable(dependencias.loteTieneDependientes(lote.getId()),
				"Este lote tiene cultivos, gastos o ingresos. Elimínalos primero.");
	}

	@Override
	public LoteVista vista(Lote r) {
		return new LoteVista(r.getId(), r.getVersion(), r.isEliminado(), r.getActualizadoEn(), r.getIdFinca(), r.getNombre(), r.getArea(), r.getUnidadArea());
	}
}
