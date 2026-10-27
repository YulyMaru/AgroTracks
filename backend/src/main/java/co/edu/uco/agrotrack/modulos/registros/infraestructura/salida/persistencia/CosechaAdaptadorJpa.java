package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CosechaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Cosecha;

/** Adaptador de salida: guarda y lee cosechas con JPA. */
@Component
class CosechaAdaptadorJpa extends AdaptadorRegistroJpa<Cosecha, CosechaJpa> implements CosechaRepositorio {

	CosechaAdaptadorJpa(CosechaJpaRepositorio repositorio) {
		super(repositorio, CosechaJpa::new);
	}
}
