package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.GastoDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.GastoVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.GastoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.registros.dominio.Gasto;

/** 3.6 Gasto asignado a la finca, a un lote o a un cultivo. La finca se completa sola. */
public class GestorGasto implements GestorRegistro<Gasto, GastoDatos> {

	private final GastoRepositorio gastos;
	private final Referencias referencias;
	private final ValidadorCatalogo catalogo;

	public GestorGasto(GastoRepositorio gastos, Referencias referencias, ValidadorCatalogo catalogo) {
		this.gastos = gastos;
		this.referencias = referencias;
		this.catalogo = catalogo;
	}

	@Override
	public Entidad entidad() {
		return Entidad.GASTO;
	}

	@Override
	public Class<GastoDatos> claseDatos() {
		return GastoDatos.class;
	}

	@Override
	public RepositorioRegistro<Gasto> repositorio() {
		return gastos;
	}

	@Override
	public void validar(UUID idUsuario, UUID idRegistro, GastoDatos datos) {
		catalogo.validar(ValidadorCatalogo.CATEGORIA_GASTO, datos.categoria(), "categoria");
		referencias.fincaDe(idUsuario, datos.nivelAsignacion(), datos.idAsignacion());
	}

	@Override
	public Gasto crear(UUID id, UUID idUsuario, GastoDatos datos) {
		Gasto gasto = new Gasto(id, idUsuario);
		actualizar(gasto, datos);
		return gasto;
	}

	@Override
	public void actualizar(Gasto gasto, GastoDatos datos) {
		gasto.setFecha(datos.fecha());
		gasto.setCategoria(datos.categoria());
		gasto.setConcepto(datos.concepto().trim());
		gasto.setValor(datos.valor());
		gasto.setNivelAsignacion(datos.nivelAsignacion());
		gasto.setIdAsignacion(datos.idAsignacion());
		gasto.setIdFinca(referencias.fincaDe(gasto.getIdUsuario(), datos.nivelAsignacion(), datos.idAsignacion()));
	}

	@Override
	public GastoVista vista(Gasto r) {
		return new GastoVista(r.getId(), r.getVersion(), r.isEliminado(), r.getActualizadoEn(), r.getFecha(), r.getCategoria(), r.getConcepto(), r.getValor(), r.getNivelAsignacion(), r.getIdAsignacion(), r.getIdFinca());
	}
}
