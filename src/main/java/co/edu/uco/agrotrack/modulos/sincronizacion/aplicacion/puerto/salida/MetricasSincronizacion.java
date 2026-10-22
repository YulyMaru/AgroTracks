package co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida;

import java.util.function.Supplier;

import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.Accion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.EstadoOperacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;

/** Puerto de salida: metricas de la sincronizacion (Prometheus en la implementacion actual). */
public interface MetricasSincronizacion {

	<T> T medirLote(Supplier<T> trabajo);

	void operacionProcesada(TipoRegistro entidad, Accion accion, EstadoOperacion resultado);

	void reintentos(int cantidad);
}
