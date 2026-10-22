package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.LaborRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Labor;

/** Adaptador de salida: guarda y lee labores con JPA. */
@Component
class LaborAdaptadorJpa extends AdaptadorRegistroJpa<Labor, LaborJpa> implements LaborRepositorio {

	LaborAdaptadorJpa(LaborJpaRepositorio repositorio) {
		super(repositorio, LaborJpa::new);
	}
}
