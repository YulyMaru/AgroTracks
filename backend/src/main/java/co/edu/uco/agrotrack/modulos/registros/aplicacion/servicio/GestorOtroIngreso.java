package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.OtroIngresoDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.OtroIngresoVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.OtroIngresoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.registros.dominio.OtroIngreso;

/** 3.7 Otro ingreso asignado a la finca, a un lote o a un cultivo. La finca se completa sola. */
public class GestorOtroIngreso implements GestorRegistro<OtroIngreso, OtroIngresoDatos> {

	private final OtroIngresoRepositorio otrosIngresos;
	private final Referencias referencias;
	private final ValidadorCatalogo catalogo;

	public GestorOtroIngreso(OtroIngresoRepositorio otrosIngresos, Referencias referencias, ValidadorCatalogo catalogo) {
		this.otrosIngresos = otrosIngresos;
		this.referencias = referencias;
		this.catalogo = catalogo;
	}

	@Override
	public Entidad entidad() {
		return Entidad.OTRO_INGRESO;
	}

	@Override
	public Class<OtroIngresoDatos> claseDatos() {
		return OtroIngresoDatos.class;
	}

	@Override
	public RepositorioRegistro<OtroIngreso> repositorio() {
		return otrosIngresos;
	}

	@Override
	public void validar(UUID idUsuario, UUID idRegistro, OtroIngresoDatos datos) {
		catalogo.validar(ValidadorCatalogo.TIPO_INGRESO, datos.tipoIngreso(), "tipoIngreso");
		referencias.fincaDe(idUsuario, datos.nivelAsignacion(), datos.idAsignacion());
	}

	@Override
	public OtroIngreso crear(UUID id, UUID idUsuario, OtroIngresoDatos datos) {
		OtroIngreso otroIngreso = new OtroIngreso(id, idUsuario);
		actualizar(otroIngreso, datos);
		return otroIngreso;
	}

	@Override
	public void actualizar(OtroIngreso otroIngreso, OtroIngresoDatos datos) {
		otroIngreso.setFecha(datos.fecha());
		otroIngreso.setTipoIngreso(datos.tipoIngreso());
		otroIngreso.setConcepto(datos.concepto().trim());
		otroIngreso.setValor(datos.valor());
		otroIngreso.setNivelAsignacion(datos.nivelAsignacion());
		otroIngreso.setIdAsignacion(datos.idAsignacion());
		otroIngreso.setIdFinca(referencias.fincaDe(otroIngreso.getIdUsuario(), datos.nivelAsignacion(), datos.idAsignacion()));
	}

	@Override
	public OtroIngresoVista vista(OtroIngreso r) {
		return new OtroIngresoVista(r.getId(), r.getVersion(), r.isEliminado(), r.getActualizadoEn(), r.getFecha(), r.getTipoIngreso(), r.getConcepto(), r.getValor(), r.getNivelAsignacion(), r.getIdAsignacion(), r.getIdFinca());
	}
}
