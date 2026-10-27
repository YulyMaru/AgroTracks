package co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio;

import java.util.UUID;

import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CultivoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.FincaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.LoteRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Cultivo;
import co.edu.uco.agrotrack.modulos.registros.dominio.Finca;
import co.edu.uco.agrotrack.modulos.registros.dominio.Lote;
import co.edu.uco.agrotrack.modulos.registros.dominio.NivelAsignacion;

/**
 * Verifica que una finca, lote o cultivo exista, sea del usuario (R2) y no este eliminado (R5),
 * y obtiene la finca de cualquiera de ellos.
 */
public class Referencias {

	private final FincaRepositorio fincas;
	private final LoteRepositorio lotes;
	private final CultivoRepositorio cultivos;

	public Referencias(FincaRepositorio fincas, LoteRepositorio lotes, CultivoRepositorio cultivos) {
		this.fincas = fincas;
		this.lotes = lotes;
		this.cultivos = cultivos;
	}

	public Finca finca(UUID idUsuario, UUID id) {
		return fincas.buscar(id)
				.filter(f -> f.perteneceA(idUsuario) && !f.isEliminado())
				.orElseThrow(() -> ExcepcionAgroTrack.noEncontrado("la finca"));
	}

	public Lote lote(UUID idUsuario, UUID id) {
		return lotes.buscar(id)
				.filter(l -> l.perteneceA(idUsuario) && !l.isEliminado())
				.orElseThrow(() -> ExcepcionAgroTrack.noEncontrado("el lote"));
	}

	public Cultivo cultivo(UUID idUsuario, UUID id) {
		return cultivos.buscar(id)
				.filter(c -> c.perteneceA(idUsuario) && !c.isEliminado())
				.orElseThrow(() -> ExcepcionAgroTrack.noEncontrado("el cultivo"));
	}

	/** Finca a la que pertenece lo asignado (la finca misma, la finca del lote o la del cultivo). */
	public UUID fincaDe(UUID idUsuario, NivelAsignacion nivel, UUID idAsignacion) {
		return switch (nivel) {
			case FINCA -> finca(idUsuario, idAsignacion).getId();
			case LOTE -> lote(idUsuario, idAsignacion).getIdFinca();
			case CULTIVO -> lote(idUsuario, cultivo(idUsuario, idAsignacion).getIdLote()).getIdFinca();
		};
	}
}
