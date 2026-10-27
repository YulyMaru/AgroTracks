package co.edu.uco.agrotrack.compartido.aplicacion.puerto;

import java.util.Map;

/** Puerto de salida: leer los datos de un formulario (JSON) y escribir copias en JSON. */
public interface ConversorJson {

	/**
	 * Convierte el contenido al tipo pedido y lo valida. Es estricto: un campo que el modelo no
	 * define o un decimal donde se esperan pesos enteros se rechaza con ERROR_VALIDACION.
	 */
	<T> T leer(Map<String, Object> contenido, Class<T> tipo);

	String escribir(Object valor);
}
