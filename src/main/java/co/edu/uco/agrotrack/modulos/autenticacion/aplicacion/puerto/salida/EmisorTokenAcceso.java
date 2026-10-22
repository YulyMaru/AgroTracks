package co.edu.uco.agrotrack.modulos.autenticacion.aplicacion.puerto.salida;

import co.edu.uco.agrotrack.modulos.autenticacion.dominio.Usuario;

/** Puerto de salida: firmar el access token de un usuario (JWT HS256 en la implementacion actual). */
public interface EmisorTokenAcceso {

	TokenAcceso emitir(Usuario usuario);

	record TokenAcceso(String valor, long vigenciaSegundos) {
	}
}
