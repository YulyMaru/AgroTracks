package co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.CambiosVista;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.EstadoOperacionVista;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.OperacionPendiente;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.RespuestaSincronizacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;

/** Puerto de entrada de la sincronizacion al reconectar (ADR-001, ADR-005, ADR-007, HU-23, HU-44). */
public interface SincronizarCambios {

	/** Aplica la cola del celular en orden de creacion; cada operacion en su propia transaccion. */
	RespuestaSincronizacion sincronizar(UUID idUsuario, List<OperacionPendiente> operaciones,
			Set<TipoRegistro> permitidos);

	/** Confirma si una operacion ya llego al servidor (tras un timeout). */
	EstadoOperacionVista consultarOperacion(UUID idUsuario, UUID idOperacion);

	/** Lo que cambio en el servidor desde una fecha, para la copia del celular (HU-24). */
	CambiosVista cambiosDesde(UUID idUsuario, Instant desde);

	int maxOperacionesPorLote();
}
