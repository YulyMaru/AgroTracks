package co.edu.uco.agrotrack.modulos.sincronizacion.infraestructura.salida.registros;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import co.edu.uco.agrotrack.modulos.registros.aplicacion.puerto.entrada.GestionarRegistros;
import co.edu.uco.agrotrack.modulos.registros.dominio.Entidad;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.OperacionPendiente;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.RegistrosPuerto;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;

/**
 * Adaptador de salida hacia el modulo de registros: traduce cada operacion de la cola al puerto de
 * entrada de registros. Es el unico punto donde la sincronizacion toca otro modulo.
 */
@Component
class RegistrosAdaptador implements RegistrosPuerto {

	private final GestionarRegistros registros;

	RegistrosAdaptador(GestionarRegistros registros) {
		this.registros = registros;
	}

	@Override
	public CambioAplicado aplicar(UUID idUsuario, OperacionPendiente op) {
		Entidad entidad = entidad(op.entidad());
		GestionarRegistros.Resultado r = switch (op.accion()) {
			case CREAR -> registros.crear(idUsuario, entidad, op.idRegistro(), op.contenido());
			case EDITAR -> registros.editar(idUsuario, entidad, op.idRegistro(), op.versionBase(), op.contenido());
			case ELIMINAR -> registros.eliminar(idUsuario, entidad, op.idRegistro(), op.versionBase());
		};
		return new CambioAplicado(r.version(), r.yaAplicado());
	}

	@Override
	public List<Object> modificadosDesde(UUID idUsuario, TipoRegistro tipo, Instant desde) {
		return registros.modificadosDesde(idUsuario, entidad(tipo), desde);
	}

	private static Entidad entidad(TipoRegistro tipo) {
		return Entidad.valueOf(tipo.name());
	}
}
