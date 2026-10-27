package co.edu.uco.agrotrack.modulos.sincronizacion.infraestructura.configuracion;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.Transacciones;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizarCambios;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.MetricasSincronizacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.OperacionesSincronizadasRepositorio;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.RegistrosPuerto;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.servicio.SincronizacionServicio;

/** Conecta el caso de uso de sincronizacion con sus adaptadores. */
@Configuration
class SincronizacionConfiguracion {

	@Bean
	SincronizarCambios sincronizarCambios(OperacionesSincronizadasRepositorio aplicadas, RegistrosPuerto registros,
			Transacciones transacciones, MetricasSincronizacion metricas, PropiedadesSincronizacion propiedades) {
		return new SincronizacionServicio(aplicadas, registros, transacciones, metricas,
				propiedades.maxOperacionesPorLote());
	}
}
