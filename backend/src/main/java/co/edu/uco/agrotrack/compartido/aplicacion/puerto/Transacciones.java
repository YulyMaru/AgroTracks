package co.edu.uco.agrotrack.compartido.aplicacion.puerto;

import java.util.function.Supplier;

/**
 * Puerto de salida: ejecutar un trabajo en una transaccion de base de datos. Si ya hay una
 * transaccion abierta, el trabajo se une a ella. Si el trabajo lanza una excepcion, se deshace todo.
 */
public interface Transacciones {

	<T> T ejecutar(Supplier<T> trabajo);
}
