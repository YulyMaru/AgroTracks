package co.edu.uco.agrotrack.modulos.sincronizacion.infraestructura.configuracion;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("agrotrack.sincronizacion")
record PropiedadesSincronizacion(int maxOperacionesPorLote) {

	PropiedadesSincronizacion {
		if (maxOperacionesPorLote <= 0) {
			maxOperacionesPorLote = 100;
		}
	}
}
