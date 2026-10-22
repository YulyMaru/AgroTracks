package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.NivelAsignacion;

/**
 * Puerto de entrada: como se ve cada registro hacia afuera (API y copia del celular). Incluyen
 * version y eliminado. Tambien son la copia que se guarda en el historial.
 */
public final class RegistrosVistas {

	private RegistrosVistas() {
	}

	public record FincaVista(UUID id, int version, boolean eliminado, Instant actualizadoEn, String nombre,
			String municipio, String vereda) {
	}

	public record LoteVista(UUID id, int version, boolean eliminado, Instant actualizadoEn, UUID idFinca,
			String nombre, BigDecimal area, String unidadArea) {
	}

	public record CultivoVista(UUID id, int version, boolean eliminado, Instant actualizadoEn, UUID idLote,
			String tipoCultivo, String especie, LocalDate fechaSiembra) {
	}

	public record CosechaVista(UUID id, int version, boolean eliminado, Instant actualizadoEn, UUID idCultivo,
			LocalDate fecha, BigDecimal cantidad, String unidad) {
	}

	public record VentaVista(UUID id, int version, boolean eliminado, Instant actualizadoEn, UUID idCultivo,
			LocalDate fecha, BigDecimal cantidad, String unidad, Long valorTotal) {
	}

	public record GastoVista(UUID id, int version, boolean eliminado, Instant actualizadoEn, LocalDate fecha,
			String categoria, String concepto, Long valor, NivelAsignacion nivelAsignacion, UUID idAsignacion,
			UUID idFinca) {
	}

	public record OtroIngresoVista(UUID id, int version, boolean eliminado, Instant actualizadoEn,
			LocalDate fecha, String tipoIngreso, String concepto, Long valor, NivelAsignacion nivelAsignacion,
			UUID idAsignacion, UUID idFinca) {
	}

	public record LaborVista(UUID id, int version, boolean eliminado, Instant actualizadoEn, UUID idCultivo,
			String tipoLabor, LocalDate fecha, String descripcion, BigDecimal horas, Integer trabajadores,
			List<InsumoVista> insumos) {
	}

	public record InsumoVista(String tipoInsumo, BigDecimal cantidad, String unidad) {
	}

	/** Historial de un registro: la copia de como estaba antes de cada cambio. */
	public record CambioVista(int version, String accion, String datosAnteriores, Instant fecha) {
	}
}
