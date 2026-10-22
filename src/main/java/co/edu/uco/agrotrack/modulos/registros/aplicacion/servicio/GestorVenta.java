package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.VentaDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.VentaVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.VentaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.registros.dominio.Venta;

/** 3.5 Venta de la produccion de un cultivo del usuario. */
public class GestorVenta implements GestorRegistro<Venta, VentaDatos> {

	private final VentaRepositorio ventas;
	private final Referencias referencias;
	private final ValidadorCatalogo catalogo;

	public GestorVenta(VentaRepositorio ventas, Referencias referencias, ValidadorCatalogo catalogo) {
		this.ventas = ventas;
		this.referencias = referencias;
		this.catalogo = catalogo;
	}

	@Override
	public Entidad entidad() {
		return Entidad.VENTA;
	}

	@Override
	public Class<VentaDatos> claseDatos() {
		return VentaDatos.class;
	}

	@Override
	public RepositorioRegistro<Venta> repositorio() {
		return ventas;
	}

	@Override
	public void validar(UUID idUsuario, UUID idRegistro, VentaDatos datos) {
		Gestores.padreSinCambios(ventas, idRegistro, Venta::getIdCultivo, datos.idCultivo(), "el cultivo");
		referencias.cultivo(idUsuario, datos.idCultivo());
		catalogo.validar(ValidadorCatalogo.UNIDAD, datos.unidad(), "unidad");
	}

	@Override
	public Venta crear(UUID id, UUID idUsuario, VentaDatos datos) {
		Venta venta = new Venta(id, idUsuario);
		venta.setIdCultivo(datos.idCultivo());
		actualizar(venta, datos);
		return venta;
	}

	@Override
	public void actualizar(Venta venta, VentaDatos datos) {
		venta.setFecha(datos.fecha());
		venta.setCantidad(datos.cantidad());
		venta.setUnidad(datos.unidad());
		venta.setValorTotal(datos.valorTotal());
	}

	@Override
	public VentaVista vista(Venta r) {
		return new VentaVista(r.getId(), r.getVersion(), r.isEliminado(), r.getActualizadoEn(), r.getIdCultivo(), r.getFecha(), r.getCantidad(), r.getUnidad(), r.getValorTotal());
	}
}
