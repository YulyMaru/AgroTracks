import type { GeneradorIds, Metadatos, Transacciones } from '../../../compartido/aplicacion/puertos';
import { ErrorParaUsuario } from '../../../compartido/dominio/errores';
import { CATALOGO_RESPALDO } from '../dominio/catalogoRespaldo';
import {
  ENTIDADES,
  type Accion,
  type DatosPorEntidad,
  type Entidad,
  type EstructuraFinca,
  type GastoDatos,
  type NivelAsignacion,
  type Opcion,
  type Parametro,
  type Etiquetas,
  type RegistroEnLista,
} from '../dominio/modelo';
import { MENSAJE_DEPENDIENTES, planEdicion, planEliminacion } from '../dominio/reglas';
import type { CatalogoLocal, ColaCambios, RepositorioRegistros } from './puertos';

/**
 * Casos de uso de los registros offline-first (ADR-005, HU-22) con editar y eliminar
 * (docs/ModeloDeDatos.md, seccion 5). Cada cambio se guarda primero en el celular y se encola
 * para el servidor en la misma transaccion. Las decisiones estan en dominio/reglas.ts.
 */
export function crearCasosRegistros(p: {
  repositorio: RepositorioRegistros;
  catalogo: CatalogoLocal;
  cola: ColaCambios;
  transacciones: Transacciones;
  metadatos: Metadatos;
  ids: GeneradorIds;
}) {
  const { repositorio, cola } = p;

  async function vigente<E extends Entidad>(entidad: E, id: string) {
    const registro = await repositorio.buscar(entidad, id);
    if (!registro || registro.eliminado) {
      throw new ErrorParaUsuario('Este registro ya no existe.');
    }
    return registro;
  }

  /** Finca a la que pertenece lo asignado: la finca misma, la del lote o la del lote del cultivo. */
  async function fincaDe(nivel: NivelAsignacion, idAsignacion: string): Promise<string> {
    if (nivel === 'FINCA') {
      return idAsignacion;
    }
    const idFinca = await repositorio.fincaDe(nivel, idAsignacion);
    if (!idFinca) {
      throw new ErrorParaUsuario('No encontramos el lugar elegido.');
    }
    return idFinca;
  }

  /** La finca calculada de un gasto u otro ingreso; los demas registros no la llevan. */
  async function fincaCalculada(entidad: Entidad, datos: object): Promise<string | null> {
    if (entidad !== 'GASTO' && entidad !== 'OTRO_INGRESO') {
      return null;
    }
    const { nivelAsignacion, idAsignacion } = datos as GastoDatos;
    return fincaDe(nivelAsignacion, idAsignacion);
  }

  async function cargarEtiquetas(): Promise<Etiquetas> {
    const locales = await p.catalogo.todos();
    const mapa = new Map<string, string>();
    [...Object.values(CATALOGO_RESPALDO).flat(), ...locales].forEach(x => mapa.set(`${x.tipo}:${x.codigo}`, x.etiqueta));
    return (tipo, codigo) => mapa.get(`${tipo}:${codigo}`) ?? codigo;
  }

  /** Cultivos con el nombre de su lote: "Café Castillo · Lote alto". Si se indica el lote, solo los de ese lote. */
  async function opcionesCultivos(idLote?: string): Promise<Opcion[]> {
    const etiquetas = await cargarEtiquetas();
    return (await repositorio.cultivos(idLote)).map(c => ({
      valor: c.id,
      etiqueta: `${etiquetas('TIPO_CULTIVO', c.tipoCultivo)} ${c.especie} · ${idLote ? c.lote : `${c.lote} (${c.finca})`}`,
    }));
  }

  return {
    /** Datos guardados de un registro, para llenar el formulario al editarlo. */
    async obtener<E extends Entidad>(entidad: E, id: string): Promise<DatosPorEntidad[E]> {
      return (await vigente(entidad, id)).datos;
    },

    async crear<E extends Entidad>(entidad: E, datos: DatosPorEntidad[E]): Promise<string> {
      const id = p.ids.nuevo();
      const idFinca = await fincaCalculada(entidad, datos);
      await p.transacciones.ejecutar(async () => {
        await repositorio.insertar(entidad, id, datos, idFinca, 1);
        await cola.encolar(entidad, 'CREAR', id, 0, datos);
      });
      return id;
    },

    async editar<E extends Entidad>(entidad: E, id: string, datos: DatosPorEntidad[E]): Promise<void> {
      const registro = await vigente(entidad, id);
      const idFinca = await fincaCalculada(entidad, datos);
      const sinEnviar = cola.envioEnCurso() ? [] : await cola.sinEnviarDe(id);
      const plan = planEdicion(sinEnviar, registro.version);
      await p.transacciones.ejecutar(async () => {
        await repositorio.actualizar(entidad, id, datos, idFinca, plan.version);
        if (plan.tipo === 'FUSIONAR') {
          await cola.reemplazarContenido(plan.enOperacion, datos);
          await cola.quitar(plan.quitar);
        } else {
          await cola.encolar(entidad, 'EDITAR', id, plan.versionBase, datos);
        }
      });
    },

    /** Borrado logico (R5). Si el registro nunca llego al servidor, se quita del celular. */
    async eliminar(entidad: Entidad, id: string): Promise<void> {
      const registro = await vigente(entidad, id);
      const mensaje = MENSAJE_DEPENDIENTES[entidad];
      if (mensaje && (await repositorio.contarDependientes(entidad, id)) > 0) {
        throw new ErrorParaUsuario(mensaje);
      }
      const sinEnviar = cola.envioEnCurso() ? [] : await cola.sinEnviarDe(id);
      const plan = planEliminacion(sinEnviar, registro.version);
      await p.transacciones.ejecutar(async () => {
        await cola.quitar(plan.quitar);
        if (plan.tipo === 'BORRAR_DEL_CELULAR') {
          await repositorio.borrar(entidad, id);
          return;
        }
        await repositorio.marcarEliminado(entidad, id, plan.versionBase + 1);
        await cola.encolar(entidad, 'ELIMINAR', id, plan.versionBase, {});
      });
    },

    /**
     * Descarta un cambio que el servidor rechazo. Si era un registro nuevo, se quita del celular;
     * si era una edicion o un borrado, en la proxima sincronizacion vuelve la copia del servidor.
     */
    async descartarCambio(cambio: { entidad: Entidad; accion: Accion; idRegistro: string }): Promise<void> {
      const sinEnviar = await cola.sinEnviarDe(cambio.idRegistro);
      await p.transacciones.ejecutar(async () => {
        await cola.quitar(sinEnviar.map(c => c.idOperacion));
        if (cambio.accion === 'CREAR') {
          await repositorio.borrar(cambio.entidad, cambio.idRegistro);
        } else {
          await p.metadatos.borrar('ultima_sincronizacion');
        }
      });
    },

    /** Copia de un registro que llego del servidor. */
    guardarCopia: (entidad: Entidad, registro: Record<string, unknown>) => repositorio.guardarCopia(entidad, registro),

    guardarCatalogo: (parametros: (Parametro & { orden: number; activo: boolean })[]) => p.catalogo.guardar(parametros),

    /** Catalogo del celular; si aun no se ha descargado, la copia que trae la app. */
    async listarParametros(tipo: string): Promise<Parametro[]> {
      const locales = await p.catalogo.activos(tipo);
      return locales.length > 0 ? locales : CATALOGO_RESPALDO[tipo] ?? [];
    },

    cargarEtiquetas,
    opcionesFincas: () => repositorio.fincas(),
    opcionesLotes: (idFinca: string) => repositorio.lotes(idFinca),
    opcionesCultivos,

    /** Finca y lote de un lugar ya guardado, para mostrar el selector de un gasto al editarlo. */
    async ubicacionDe(nivel: NivelAsignacion, idAsignacion: string):
      Promise<{ idFinca: string; idLote?: string; idCultivo?: string }> {
      if (nivel === 'FINCA') {
        return { idFinca: idAsignacion };
      }
      if (nivel === 'LOTE') {
        return { idFinca: await fincaDe('LOTE', idAsignacion), idLote: idAsignacion };
      }
      const idLote = (await repositorio.loteDeCultivo(idAsignacion)) ?? undefined;
      return { idFinca: await fincaDe('CULTIVO', idAsignacion), idLote, idCultivo: idAsignacion };
    },

    /** Nombre de una finca, lote o cultivo para mostrarlo (por ejemplo, el padre fijo al editar). */
    async nombreDe(entidad: 'FINCA' | 'LOTE' | 'CULTIVO', id: string): Promise<string> {
      if (entidad === 'CULTIVO') {
        return (await opcionesCultivos()).find(o => o.valor === id)?.etiqueta ?? '';
      }
      return repositorio.nombre(entidad, id);
    },

    /** Registros vigentes de un tipo, con su estado de envio (HU-04, HU-24, HU-25). */
    async listar(entidad: Entidad): Promise<RegistroEnLista[]> {
      const filas = await repositorio.resumenes(entidad);
      const estado = new Map<string, { estado: RegistroEnLista['envio']; mensaje: string }>();
      (await cola.estadosSinEnviar(entidad)).forEach(o => {
        if (estado.get(o.idRegistro)?.estado !== 'ERROR') {
          estado.set(o.idRegistro, { estado: o.estado, mensaje: o.mensaje });
        }
      });
      return filas.map(datos => {
        const e = estado.get(datos.id);
        return { id: datos.id, datos, envio: e?.estado ?? 'SINCRONIZADO', mensajeError: e?.mensaje ?? '' };
      });
    },

    /** Lo que ya escribio antes en un dato, para sugerirlo y no tener que escribirlo de nuevo. */
    sugerencias: (entidad: Entidad, dato: string) => repositorio.valoresUsados(entidad, dato),

    /** Ventas, otros ingresos y gastos (los usa el modulo de analisis). */
    movimientosDeDinero: () => repositorio.movimientosDeDinero(),
    produccion: () => repositorio.produccion(),
    trabajos: () => repositorio.trabajos(),

    /** Fincas, lotes y cultivos con su nombre para mostrar ("Café Castillo"). */
    async estructura(): Promise<EstructuraFinca> {
      const [{ fincas, lotes, cultivos }, etiquetas] = await Promise.all([repositorio.estructura(), cargarEtiquetas()]);
      return {
        fincas,
        lotes,
        cultivos: cultivos.map(c => ({
          id: c.id, idLote: c.idLote, nombre: `${etiquetas('TIPO_CULTIVO', c.tipoCultivo)} ${c.especie}`.trim(),
        })),
      };
    },

    /** Cuantos registros vigentes hay de cada tipo (para el menu). */
    async contarRegistros(): Promise<Record<Entidad, number>> {
      const conteo = {} as Record<Entidad, number>;
      for (const entidad of ENTIDADES) {
        conteo[entidad] = await repositorio.contarVigentes(entidad);
      }
      return conteo;
    },
  };
}

export type CasosRegistros = ReturnType<typeof crearCasosRegistros>;
