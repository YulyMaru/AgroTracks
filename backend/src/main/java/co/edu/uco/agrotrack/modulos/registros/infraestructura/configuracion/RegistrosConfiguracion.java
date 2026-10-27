package co.edu.uco.agrotrack.modulos.registros.infraestructura.configuracion;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.ConversorJson;
import co.edu.uco.agrotrack.compartido.aplicacion.puerto.Transacciones;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.GestionarRegistros;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CatalogoPuerto;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CosechaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.CultivoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.DependenciasRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.FincaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.GastoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.HistorialRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.LaborRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.LoteRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.OtroIngresoRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.salida.VentaRepositorio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorCosecha;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorCultivo;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorFinca;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorGasto;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorLabor;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorLote;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorOtroIngreso;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorRegistro;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.GestorVenta;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.Referencias;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.RegistrosServicio;
import co.edu.uco.agrotrack.modulos.registros.aplicacion.servicio.ValidadorCatalogo;

/**
 * Conecta los casos de uso de registros con sus adaptadores. La aplicacion no tiene anotaciones
 * de Spring: todo se arma aqui.
 */
@Configuration
class RegistrosConfiguracion {

	@Bean
	Referencias referencias(FincaRepositorio fincas, LoteRepositorio lotes, CultivoRepositorio cultivos) {
		return new Referencias(fincas, lotes, cultivos);
	}

	@Bean
	ValidadorCatalogo validadorCatalogo(CatalogoPuerto catalogo) {
		return new ValidadorCatalogo(catalogo);
	}

	@Bean
	GestorFinca gestorFinca(FincaRepositorio fincas, DependenciasRepositorio dependencias) {
		return new GestorFinca(fincas, dependencias);
	}

	@Bean
	GestorLote gestorLote(LoteRepositorio lotes, DependenciasRepositorio dependencias, Referencias referencias,
			ValidadorCatalogo catalogo) {
		return new GestorLote(lotes, dependencias, referencias, catalogo);
	}

	@Bean
	GestorCultivo gestorCultivo(CultivoRepositorio cultivos, DependenciasRepositorio dependencias,
			Referencias referencias, ValidadorCatalogo catalogo) {
		return new GestorCultivo(cultivos, dependencias, referencias, catalogo);
	}

	@Bean
	GestorCosecha gestorCosecha(CosechaRepositorio cosechas, Referencias referencias, ValidadorCatalogo catalogo) {
		return new GestorCosecha(cosechas, referencias, catalogo);
	}

	@Bean
	GestorVenta gestorVenta(VentaRepositorio ventas, Referencias referencias, ValidadorCatalogo catalogo) {
		return new GestorVenta(ventas, referencias, catalogo);
	}

	@Bean
	GestorGasto gestorGasto(GastoRepositorio gastos, Referencias referencias, ValidadorCatalogo catalogo) {
		return new GestorGasto(gastos, referencias, catalogo);
	}

	@Bean
	GestorOtroIngreso gestorOtroIngreso(OtroIngresoRepositorio otrosIngresos, Referencias referencias,
			ValidadorCatalogo catalogo) {
		return new GestorOtroIngreso(otrosIngresos, referencias, catalogo);
	}

	@Bean
	GestorLabor gestorLabor(LaborRepositorio labores, Referencias referencias, ValidadorCatalogo catalogo) {
		return new GestorLabor(labores, referencias, catalogo);
	}

	@Bean
	GestionarRegistros gestionarRegistros(List<GestorRegistro<?, ?>> gestores, ConversorJson json,
			HistorialRepositorio historial, Transacciones transacciones) {
		return new RegistrosServicio(gestores, json, historial, transacciones);
	}
}
