package co.edu.uco.agrotrack.modulos.registros.infraestructura.salida.catalogo;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.entrada.ConsultarCatalogo;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CatalogoPuerto;

/**
 * Adaptador de salida hacia el modulo de catalogo. Es el unico punto donde registros toca otro
 * modulo, y solo a traves de su puerto de entrada.
 */
@Component
class CatalogoAdaptador implements CatalogoPuerto {

	private final ConsultarCatalogo catalogo;

	CatalogoAdaptador(ConsultarCatalogo catalogo) {
		this.catalogo = catalogo;
	}

	@Override
	public boolean existeActivo(String tipo, String codigo) {
		return catalogo.existeActivo(tipo, codigo);
	}
}
