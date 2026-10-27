package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import java.util.UUID;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.DependenciasRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.NivelAsignacion;

/** Adaptador de salida: consulta en varias tablas si un registro tiene otros que dependen de el. */
@Component
class DependenciasAdaptadorJpa implements DependenciasRepositorio {

	private final LoteJpaRepositorio lotes;
	private final CultivoJpaRepositorio cultivos;
	private final CosechaJpaRepositorio cosechas;
	private final VentaJpaRepositorio ventas;
	private final LaborJpaRepositorio labores;
	private final GastoJpaRepositorio gastos;
	private final OtroIngresoJpaRepositorio otrosIngresos;

	DependenciasAdaptadorJpa(LoteJpaRepositorio lotes, CultivoJpaRepositorio cultivos, CosechaJpaRepositorio cosechas,
			VentaJpaRepositorio ventas, LaborJpaRepositorio labores, GastoJpaRepositorio gastos,
			OtroIngresoJpaRepositorio otrosIngresos) {
		this.lotes = lotes;
		this.cultivos = cultivos;
		this.cosechas = cosechas;
		this.ventas = ventas;
		this.labores = labores;
		this.gastos = gastos;
		this.otrosIngresos = otrosIngresos;
	}

	@Override
	public boolean fincaTieneDependientes(UUID idFinca) {
		return lotes.existsByIdFincaAndEliminadoFalse(idFinca)
				|| gastos.existsByIdFincaAndEliminadoFalse(idFinca)
				|| otrosIngresos.existsByIdFincaAndEliminadoFalse(idFinca);
	}

	@Override
	public boolean loteTieneDependientes(UUID idLote) {
		return cultivos.existsByIdLoteAndEliminadoFalse(idLote) || asignado(NivelAsignacion.LOTE, idLote);
	}

	@Override
	public boolean cultivoTieneDependientes(UUID idCultivo) {
		return cosechas.existsByIdCultivoAndEliminadoFalse(idCultivo)
				|| ventas.existsByIdCultivoAndEliminadoFalse(idCultivo)
				|| labores.existsByIdCultivoAndEliminadoFalse(idCultivo)
				|| asignado(NivelAsignacion.CULTIVO, idCultivo);
	}

	private boolean asignado(NivelAsignacion nivel, UUID id) {
		return gastos.existsByNivelAsignacionAndIdAsignacionAndEliminadoFalse(nivel, id)
				|| otrosIngresos.existsByNivelAsignacionAndIdAsignacionAndEliminadoFalse(nivel, id);
	}
}
