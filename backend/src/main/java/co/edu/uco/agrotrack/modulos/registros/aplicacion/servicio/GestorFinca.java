package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.FincaDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.FincaVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.DependenciasRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.FincaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.registros.dominio.Finca;

/** 3.1 Finca: el nombre es unico entre las fincas vigentes del usuario. */
public class GestorFinca implements GestorRegistro<Finca, FincaDatos> {

	private final FincaRepositorio fincas;
	private final DependenciasRepositorio dependencias;

	public GestorFinca(FincaRepositorio fincas, DependenciasRepositorio dependencias) {
		this.fincas = fincas;
		this.dependencias = dependencias;
	}

	@Override
	public Entidad entidad() {
		return Entidad.FINCA;
	}

	@Override
	public Class<FincaDatos> claseDatos() {
		return FincaDatos.class;
	}

	@Override
	public RepositorioRegistro<Finca> repositorio() {
		return fincas;
	}

	@Override
	public void validar(UUID idUsuario, UUID idRegistro, FincaDatos datos) {
		if (fincas.existeNombre(idUsuario, datos.nombre().trim(), idRegistro)) {
			throw new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION, "Ya tienes una finca con ese nombre.");
		}
	}

	@Override
	public Finca crear(UUID id, UUID idUsuario, FincaDatos datos) {
		Finca finca = new Finca(id, idUsuario);
		actualizar(finca, datos);
		return finca;
	}

	@Override
	public void actualizar(Finca finca, FincaDatos datos) {
		finca.setNombre(datos.nombre().trim());
		finca.setMunicipio(datos.municipio().trim());
		finca.setVereda(datos.vereda().trim());
	}

	@Override
	public void verificarEliminable(Finca finca) {
		Gestores.noEliminable(dependencias.fincaTieneDependientes(finca.getId()),
				"Esta finca tiene lotes, gastos o ingresos. Elimínalos primero.");
	}

	@Override
	public FincaVista vista(Finca r) {
		return new FincaVista(r.getId(), r.getVersion(), r.isEliminado(), r.getActualizadoEn(), r.getNombre(), r.getMunicipio(), r.getVereda());
	}
}
