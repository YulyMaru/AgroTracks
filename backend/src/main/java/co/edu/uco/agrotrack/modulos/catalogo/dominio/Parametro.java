package co.edu.uco.agrotrack.modulos.catalogo.dominio;

import java.time.Instant;
import java.util.UUID;

/** Parametro no sensible del catalogo compartido (ADR-029). Se desactiva, nunca se elimina. */
public record Parametro(UUID id, String tipo, String codigo, String etiqueta, int orden, boolean activo,
		Instant actualizadoEn) {
}
