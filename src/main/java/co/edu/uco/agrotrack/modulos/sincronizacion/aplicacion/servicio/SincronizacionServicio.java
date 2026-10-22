package co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.servicio;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import co.edu.uco.agrotrack.compartido.aplicacion.puerto.Transacciones;
import co.edu.uco.agrotrack.compartido.dominio.CodigoError;
import co.edu.uco.agrotrack.compartido.dominio.ConflictoDeDatos;
import co.edu.uco.agrotrack.compartido.dominio.ExcepcionAgroTrack;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.CambiosVista;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.EstadoOperacionVista;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.OperacionPendiente;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.RespuestaSincronizacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizacionModelos.ResultadoOperacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.entrada.SincronizarCambios;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.MetricasSincronizacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.OperacionesSincronizadasRepositorio;
import co.edu.uco.agrotrack.modulos.sincronizacion.aplicacion.puerto.salida.RegistrosPuerto;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.EstadoOperacion;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.OperacionSincronizada;
import co.edu.uco.agrotrack.modulos.sincronizacion.dominio.TipoRegistro;

/**
 * Motor de sincronizacion del lado servidor (ADR-001, ADR-005, ADR-007, HU-23, HU-44).
 *
 * <p>Recibe la cola de operaciones pendientes del movil (crear, editar o eliminar) y aplica cada
 * una en su <b>propia transaccion</b>, en orden de creacion. Asi:
 * <ul>
 * <li>Un dato invalido o un conflicto de version solo afecta a su operacion (ERROR) y las demas siguen.</li>
 * <li>Si el servidor falla a mitad del lote (BD caida, timeout), lo ya aplicado queda registrado y el
 * movil puede reenviar el lote completo: lo aplicado vuelve como YA_REGISTRADO y nunca se repite.</li>
 * </ul>
 * Las reglas de cada registro son las del modulo de registros, al que llega por {@link RegistrosPuerto}.
 */
public class SincronizacionServicio implements SincronizarCambios {

	private static final Logger LOG = LoggerFactory.getLogger(SincronizacionServicio.class);

	private final OperacionesSincronizadasRepositorio aplicadas;
	private final RegistrosPuerto registros;
	private final Transacciones transacciones;
	private final MetricasSincronizacion metricas;
	private final int maxOperacionesPorLote;

	public SincronizacionServicio(OperacionesSincronizadasRepositorio aplicadas, RegistrosPuerto registros,
			Transacciones transacciones, MetricasSincronizacion metricas, int maxOperacionesPorLote) {
		this.aplicadas = aplicadas;
		this.registros = registros;
		this.transacciones = transacciones;
		this.metricas = metricas;
		this.maxOperacionesPorLote = maxOperacionesPorLote;
	}

	@Override
	public RespuestaSincronizacion sincronizar(UUID idUsuario, List<OperacionPendiente> operaciones,
			Set<TipoRegistro> permitidos) {
		if (operaciones.size() > maxOperacionesPorLote) {
			throw new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION,
					"Envía como máximo " + maxOperacionesPorLote + " operaciones por solicitud.");
		}
		return metricas.medirLote(() -> {
			// Orden de creacion: una finca creada offline debe aplicarse antes que sus lotes, y una
			// edicion antes que la siguiente edicion del mismo registro.
			List<OperacionPendiente> ordenadas = new ArrayList<>(operaciones);
			ordenadas.sort(Comparator.comparing(OperacionPendiente::creadoEn));

			List<ResultadoOperacion> resultados = new ArrayList<>(ordenadas.size());
			for (OperacionPendiente operacion : ordenadas) {
				ResultadoOperacion resultado = procesar(idUsuario, operacion, permitidos);
				metricas.operacionProcesada(operacion.entidad(), operacion.accion(), resultado.estado());
				if (operacion.reintentos() > 0) {
					metricas.reintentos(operacion.reintentos());
				}
				resultados.add(resultado);
			}
			return resumir(resultados);
		});
	}

	ResultadoOperacion procesar(UUID idUsuario, OperacionPendiente operacion, Set<TipoRegistro> permitidos) {
		if (!permitidos.contains(operacion.entidad())) {
			return error(operacion, new ExcepcionAgroTrack(CodigoError.ERROR_VALIDACION,
					"Este tipo de registro no se puede sincronizar por esta ruta."));
		}

		// 1. Reintento de algo ya aplicado: no se vuelve a ejecutar.
		var previa = aplicadas.buscar(operacion.idOperacion());
		if (previa.isPresent()) {
			return yaRegistrada(idUsuario, operacion, previa.get());
		}

		// 2. Aplicacion atomica: cambio + historial + registro de idempotencia en la misma transaccion.
		try {
			RegistrosPuerto.CambioAplicado aplicado = transacciones.ejecutar(() -> {
				var cambio = registros.aplicar(idUsuario, operacion);
				aplicadas.guardar(new OperacionSincronizada(operacion.idOperacion(), idUsuario, operacion.entidad(),
						operacion.accion(), operacion.idRegistro(), cambio.version(), operacion.creadoEn(), Instant.now()));
				return cambio;
			});
			EstadoOperacion estado = aplicado.yaAplicado() ? EstadoOperacion.YA_REGISTRADO
					: EstadoOperacion.SINCRONIZADO;
			return new ResultadoOperacion(operacion.idOperacion(), operacion.entidad(), operacion.accion(),
					operacion.idRegistro(), estado, aplicado.version(), null, mensajeExito(estado), List.of());
		} catch (ExcepcionAgroTrack e) {
			// Dato invalido o conflicto (equivale a 4xx): el movil la marca ERROR y conserva el registro.
			LOG.info("Operacion {} ({} {}) rechazada: {}", operacion.idOperacion(), operacion.accion(),
					operacion.entidad(), e.getMessage());
			return error(operacion, e);
		} catch (ConflictoDeDatos e) {
			// Carrera: otro reintento concurrente de la misma operacion gano la insercion.
			return aplicadas.buscar(operacion.idOperacion())
					.map(op -> yaRegistrada(idUsuario, operacion, op))
					.orElseGet(() -> error(operacion, new ExcepcionAgroTrack(CodigoError.CONFLICTO, e.getMessage())));
		}
		// Cualquier otra excepcion (BD caida, timeout) se propaga como 5xx: el movil
		// detiene la cola, deja todo pendiente y reintenta con backoff exponencial.
	}

	@Override
	public EstadoOperacionVista consultarOperacion(UUID idUsuario, UUID idOperacion) {
		return aplicadas.buscar(idOperacion)
				.filter(op -> op.esDe(idUsuario))
				.map(op -> new EstadoOperacionVista(op.idOperacion(), op.entidad(), op.accion(), op.idRegistro(),
						op.versionResultante(), op.procesadoEn()))
				.orElseThrow(() -> ExcepcionAgroTrack.noEncontrado("esa operación en el servidor"));
	}

	@Override
	public CambiosVista cambiosDesde(UUID idUsuario, Instant desde) {
		Instant fechaServidor = Instant.now();
		Instant inicio = desde != null ? desde : Instant.EPOCH;
		Map<TipoRegistro, List<Object>> cambios = new EnumMap<>(TipoRegistro.class);
		for (TipoRegistro tipo : TipoRegistro.values()) {
			cambios.put(tipo, registros.modificadosDesde(idUsuario, tipo, inicio));
		}
		return new CambiosVista(fechaServidor, cambios);
	}

	@Override
	public int maxOperacionesPorLote() {
		return maxOperacionesPorLote;
	}

	private ResultadoOperacion yaRegistrada(UUID idUsuario, OperacionPendiente operacion,
			OperacionSincronizada previa) {
		if (!previa.esDe(idUsuario)) {
			return error(operacion, new ExcepcionAgroTrack(CodigoError.CONFLICTO, "El identificador ya está en uso."));
		}
		return new ResultadoOperacion(operacion.idOperacion(), operacion.entidad(), operacion.accion(),
				operacion.idRegistro(), EstadoOperacion.YA_REGISTRADO, previa.versionResultante(), null,
				mensajeExito(EstadoOperacion.YA_REGISTRADO), List.of());
	}

	private static ResultadoOperacion error(OperacionPendiente operacion, ExcepcionAgroTrack e) {
		return new ResultadoOperacion(operacion.idOperacion(), operacion.entidad(), operacion.accion(),
				operacion.idRegistro(), EstadoOperacion.ERROR, 0, e.getCodigo().name(), e.getMessage(),
				e.getDetalles());
	}

	private static String mensajeExito(EstadoOperacion estado) {
		return estado == EstadoOperacion.SINCRONIZADO ? "Registro sincronizado."
				: "El cambio ya estaba guardado en el servidor.";
	}

	private static RespuestaSincronizacion resumir(List<ResultadoOperacion> resultados) {
		int sincronizadas = contar(resultados, EstadoOperacion.SINCRONIZADO);
		int yaRegistradas = contar(resultados, EstadoOperacion.YA_REGISTRADO);
		int conError = contar(resultados, EstadoOperacion.ERROR);
		String mensaje = conError == 0 ? "Datos sincronizados."
				: (sincronizadas + yaRegistradas) + " sincronizados, " + conError + " con error.";
		return new RespuestaSincronizacion(resultados.size(), sincronizadas, yaRegistradas, conError, mensaje,
				Instant.now(), resultados);
	}

	private static int contar(List<ResultadoOperacion> resultados, EstadoOperacion estado) {
		return (int) resultados.stream().filter(r -> r.estado() == estado).count();
	}
}
