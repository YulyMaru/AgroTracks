package co.edu.uco.agrotrack.modulos.autenticacion.infraestructura.configuracion;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.Transacciones;
import co.edu.uco.agrotrack.compartido.infraestructura.seguridad.PropiedadesSeguridad;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.entrada.GestionarSesiones;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.CifradorClaves;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.EmisorTokenAcceso;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.TokenRenovacionRepositorio;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida.UsuarioRepositorio;
import co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.servicio.AutenticacionServicio;

/** Conecta el caso de uso de sesiones con sus adaptadores. */
@Configuration
class AutenticacionConfiguracion {

	@Bean
	GestionarSesiones gestionarSesiones(UsuarioRepositorio usuarios, TokenRenovacionRepositorio tokens,
			CifradorClaves cifrador, EmisorTokenAcceso emisor, Transacciones transacciones,
			PropiedadesSeguridad propiedades) {
		return new AutenticacionServicio(usuarios, tokens, cifrador, emisor, transacciones,
				Duration.ofDays(propiedades.refreshTokenDias()));
	}
}
