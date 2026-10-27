package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.ConversorJson;
import co.edu.uco.agrotrack.compartido.aplicacion.puerto.Transacciones;
import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.GestionarRegistros;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.CambioVista;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.RegistrosVistas.VistaRegistro;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.HistorialRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.registros.dominio.HistorialCambio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Registro;

/**
 * Caso de uso: crear, editar y eliminar cualquier registro (docs/ModeloDeDatos.md, seccion 5).
 * <ul>
 * <li>Crear con un id que ya existe no duplica: devuelve el registro guardado (R3).</li>
 * <li>Editar y eliminar exigen la version que tenia el celular (R4, regla del dominio).</li>
 * <li>Antes de cada cambio se guarda la copia anterior en el historial (R4, R5).</li>
 * <li>Eliminar es logico: el registro queda con {@code eliminado = true} (R5).</li>
 * </ul>
 * Cada metodo corre en una transaccion; si ya hay una abierta (la sincronizacion), se une a ella.
 */
public class RegistrosServicio implements GestionarRegistros {

	private final Map<Entidad, GestorRegistro<?, ?>> gestores = new EnumMap<>(Entidad.class);
	private final ConversorJson json;
	private final HistorialRepositorio historial;
	private final Transacciones transacciones;

	public RegistrosServicio(List<GestorRegistro<?, ?>> gestores, ConversorJson json, HistorialRepositorio historial,
			Transacciones transacciones) {
		gestores.forEach(g -> this.gestores.put(g.entidad(), g));
		for (Entidad entidad : Entidad.values()) {
			if (!this.gestores.containsKey(entidad)) {
				throw new IllegalStateException("Falta el gestor de " + entidad);
			}
		}
		this.json = json;
		this.historial = historial;
		this.transacciones = transacciones;
	}

	@Override
	public Resultado crear(UUID idUsuario, Entidad entidad, UUID id, Map<String, Object> contenido) {
		return transacciones.ejecutar(() -> crear(gestores.get(entidad), idUsuario, id, contenido));
	}

	@Override
	public Resultado editar(UUID idUsuario, Entidad entidad, UUID id, int versionBase, Map<String, Object> contenido) {
		return transacciones.ejecutar(() -> editar(gestores.get(entidad), idUsuario, id, versionBase, contenido));
	}

	@Override
	public Resultado eliminar(UUID idUsuario, Entidad entidad, UUID id, int versionBase) {
		return transacciones.ejecutar(() -> eliminar(gestores.get(entidad), idUsuario, id, versionBase));
	}

	@Override
	public List<VistaRegistro> listar(UUID idUsuario, Entidad entidad) {
		return transacciones.ejecutar(() -> vigentes(gestores.get(entidad), idUsuario));
	}

	@Override
	public List<VistaRegistro> modificadosDesde(UUID idUsuario, Entidad entidad, Instant desde) {
		return transacciones.ejecutar(() -> modificados(gestores.get(entidad), idUsuario, desde));
	}

	@Override
	public List<CambioVista> historial(UUID idUsuario, Entidad entidad, UUID id) {
		return transacciones.ejecutar(() -> {
			buscarDelUsuario(gestores.get(entidad), idUsuario, id);
			return historial.deRegistro(idUsuario, entidad.tabla(), id).stream()
					.map(h -> new CambioVista(h.version(), h.accion().name(), h.datosAnteriores(), h.fecha()))
					.toList();
		});
	}

	// --- Implementacion generica -----------------------------------------------------------------

	private <E extends Registro, D> Resultado crear(GestorRegistro<E, D> gestor, UUID idUsuario, UUID id,
			Map<String, Object> contenido) {
		var existente = gestor.repositorio().buscar(id);
		if (existente.isPresent()) {
			E registro = existente.get();
			if (!registro.perteneceA(idUsuario)) {
				throw new ExcepcionAgroTrack(CodigoError.CONFLICTO, "El identificador ya está en uso.");
			}
			return new Resultado(gestor.vista(registro), registro.getVersion(), true);
		}
		D datos = json.leer(contenido, gestor.claseDatos());
		gestor.validar(idUsuario, id, datos);
		E registro = gestor.repositorio().guardar(gestor.crear(id, idUsuario, datos));
		return new Resultado(gestor.vista(registro), registro.getVersion(), false);
	}

	private <E extends Registro, D> Resultado editar(GestorRegistro<E, D> gestor, UUID idUsuario, UUID id,
			int versionBase, Map<String, Object> contenido) {
		E registro = buscarDelUsuario(gestor, idUsuario, id);
		registro.verificarCambio(versionBase);
		D datos = json.leer(contenido, gestor.claseDatos());
		gestor.validar(idUsuario, id, datos);
		guardarCopia(gestor, registro, HistorialCambio.Accion.EDITAR);
		gestor.actualizar(registro, datos);
		registro.nuevaVersion();
		registro = gestor.repositorio().guardar(registro);
		return new Resultado(gestor.vista(registro), registro.getVersion(), false);
	}

	private <E extends Registro, D> Resultado eliminar(GestorRegistro<E, D> gestor, UUID idUsuario, UUID id,
			int versionBase) {
		E registro = buscarDelUsuario(gestor, idUsuario, id);
		if (registro.isEliminado()) {
			// Reintento de un borrado que ya se hizo: no es un error.
			return new Resultado(gestor.vista(registro), registro.getVersion(), true);
		}
		registro.verificarCambio(versionBase);
		gestor.verificarEliminable(registro);
		guardarCopia(gestor, registro, HistorialCambio.Accion.ELIMINAR);
		registro.eliminar();
		registro = gestor.repositorio().guardar(registro);
		return new Resultado(gestor.vista(registro), registro.getVersion(), false);
	}

	private static <E extends Registro> E buscarDelUsuario(GestorRegistro<E, ?> gestor, UUID idUsuario, UUID id) {
		return gestor.repositorio().buscar(id)
				.filter(r -> r.perteneceA(idUsuario))
				.orElseThrow(() -> ExcepcionAgroTrack.noEncontrado("ese registro"));
	}

	private <E extends Registro> void guardarCopia(GestorRegistro<E, ?> gestor, E registro,
			HistorialCambio.Accion accion) {
		historial.guardar(HistorialCambio.de(registro, gestor.entidad(), accion, json.escribir(gestor.vista(registro))));
	}

	private static <E extends Registro> List<VistaRegistro> vigentes(GestorRegistro<E, ?> gestor, UUID idUsuario) {
		return gestor.repositorio().vigentes(idUsuario).stream().map(gestor::vista).toList();
	}

	private static <E extends Registro> List<VistaRegistro> modificados(GestorRegistro<E, ?> gestor, UUID idUsuario,
			Instant desde) {
		return gestor.repositorio().modificadosDesde(idUsuario, desde).stream().map(gestor::vista).toList();
	}
}
