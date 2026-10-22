package co.edu.uco.agrotrack.modulos.catalogo.aplicacion.servicio;

import java.time.Instant;
import java.util.List;

import co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.entrada.ConsultarCatalogo;
import co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.salida.ParametroRepositorio;
import co.edu.uco.agrotrack.modulos.catalogo.dominio.Parametro;

/** Caso de uso: consultar el catalogo (ADR-029). */
public class CatalogoServicio implements ConsultarCatalogo {

	private final ParametroRepositorio parametros;

	public CatalogoServicio(ParametroRepositorio parametros) {
		this.parametros = parametros;
	}

	@Override
	public List<Parametro> listar(Instant desde) {
		return desde == null ? parametros.activos() : parametros.modificadosDesde(desde);
	}

	@Override
	public boolean existeActivo(String tipo, String codigo) {
		return codigo != null && parametros.existeActivo(tipo, codigo);
	}
}
