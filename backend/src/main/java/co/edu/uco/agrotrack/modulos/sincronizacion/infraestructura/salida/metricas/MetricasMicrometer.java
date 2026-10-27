package co.edu.uco.agrotrack.modulos.sincronizacion.infraestructura.salida.metricas;

import java.util.function.Supplier;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.MetricasSincronizacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.Accion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.EstadoOperacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

/**
 * Adaptador de salida: metricas con Micrometer (Prometheus):
 * {@code agrotrack_sincronizacion_operaciones_total{entidad,accion,resultado}},
 * {@code agrotrack_sincronizacion_reintentos_total} y {@code agrotrack_sincronizacion_lote_seconds}.
 */
@Component
class MetricasMicrometer implements MetricasSincronizacion {

	private final MeterRegistry registro;

	MetricasMicrometer(MeterRegistry registro) {
		this.registro = registro;
	}

	@Override
	public <T> T medirLote(Supplier<T> trabajo) {
		Timer.Sample muestra = Timer.start(registro);
		try {
			return trabajo.get();
		} finally {
			muestra.stop(registro.timer("agrotrack.sincronizacion.lote"));
		}
	}

	@Override
	public void operacionProcesada(TipoRegistro entidad, Accion accion, EstadoOperacion resultado) {
		registro.counter("agrotrack.sincronizacion.operaciones", "entidad", entidad.name(), "accion", accion.name(),
				"resultado", resultado.name()).increment();
	}

	@Override
	public void reintentos(int cantidad) {
		registro.counter("agrotrack.sincronizacion.reintentos").increment(cantidad);
	}
}
