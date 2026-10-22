package co.edu.uco.agrotrack.compartido.dominio;

/**
 * Codigos de error estandarizados (ADR-024). Son del negocio: que estado HTTP le corresponde a
 * cada uno lo decide el adaptador web ({@code ManejadorGlobalErrores}).
 */
public enum CodigoError {
	ERROR_VALIDACION,
	AUTENTICACION_REQUERIDA,
	ACCESO_DENEGADO,
	NO_ENCONTRADO,
	CONFLICTO,
	OPERACION_YA_REGISTRADA,
	ERROR_INTERNO,
	SERVICIO_NO_DISPONIBLE
}
