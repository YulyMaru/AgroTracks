package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.OtroIngresoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.OtroIngreso;

/** Adaptador de salida: guarda y lee otros_ingresos con JPA. */
@Component
class OtroIngresoAdaptadorJpa extends AdaptadorRegistroJpa<OtroIngreso, OtroIngresoJpa> implements OtroIngresoRepositorio {

	OtroIngresoAdaptadorJpa(OtroIngresoJpaRepositorio repositorio) {
		super(repositorio, OtroIngresoJpa::new);
	}
}
