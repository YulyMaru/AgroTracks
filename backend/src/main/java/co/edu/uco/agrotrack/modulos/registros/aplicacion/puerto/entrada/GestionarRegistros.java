package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.CambioVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.VistaRegistro;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;

/**
 * Puerto de entrada de los registros (docs/ModeloDeDatos.md, seccion 5). Lo usan igual la API
 * directa y la sincronizacion, asi un registro offline pasa por las mismas reglas.
 */
public interface GestionarRegistros {

	/** Resultado de un cambio: el registro como quedo y si ya estaba aplicado de antes. */
	record Resultado(VistaRegistro registro, int version, boolean yaAplicado) {
	}

	/** Crear con un id que ya existe no duplica: devuelve el registro guardado (R3). */
	Resultado crear(UUID idUsuario, Entidad entidad, UUID id, Map<String, Object> contenido);

	/** Exige la version que tenia el celular (R4) y guarda la copia anterior en el historial. */
	Resultado editar(UUID idUsuario, Entidad entidad, UUID id, int versionBase, Map<String, Object> contenido);

	/** Borrado logico (R5). Repetir un borrado ya hecho no es un error. */
	Resultado eliminar(UUID idUsuario, Entidad entidad, UUID id, int versionBase);

	List<VistaRegistro> listar(UUID idUsuario, Entidad entidad);

	/** Todo lo que cambio desde una fecha, incluidos los eliminados, para la copia del celular. */
	List<VistaRegistro> modificadosDesde(UUID idUsuario, Entidad entidad, Instant desde);

	List<CambioVista> historial(UUID idUsuario, Entidad entidad, UUID id);
}
