package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.persistencia;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.GastoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.dominio.Gasto;

/** Adaptador de salida: guarda y lee gastos con JPA. */
@Component
class GastoAdaptadorJpa extends AdaptadorRegistroJpa<Gasto, GastoJpa> implements GastoRepositorio {

	GastoAdaptadorJpa(GastoJpaRepositorio repositorio) {
		super(repositorio, GastoJpa::new);
	}
}
