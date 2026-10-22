package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.InsumoDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosDatos.LaborDatos;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.InsumoVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.LaborVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.LaborRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.RepositorioRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.registros.dominio.Insumo;
import co.edu.uco.agrotrack.modulos.registros.dominio.Labor;

/** 3.8 Labor de un cultivo, con sus horas, trabajadores e insumos (que se reemplazan al editar). */
public class GestorLabor implements GestorRegistro<Labor, LaborDatos> {

	private final LaborRepositorio labores;
	private final Referencias referencias;
	private final ValidadorCatalogo catalogo;

	public GestorLabor(LaborRepositorio labores, Referencias referencias, ValidadorCatalogo catalogo) {
		this.labores = labores;
		this.referencias = referencias;
		this.catalogo = catalogo;
	}

	@Override
	public Entidad entidad() {
		return Entidad.LABOR;
	}

	@Override
	public Class<LaborDatos> claseDatos() {
		return LaborDatos.class;
	}

	@Override
	public RepositorioRegistro<Labor> repositorio() {
		return labores;
	}

	@Override
	public void validar(UUID idUsuario, UUID idRegistro, LaborDatos datos) {
		Gestores.padreSinCambios(labores, idRegistro, Labor::getIdCultivo, datos.idCultivo(), "el cultivo");
		referencias.cultivo(idUsuario, datos.idCultivo());
		catalogo.validar(ValidadorCatalogo.TIPO_LABOR, datos.tipoLabor(), "tipoLabor");
		for (InsumoDatos insumo : datos.insumos()) {
			catalogo.validar(ValidadorCatalogo.TIPO_INSUMO, insumo.tipoInsumo(), "insumos.tipoInsumo");
			catalogo.validar(ValidadorCatalogo.UNIDAD, insumo.unidad(), "insumos.unidad");
		}
	}

	@Override
	public Labor crear(UUID id, UUID idUsuario, LaborDatos datos) {
		Labor labor = new Labor(id, idUsuario);
		labor.setIdCultivo(datos.idCultivo());
		actualizar(labor, datos);
		return labor;
	}

	@Override
	public void actualizar(Labor labor, LaborDatos datos) {
		labor.setTipoLabor(datos.tipoLabor());
		labor.setFecha(datos.fecha());
		labor.setDescripcion(datos.descripcion().trim());
		labor.setHoras(datos.horas());
		labor.setTrabajadores(datos.trabajadores());
		labor.setInsumos(datos.insumos().stream()
				.map(i -> new Insumo(i.tipoInsumo(), i.cantidad(), i.unidad()))
				.toList());
	}

	@Override
	public LaborVista vista(Labor r) {
		return new LaborVista(r.getId(), r.getVersion(), r.isEliminado(), r.getActualizadoEn(), r.getIdCultivo(), r.getTipoLabor(), r.getFecha(),
				r.getDescripcion(), r.getHoras(), r.getTrabajadores(),
				r.getInsumos().stream().map(i -> new InsumoVista(i.tipoInsumo(), i.cantidad(), i.unidad())).toList());
	}
}
