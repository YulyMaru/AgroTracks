package co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.registros.dominio.NivelAsignacion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Puerto de entrada: datos de cada formulario (docs/ModeloDeDatos.md, seccion 3). TODOS son obligatorios (R1): un
 * dato vacio, en blanco o que el modelo no define se rechaza. El dinero va en pesos enteros (R6)
 * y las fechas no pueden ser futuras (R7).
 */
public final class RegistrosDatos {

	private RegistrosDatos() {
	}

	/** 3.1 */
	public record FincaDatos(
			@NotBlank @Size(max = 120) String nombre,
			@NotBlank @Size(max = 80) String municipio,
			@NotBlank @Size(max = 80) String vereda) {
	}

	/** 3.2 */
	public record LoteDatos(
			@NotNull UUID idFinca,
			@NotBlank @Size(max = 120) String nombre,
			@NotNull @Positive @Digits(integer = 10, fraction = 4) BigDecimal area,
			@NotBlank @Size(max = 30) String unidadArea) {
	}

	/** 3.3 */
	public record CultivoDatos(
			@NotNull UUID idLote,
			@NotBlank @Size(max = 60) String tipoCultivo,
			@NotBlank @Size(max = 120) String especie,
			@NotNull @PastOrPresent LocalDate fechaSiembra) {
	}

	/** 3.4 */
	public record CosechaDatos(
			@NotNull UUID idCultivo,
			@NotNull @PastOrPresent LocalDate fecha,
			@NotNull @Positive @Digits(integer = 11, fraction = 3) BigDecimal cantidad,
			@NotBlank @Size(max = 30) String unidad) {
	}

	/** 3.5 */
	public record VentaDatos(
			@NotNull UUID idCultivo,
			@NotNull @PastOrPresent LocalDate fecha,
			@NotNull @Positive @Digits(integer = 11, fraction = 3) BigDecimal cantidad,
			@NotBlank @Size(max = 30) String unidad,
			@NotNull @Positive Long valorTotal) {
	}

	/** 3.6 */
	public record GastoDatos(
			@NotNull @PastOrPresent LocalDate fecha,
			@NotBlank @Size(max = 60) String categoria,
			@NotBlank @Size(max = 150) String concepto,
			@NotNull @Positive Long valor,
			@NotNull NivelAsignacion nivelAsignacion,
			@NotNull UUID idAsignacion) {
	}

	/** 3.7 */
	public record OtroIngresoDatos(
			@NotNull @PastOrPresent LocalDate fecha,
			@NotBlank @Size(max = 60) String tipoIngreso,
			@NotBlank @Size(max = 150) String concepto,
			@NotNull @Positive Long valor,
			@NotNull NivelAsignacion nivelAsignacion,
			@NotNull UUID idAsignacion) {
	}

	/** 3.8: insumos puede ser una lista vacia (no se uso nada), pero no puede faltar. */
	public record LaborDatos(
			@NotNull UUID idCultivo,
			@NotBlank @Size(max = 60) String tipoLabor,
			@NotNull @PastOrPresent LocalDate fecha,
			@NotBlank @Size(max = 300) String descripcion,
			@NotNull @Positive @DecimalMax("24") @Digits(integer = 2, fraction = 2) BigDecimal horas,
			@NotNull @Min(1) @Max(1000) Integer trabajadores,
			@NotNull @Size(max = 20) List<@Valid @NotNull InsumoDatos> insumos) {
	}

	public record InsumoDatos(
			@NotBlank @Size(max = 60) String tipoInsumo,
			@NotNull @Positive @Digits(integer = 11, fraction = 3) BigDecimal cantidad,
			@NotBlank @Size(max = 30) String unidad) {
	}
}
