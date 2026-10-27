package co.edu.uco.agrotrack.modulos.catalogo.infraestructura.configuracion;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.entrada.ConsultarCatalogo;
import co.edu.uco.agrotrack.modulos.catalogo.aplicacion.puerto.salida.ParametroRepositorio;
import co.edu.uco.agrotrack.modulos.catalogo.aplicacion.servicio.CatalogoServicio;

/** Conecta el caso de uso del catalogo con su adaptador de persistencia. */
@Configuration
class CatalogoConfiguracion {

	@Bean
	ConsultarCatalogo consultarCatalogo(ParametroRepositorio parametros) {
		return new CatalogoServicio(parametros);
	}
}
