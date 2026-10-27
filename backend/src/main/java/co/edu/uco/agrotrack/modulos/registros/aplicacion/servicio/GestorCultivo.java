package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.CultivoDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.CultivoVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CultivoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.DependenciasRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Cultivo;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;

/** 3.3 Cultivo: siempre dentro de un lote del usuario. */
public class GestorCultivo implements GestorRegistro<Cultivo, CultivoDatos> {

	private final CultivoRepositorio cultivos;
	private final DependenciasRepositorio dependencias;
	private final Referencias referencias;
	private final ValidadorCatalogo catalogo;

	public GestorCultivo(CultivoRepositorio cultivos, DependenciasRepositorio dependencias, Referencias referencias, ValidadorCatalogo catalogo) {
		this.cultivos = cultivos;
		this.dependencias = dependencias;
		this.referencias = referencias;
		this.catalogo = catalogo;
	}

	@Override
	public Entidad entidad() {
		return Entidad.CULTIVO;
	}

	@Override
	public Class<CultivoDatos> claseDatos() {
		return CultivoDatos.class;
	}

	@Override
	public RepositorioRegistro<Cultivo> repositorio() {
		return cultivos;
	}

	@Override
	public void validar(UUID idUsuario, UUID idRegistro, CultivoDatos datos) {
		Gestores.padreSinCambios(cultivos, idRegistro, Cultivo::getIdLote, datos.idLote(), "el lote");
		referencias.lote(idUsuario, datos.idLote());
		catalogo.validar(ValidadorCatalogo.TIPO_CULTIVO, datos.tipoCultivo(), "tipoCultivo");
	}

	@Override
	public Cultivo crear(UUID id, UUID idUsuario, CultivoDatos datos) {
		Cultivo cultivo = new Cultivo(id, idUsuario);
		cultivo.setIdLote(datos.idLote());
		actualizar(cultivo, datos);
		return cultivo;
	}

	@Override
	public void actualizar(Cultivo cultivo, CultivoDatos datos) {
		cultivo.setTipoCultivo(datos.tipoCultivo());
		cultivo.setEspecie(datos.especie().trim());
		cultivo.setFechaSiembra(datos.fechaSiembra());
	}

	@Override
	public void verificarEliminable(Cultivo cultivo) {
		Gestores.noEliminable(dependencias.cultivoTieneDependientes(cultivo.getId()),
				"Este cultivo tiene cosechas, ventas, labores, gastos o ingresos. Elimínalos primero.");
	}

	@Override
	public CultivoVista vista(Cultivo r) {
		return new CultivoVista(r.getId(), r.getVersion(), r.isEliminado(), r.getActualizadoEn(), r.getIdLote(), r.getTipoCultivo(), r.getEspecie(), r.getFechaSiembra());
	}
}
