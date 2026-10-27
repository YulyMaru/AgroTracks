package co.edu.uco.agrotrack.modulos.registros.dominio;

import java.math.BigDecimal;

/** Insumo usado en una labor (seccion 3.8.1). */
public record Insumo(String tipoInsumo, BigDecimal cantidad, String unidad) {
}
