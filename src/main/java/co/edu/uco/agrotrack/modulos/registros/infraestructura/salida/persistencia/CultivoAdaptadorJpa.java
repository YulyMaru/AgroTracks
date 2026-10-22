package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CultivoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Cultivo;

/** Adaptador de salida: guarda y lee cultivos con JPA. */
@Component
class CultivoAdaptadorJpa extends AdaptadorRegistroJpa<Cultivo, CultivoJpa> implements CultivoRepositorio {

	CultivoAdaptadorJpa(CultivoJpaRepositorio repositorio) {
		super(repositorio, CultivoJpa::new);
	}
}
