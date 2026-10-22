package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.VentaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Venta;

/** Adaptador de salida: guarda y lee ventas con JPA. */
@Component
class VentaAdaptadorJpa extends AdaptadorRegistroJpa<Venta, VentaJpa> implements VentaRepositorio {

	VentaAdaptadorJpa(VentaJpaRepositorio repositorio) {
		super(repositorio, VentaJpa::new);
	}
}
