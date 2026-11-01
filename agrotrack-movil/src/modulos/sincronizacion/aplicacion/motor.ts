import type { Metadatos } from '../../../compartido/aplicacion/puertos';
import { mensajeDeError } from '../../../compartido/dominio/errores';
import {
  FalloTemporal,
  SesionExpirada,
  TIPOS_REGISTRO,
  tiempoEspera,
  type Desenlace,
  type EstadoMotor,
  type OperacionPendiente,
  type RespuestaSincronizacion,
  type ResultadoSincronizacion,
} from '../dominio/operacion';
import type { CopiaLocal, Red, RepositorioCola, ServidorSincronizacion, SesionActiva } from './puertos';

export interface ConfigMotor {
  operacionesPorLote: number;
  maxReintentos: number;
  esperaInicialMs: number;
  esperaMaximaMs: number;
}

/**
 * Motor de sincronizacion del movil (ADR-001, ADR-007, HU-23, HU-44). Implementa
 * doc/Flujos/Flujo-Sincronizacion.png paso a paso, con crear, editar y eliminar. Solo conoce
 * puertos: la red, el servidor, la cola y la copia local llegan desde src/composicion.ts.
 */
export function crearMotor(p: {
  cola: RepositorioCola;
  servidor: ServidorSincronizacion;
  copia: CopiaLocal;
  red: Red;
  sesion: SesionActiva;
  metadatos: Metadatos;
  config: ConfigMotor;
}) {
  // --- Observadores para la UI -----------------------------------------------------------------
  type Observador = (estado: EstadoMotor) => void;
  const observadores = new Set<Observador>();
  let estado: EstadoMotor = { sincronizando: false, ultimo: null };
  let enCurso = false;

  function publicar(cambio: Partial<EstadoMotor>) {
    estado = { ...estado, ...cambio };
    observadores.forEach(o => o(estado));
  }

  function terminar(desenlace: Desenlace, mensaje: string, sincronizadas = 0, conError = 0): ResultadoSincronizacion {
    const resultado = { desenlace, mensaje, sincronizadas, conError };
    publicar({ sincronizando: false, ultimo: desenlace === 'EN_CURSO' ? estado.ultimo : resultado });
    return resultado;
  }

  const esperar = (ms: number) => new Promise<void>(resolver => setTimeout(resolver, ms));

  /** Envia un lote; ante fallos temporales reintenta el MISMO lote con backoff. */
  async function enviarConReintentos(lote: OperacionPendiente[]): Promise<RespuestaSincronizacion> {
    let ultimoError: unknown;
    for (let intento = 0; intento <= p.config.maxReintentos; intento++) {
      await p.cola.registrarIntento(lote.map(o => o.idOperacion));
      try {
        return await p.servidor.enviar(lote);
      } catch (e) {
        if (!(e instanceof FalloTemporal)) {
          throw e;
        }
        ultimoError = e;
        if (intento < p.config.maxReintentos) {
          await esperar(tiempoEspera(intento, p.config.esperaInicialMs, p.config.esperaMaximaMs));
        }
      }
    }
    throw ultimoError;
  }

  /** Descarga incremental de los cambios del servidor y del catalogo (HU-24). */
  async function descargarCambios(): Promise<void> {
    const desde = await p.metadatos.leer('ultima_sincronizacion');
    const datos = await p.servidor.cambios(desde);
    // Un registro con cambios sin enviar se deja como esta en el celular: lo que hizo el campesino
    // no se pisa con la copia vieja del servidor.
    const conCambios = await p.cola.idsConCambios();
    for (const tipo of TIPOS_REGISTRO) {
      for (const registro of datos.cambios[tipo] ?? []) {
        if (!conCambios.has(String(registro.id))) {
          await p.copia.guardarRegistro(tipo, registro);
        }
      }
    }
    await p.copia.guardarCatalogo(await p.servidor.parametros(desde));
    await p.metadatos.guardar('ultima_sincronizacion', datos.fechaServidor);
  }

  async function sincronizar(): Promise<ResultadoSincronizacion> {
    // 1. ¿Ya hay una sincronizacion en curso? -> no hace nada.
    if (enCurso) {
      return terminar('EN_CURSO', 'Ya hay una sincronización en curso.');
    }
    enCurso = true;
    publicar({ sincronizando: true });
    try {
      // 2. ¿Hay conexion a internet?
      if (!(await p.red.hayConexion())) {
        return terminar('SIN_CONEXION', 'Sin conexión. Tus datos quedan guardados en el celular.');
      }
      // 3. ¿La conexion es estable? (el backend responde en pocos segundos)
      if (!(await p.servidor.disponible())) {
        return terminar('CONEXION_INESTABLE', 'La conexión es inestable. Tus datos siguen PENDIENTES.');
      }
      // 4. ¿La sesion es valida? (el cliente HTTP renueva el token si vencio)
      if (!(await p.sesion.haySesion())) {
        return terminar('SESION_REQUERIDA', 'Inicia sesión para sincronizar. Tus datos siguen PENDIENTES.');
      }

      // 5. Carga la cola PENDIENTE en orden de creacion y la envia por lotes.
      let sincronizadas = 0;
      let conError = 0;
      let hubo = false;
      for (;;) {
        const lote = await p.cola.siguienteLote(p.config.operacionesPorLote);
        if (lote.length === 0) {
          break;
        }
        hubo = true;
        let respuesta: RespuestaSincronizacion;
        try {
          respuesta = await enviarConReintentos(lote);
        } catch (e) {
          if (e instanceof SesionExpirada) {
            return terminar('SESION_REQUERIDA', 'Tu sesión venció. Inicia sesión; tus datos siguen PENDIENTES.',
              sincronizadas, conError);
          }
          // Reintentos agotados o error del lote: detiene la cola, lo no enviado sigue PENDIENTE.
          return terminar('DETENIDA', `${mensajeDeError(e)} Se reintentará en la próxima reconexión.`,
            sincronizadas, conError);
        }

        // 6. Aplica la respuesta por operacion.
        const enviados = new Set(lote.map(o => o.idOperacion));
        for (const r of respuesta.resultados) {
          if (!enviados.has(r.idOperacion)) {
            continue;
          }
          enviados.delete(r.idOperacion);
          if (r.estado === 'ERROR') {
            // Dato invalido o conflicto de version (4xx): ERROR sin reintento, el registro se conserva.
            await p.cola.marcarConError(r.idOperacion, [r.mensaje, ...(r.detalles ?? [])].join(' '));
            conError++;
          } else {
            // SINCRONIZADO o YA_REGISTRADO (reintento de algo ya guardado): exito.
            await p.cola.marcarSincronizada(r.idOperacion);
            sincronizadas++;
          }
        }
        if (enviados.size === lote.length) {
          // El servidor no devolvio nada de este lote: se evita un bucle infinito.
          return terminar('DETENIDA', 'Respuesta inesperada del servidor. Se reintentará luego.',
            sincronizadas, conError);
        }
      }

      // 7. Trae los cambios del servidor para la consulta offline (HU-24).
      await descargarCambios().catch(() => {});

      if (!hubo) {
        return terminar('NADA_POR_SINCRONIZAR', 'Todo está sincronizado.');
      }
      // 8. Notifica el resultado.
      const mensaje = conError === 0 ? 'Datos sincronizados.' : `${sincronizadas} sincronizados, ${conError} con error.`;
      return terminar('COMPLETADA', mensaje, sincronizadas, conError);
    } finally {
      enCurso = false;
    }
  }

  return {
    sincronizar,

    suscribirse(observador: Observador): () => void {
      observadores.add(observador);
      observador(estado);
      return () => {
        observadores.delete(observador);
      };
    },

    /** Mientras se envia la cola no se reescriben operaciones que podrian estar viajando al servidor. */
    haySincronizacionEnCurso: () => enCurso,

    /**
     * Deteccion de conectividad (ADR-006): cuando el celular pasa de "sin red" a "con red",
     * dispara la sincronizacion en segundo plano, sin bloquear la UI (HU-23).
     */
    iniciarAutomatica(alCambiarConexion?: (conectado: boolean) => void): () => void {
      let conectadoAntes: boolean | null = null;
      return p.red.escuchar(conectado => {
        alCambiarConexion?.(conectado);
        if (conectado && conectadoAntes !== true) {
          sincronizar().catch(() => {});
        }
        conectadoAntes = conectado;
      });
    },
  };
}

export type Motor = ReturnType<typeof crearMotor>;
