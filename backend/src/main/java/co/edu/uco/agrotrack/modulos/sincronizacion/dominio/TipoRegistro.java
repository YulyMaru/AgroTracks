package co.edu.uco.agrotrack.modulos.sincronizacion.dominio;

/**
 * Que registro cambio en el celular. Tiene los mismos nombres que los registros del modulo de
 * registros, pero es propio de este modulo: asi la sincronizacion no depende de su dominio.
 */
public enum TipoRegistro {
	FINCA, LOTE, CULTIVO, COSECHA, VENTA, GASTO, OTRO_INGRESO, LABOR
}
