package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;

/**
 * Base de todo registro del campesino (docs/ModeloDeDatos.md, seccion 1): pertenece a un usuario
 * (R2), tiene una version que sube con cada cambio (R4) y se borra de forma logica (R5). El id lo
 * genera el celular (R3). Es Java puro: no sabe como ni donde se guarda.
 */
public abstract class Registro {

	private final UUID id;
	private final UUID idUsuario;
	private int version;
	private boolean eliminado;
	private Instant actualizadoEn;

	protected Registro(UUID id, UUID idUsuario) {
		this.id = id;
		this.idUsuario = idUsuario;
		this.version = 1;
		this.eliminado = false;
	}

	/** Devuelve el estado guardado (lo usa el adaptador de persistencia al leer). */
	public void restaurar(int version, boolean eliminado, Instant actualizadoEn) {
		this.version = version;
		this.eliminado = eliminado;
		this.actualizadoEn = actualizadoEn;
	}

	public boolean perteneceA(UUID idUsuario) {
		return this.idUsuario.equals(idUsuario);
	}

	/**
	 * Solo se edita o elimina un registro vigente y en la misma version que tenia el celular: si
	 * otro celular lo cambio antes, se rechaza en vez de pisar ese cambio (R4).
	 */
	public void verificarCambio(int versionBase) {
		if (eliminado) {
			throw new ExcepcionAgroTrack(CodigoError.CONFLICTO, "Este registro ya fue eliminado.");
		}
		if (version != versionBase) {
			throw new ExcepcionAgroTrack(CodigoError.CONFLICTO,
					"Este registro se cambió desde otro celular. Actualiza los datos y vuelve a intentarlo.",
					List.of("versión del celular: " + versionBase, "versión guardada: " + version));
		}
	}

	/** Se llama despues de aplicar una edicion. */
	public void nuevaVersion() {
		version++;
	}

	/** Borrado logico: el registro se conserva para el historial. */
	public void eliminar() {
		eliminado = true;
		version++;
	}

	public UUID getId() {
		return id;
	}

	public UUID getIdUsuario() {
		return idUsuario;
	}

	public int getVersion() {
		return version;
	}

	public boolean isEliminado() {
		return eliminado;
	}

	public Instant getActualizadoEn() {
		return actualizadoEn;
	}
}
