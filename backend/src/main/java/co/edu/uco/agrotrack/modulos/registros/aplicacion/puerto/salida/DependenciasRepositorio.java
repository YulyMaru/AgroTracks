package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida;

import java.util.UUID;

/**
 * Puerto de salida: si una finca, lote o cultivo tiene registros vigentes que dependen de el. Asi
 * nunca quedan registros huerfanos al eliminar (seccion 5).
 */
public interface DependenciasRepositorio {

	/** Lotes, gastos u otros ingresos de la finca. */
	boolean fincaTieneDependientes(UUID idFinca);

	/** Cultivos del lote, o gastos u otros ingresos asignados al lote. */
	boolean loteTieneDependientes(UUID idLote);

	/** Cosechas, ventas, labores, o gastos u otros ingresos asignados al cultivo. */
	boolean cultivoTieneDependientes(UUID idCultivo);
}
