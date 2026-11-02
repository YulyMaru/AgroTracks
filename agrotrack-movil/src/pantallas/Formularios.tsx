/**
 * Un formulario por tipo de registro del modelo de datos v2 (docs/ModeloDeDatos.md). Sirven para
 * crear y para editar: si llega `inicial`, el formulario empieza con esos datos. TODOS los datos
 * son obligatorios y se validan igual que en el backend, para que un registro hecho sin conexion
 * no termine en ERROR al sincronizar. Los errores se muestran en rojo debajo de cada campo.
 *
 * Para que escribir sea comodo: la fecha se elige en un calendario, el dinero se formatea solo
 * ($ 1.200.000), horas y trabajadores tienen botones - y +, se recuerda lo ultimo que se eligio,
 * se sugiere lo que ya se escribio antes y la tecla "Siguiente" pasa al otro campo.
 */
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { app } from '../composicion';
import {
  aFechaIso,
  deFechaIso,
  escribirPesos,
  fechaAyer,
  fechaHoy,
  fechaLegible,
  fechaValida,
  leerNumero,
  numeroATexto,
} from '../compartido/dominio/formato';
import type {
  CosechaDatos,
  CultivoDatos,
  DatosPorEntidad,
  Entidad,
  FincaDatos,
  GastoDatos,
  LaborDatos,
  LoteDatos,
  NivelAsignacion,
  Opcion,
  OtroIngresoDatos,
  VentaDatos,
} from '../modulos/registros/dominio/modelo';
import {
  Boton,
  Campo,
  CampoNumero,
  COLORES,
  estilos,
  MensajeError,
  registrarFallo,
  Selector,
  Sugerencias,
  Texto,
  type Aviso,
  type EntradaTexto,
} from './componentes';

export interface PropsFormulario<E extends Entidad> {
  /** Cambia cuando hay datos nuevos (registro o sincronizacion) para recargar las listas. */
  version: number;
  /** Datos guardados, al editar. */
  inicial?: DatosPorEntidad[E];
  alGuardar: (datos: DatosPorEntidad[E]) => Promise<void>;
  mostrarAviso: (aviso: Aviso | null) => void;
}

type Errores = Record<string, string | undefined>;

const { listarParametros, nombreDe, opcionesCultivos, opcionesFincas, opcionesLotes, ubicacionDe, sugerencias } =
  app.registros;

const FALTA_DATOS: Aviso = {
  tipo: 'error',
  titulo: 'Faltan datos',
  mensaje: 'Revisa los campos marcados en rojo y vuelve a intentarlo.',
};

/** Errores por campo: se marcan al guardar y se borran apenas el usuario corrige el campo. */
function useErrores(mostrarAviso: (aviso: Aviso | null) => void) {
  const [errores, setErrores] = useState<Errores>({});
  const validar = useCallback((reglas: Errores): boolean => {
    const encontrados = Object.fromEntries(Object.entries(reglas).filter(([, m]) => m));
    setErrores(encontrados);
    const ok = Object.keys(encontrados).length === 0;
    mostrarAviso(ok ? null : FALTA_DATOS);
    return ok;
  }, [mostrarAviso]);
  const limpiar = useCallback((campo: string) => {
    setErrores(e => (e[campo] ? { ...e, [campo]: undefined } : e));
  }, []);
  return { errores, validar, limpiar };
}

function useLista<T>(cargar: () => Promise<T[]>, dependencias: unknown[]): T[] {
  const [lista, setLista] = useState<T[]>([]);
  useEffect(() => {
    let vigente = true;
    cargar().then(r => vigente && setLista(r)).catch(registrarFallo('formulario'));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);
  return lista;
}

function useCatalogo(tipo: string, version: number): Opcion[] {
  return useLista(async () => (await listarParametros(tipo)).map(p => ({ valor: p.codigo, etiqueta: p.etiqueta })),
    [tipo, version]);
}

/** Lo que ya escribio antes en un dato (municipio, concepto...), para sugerirlo. */
function useSugerencias(entidad: Entidad, dato: string, version: number): string[] {
  return useLista(() => sugerencias(entidad, dato), [entidad, dato, version]);
}

/**
 * Elige solo lo que ya se sabe, al crear (no al editar): lo ultimo que eligio el campesino, o la
 * unica opcion si solo hay una (por ejemplo, una sola finca).
 */
function useRecordado(clave: string, opciones: Opcion[], valor: string | undefined, fijar: (v: string) => void,
  activo: boolean) {
  const aplicado = useRef(false);
  useEffect(() => {
    if (!activo || aplicado.current || valor || opciones.length === 0) {
      return;
    }
    aplicado.current = true;
    app.preferencias.leer(clave).then(guardado => {
      if (guardado && opciones.some(o => o.valor === guardado)) {
        fijar(guardado);
      } else if (opciones.length === 1) {
        fijar(opciones[0].valor);
      }
    }).catch(registrarFallo('formulario'));
  }, [activo, clave, opciones, valor, fijar]);
}

const recordar = (clave: string, valor: string | undefined) => {
  if (valor) {
    app.preferencias.recordar(clave, valor).catch(() => {});
  }
};

/** Guarda una sola vez aunque se toque el boton varias veces seguidas. */
function useGuardando(): [boolean, (trabajo: () => Promise<void>) => Promise<void>] {
  const [guardando, setGuardando] = useState(false);
  const ejecutar = async (trabajo: () => Promise<void>) => {
    setGuardando(true);
    try {
      await trabajo();
    } finally {
      setGuardando(false);
    }
  };
  return [guardando, ejecutar];
}

// --- Reglas comunes -----------------------------------------------------------------------------
function texto(v: string, mensaje: string, maximo: number) {
  if (!v.trim()) {
    return mensaje;
  }
  return v.trim().length > maximo ? `Escribe máximo ${maximo} letras.` : undefined;
}
const elegido = (v: string | undefined, mensaje: string) => (v ? undefined : mensaje);
const fecha = (v: string) => (fechaValida(v) ? undefined : 'Elige la fecha. No puede ser una fecha futura.');
function numero(v: string, mensaje: string, decimales: number, maximo?: number) {
  const n = leerNumero(v);
  if (n === null || (maximo !== undefined && n > maximo)) {
    return mensaje;
  }
  const factor = 10 ** decimales;
  if (Math.round(n * factor) / factor === n) {
    return undefined;
  }
  return decimales === 0 ? 'Escribe solo números enteros, sin centavos ni decimales.' : `Usa máximo ${decimales} decimales.`;
}
const pesos = (v: string, mensaje: string) => numero(v, mensaje, 0, 999_999_999_999);

const textoInicial = (n: number | undefined) => (n === undefined ? '' : numeroATexto(n));
const pesosIniciales = (n: number | undefined) => (n === undefined ? '' : escribirPesos(String(n)));

// --- Piezas comunes -----------------------------------------------------------------------------
/** Fecha: "Hoy", "Ayer" u "Otro día" con calendario. Nunca hay que escribirla. */
function CampoFecha(props: { etiqueta: string; valor: string; error?: string; alCambiar: (v: string) => void }) {
  const abrirCalendario = () => DateTimePickerAndroid.open({
    value: fechaValida(props.valor) ? deFechaIso(props.valor) : new Date(),
    mode: 'date',
    maximumDate: new Date(),
    onChange: (evento, elegida) => {
      if (evento.type === 'set' && elegida) {
        props.alCambiar(aFechaIso(elegida));
      }
    },
  });
  const hoy = fechaHoy();
  const ayer = fechaAyer();
  const otro = fechaValida(props.valor) && props.valor !== hoy && props.valor !== ayer;
  return (
    <View style={estilos.campo}>
      <Texto estilo={estilos.etiqueta}>{props.etiqueta}</Texto>
      <Pressable onPress={abrirCalendario} accessibilityLabel={`${props.etiqueta}: cambiar fecha`}
        style={[estilos.entrada, estilos.entradaFecha, props.error && estilos.entradaError]}>
        <Texto>📅 {fechaValida(props.valor) ? fechaLegible(props.valor) : 'Toca para elegir el día'}</Texto>
      </Pressable>
      <View style={estilos.chips}>
        {([['Hoy', hoy], ['Ayer', ayer]] as const).map(([nombre, dia]) => (
          <Pressable key={nombre} style={[estilos.chip, props.valor === dia && estilos.chipActivo]}
            onPress={() => props.alCambiar(dia)}>
            <Texto estilo={[estilos.chipTexto, props.valor === dia && estilos.chipTextoActivo]}>{nombre}</Texto>
          </Pressable>
        ))}
        <Pressable style={[estilos.chip, otro && estilos.chipActivo]} onPress={abrirCalendario}>
          <Texto estilo={[estilos.chipTexto, otro && estilos.chipTextoActivo]}>Otro día…</Texto>
        </Pressable>
      </View>
      <MensajeError error={props.error} />
    </View>
  );
}

/** Dinero en pesos enteros que se formatea mientras se escribe: 1200000 -> 1.200.000. */
function CampoDinero(props: {
  etiqueta: string; valor: string; error?: string; ayuda: string; alCambiar: (v: string) => void;
  refEntrada?: React.Ref<EntradaTexto>;
}) {
  return (
    <Campo etiqueta={props.etiqueta} valor={props.valor} error={props.error} teclado="number-pad" ayuda={props.ayuda}
      refEntrada={props.refEntrada} alCambiar={v => props.alCambiar(escribirPesos(v))} />
  );
}

/**
 * Al editar no se puede cambiar a que finca, lote o cultivo pertenece un registro (los que
 * dependen de el quedarian mal). Se muestra fijo.
 */
function PadreFijo({ etiqueta, entidad, id }: { etiqueta: string; entidad: 'FINCA' | 'LOTE' | 'CULTIVO'; id: string }) {
  const [nombre, setNombre] = useState('');
  useEffect(() => {
    nombreDe(entidad, id).then(setNombre).catch(registrarFallo('formulario'));
  }, [entidad, id]);
  return (
    <View style={estilos.campo}>
      <Texto negrita>{etiqueta}</Texto>
      <Texto>{nombre}</Texto>
      <Texto suave>No se puede cambiar. Si está mal, elimina este registro y créalo de nuevo.</Texto>
    </View>
  );
}

/** Elegir el cultivo (todos los del campesino, con su lote y finca). Recuerda el ultimo. */
function SelectorCultivo(props: {
  version: number; valor?: string; error?: string; editando: boolean; recordarComo: string;
  alCambiar: (v?: string) => void;
}) {
  const cultivos = useLista(() => opcionesCultivos(), [props.version]);
  const { alCambiar } = props;
  useRecordado(props.recordarComo, cultivos, props.valor, alCambiar, !props.editando);
  if (props.editando && props.valor) {
    return <PadreFijo etiqueta="Cultivo" entidad="CULTIVO" id={props.valor} />;
  }
  return (
    <Selector etiqueta="¿Qué cultivo?" opciones={cultivos} valor={props.valor} error={props.error}
      vacio="Primero registra un cultivo." alCambiar={props.alCambiar} />
  );
}

interface Lugar { idFinca?: string; idLote?: string; idCultivo?: string }

/** A que se asigna un gasto o ingreso: la finca, o si se quiere un lote o un cultivo de ella. */
function SelectorAsignacion(props: {
  version: number; valor: Lugar; error?: string; editando: boolean; recordarComo: string;
  alCambiar: (l: Lugar) => void;
}) {
  const { idFinca, idLote, idCultivo } = props.valor;
  const fincas = useLista(opcionesFincas, [props.version]);
  const lotes = useLista(() => (idFinca ? opcionesLotes(idFinca) : Promise.resolve([])), [props.version, idFinca]);
  const cultivos = useLista(() => (idLote ? opcionesCultivos(idLote) : Promise.resolve([])), [props.version, idLote]);
  const { alCambiar } = props;
  const fijarFinca = useCallback((v: string) => alCambiar({ idFinca: v }), [alCambiar]);
  useRecordado(props.recordarComo, fincas, idFinca, fijarFinca, !props.editando);
  return (
    <View style={estilos.columna}>
      <Selector etiqueta="Finca" opciones={fincas} valor={idFinca} vacio="Primero registra una finca."
        error={props.error} alCambiar={v => props.alCambiar({ idFinca: v })} />
      {idFinca && lotes.length > 0 ? (
        <Selector etiqueta="Lote (si fue solo para un lote)" opciones={lotes} valor={idLote} opcional
          alCambiar={v => props.alCambiar({ idFinca, idLote: v })} />
      ) : null}
      {idLote && cultivos.length > 0 ? (
        <Selector etiqueta="Cultivo (si fue solo para un cultivo)" opciones={cultivos} valor={idCultivo} opcional
          alCambiar={v => props.alCambiar({ idFinca, idLote, idCultivo: v })} />
      ) : null}
    </View>
  );
}

/** El lugar mas especifico elegido: cultivo, si no lote, si no finca. */
function asignacion(l: Lugar): { nivelAsignacion: NivelAsignacion; idAsignacion: string } {
  if (l.idCultivo) {
    return { nivelAsignacion: 'CULTIVO', idAsignacion: l.idCultivo };
  }
  if (l.idLote) {
    return { nivelAsignacion: 'LOTE', idAsignacion: l.idLote };
  }
  return { nivelAsignacion: 'FINCA', idAsignacion: l.idFinca ?? '' };
}

/** Al editar un gasto o ingreso, reconstruye la finca/lote/cultivo elegidos. */
function useLugarInicial(inicial?: { nivelAsignacion: NivelAsignacion; idAsignacion: string }) {
  const [lugar, setLugar] = useState<Lugar>({});
  useEffect(() => {
    if (inicial) {
      ubicacionDe(inicial.nivelAsignacion, inicial.idAsignacion).then(setLugar).catch(() => setLugar({}));
    }
  }, [inicial]);
  return [lugar, setLugar] as const;
}

// --- 3.1 Finca --------------------------------------------------------------------------------
export function FormularioFinca({ version, inicial, alGuardar, mostrarAviso }: PropsFormulario<'FINCA'>) {
  const { errores, validar, limpiar } = useErrores(mostrarAviso);
  const [guardando, guardarUnaVez] = useGuardando();
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [municipio, setMunicipio] = useState(inicial?.municipio ?? '');
  const [vereda, setVereda] = useState(inicial?.vereda ?? '');
  const municipios = useSugerencias('FINCA', 'municipio', version);
  const veredas = useSugerencias('FINCA', 'vereda', version);
  const refMunicipio = useRef<EntradaTexto>(null);
  const refVereda = useRef<EntradaTexto>(null);

  const guardar = () => guardarUnaVez(async () => {
    const ok = validar({
      nombre: texto(nombre, 'Escribe el nombre de la finca.', 120),
      municipio: texto(municipio, 'Escribe el municipio donde está la finca.', 80),
      vereda: texto(vereda, 'Escribe la vereda donde está la finca.', 80),
    });
    if (ok) {
      const datos: FincaDatos = { nombre: nombre.trim(), municipio: municipio.trim(), vereda: vereda.trim() };
      await alGuardar(datos);
    }
  });
  return (
    <>
      <Campo etiqueta="Nombre de la finca" valor={nombre} error={errores.nombre} ayuda="Ejemplo: La Esperanza"
        alCambiar={v => { setNombre(v); limpiar('nombre'); }} alSiguiente={() => refMunicipio.current?.focus()} />
      <Campo etiqueta="Municipio" valor={municipio} error={errores.municipio} ayuda="Ejemplo: Rionegro"
        refEntrada={refMunicipio} alSiguiente={() => refVereda.current?.focus()}
        alCambiar={v => { setMunicipio(v); limpiar('municipio'); }}>
        <Sugerencias opciones={municipios} texto={municipio} alElegir={v => { setMunicipio(v); limpiar('municipio'); }} />
      </Campo>
      <Campo etiqueta="Vereda" valor={vereda} error={errores.vereda} ayuda="Ejemplo: Llanogrande" refEntrada={refVereda}
        alCambiar={v => { setVereda(v); limpiar('vereda'); }}>
        <Sugerencias opciones={veredas} texto={vereda} alElegir={v => { setVereda(v); limpiar('vereda'); }} />
      </Campo>
      <Boton texto="Guardar finca" alPresionar={guardar} cargando={guardando} />
    </>
  );
}

// --- 3.2 Lote ---------------------------------------------------------------------------------
export function FormularioLote({ version, inicial, alGuardar, mostrarAviso }: PropsFormulario<'LOTE'>) {
  const { errores, validar, limpiar } = useErrores(mostrarAviso);
  const [guardando, guardarUnaVez] = useGuardando();
  const fincas = useLista(opcionesFincas, [version]);
  const unidades = useCatalogo('UNIDAD_AREA', version);
  const [idFinca, setIdFinca] = useState(inicial?.idFinca);
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [area, setArea] = useState(textoInicial(inicial?.area));
  const [unidadArea, setUnidadArea] = useState(inicial?.unidadArea);
  const refArea = useRef<EntradaTexto>(null);
  useRecordado('lote.finca', fincas, idFinca, setIdFinca, !inicial);
  useRecordado('unidadArea', unidades, unidadArea, setUnidadArea, !inicial);

  const guardar = () => guardarUnaVez(async () => {
    const ok = validar({
      idFinca: elegido(idFinca, 'Elige la finca.'),
      nombre: texto(nombre, 'Escribe el nombre del lote.', 120),
      area: numero(area, 'Escribe el tamaño del lote (un número mayor que cero).', 4),
      unidadArea: elegido(unidadArea, 'Elige en qué se mide el tamaño.'),
    });
    if (ok) {
      recordar('lote.finca', idFinca);
      recordar('unidadArea', unidadArea);
      const datos: LoteDatos = { idFinca: idFinca!, nombre: nombre.trim(), area: leerNumero(area)!, unidadArea: unidadArea! };
      await alGuardar(datos);
    }
  });
  return (
    <>
      {inicial ? <PadreFijo etiqueta="Finca" entidad="FINCA" id={inicial.idFinca} /> : (
        <Selector etiqueta="Finca" opciones={fincas} valor={idFinca} error={errores.idFinca}
          vacio="Primero registra una finca." alCambiar={v => { setIdFinca(v); limpiar('idFinca'); }} />
      )}
      <Campo etiqueta="Nombre del lote" valor={nombre} error={errores.nombre} ayuda="Ejemplo: Lote de arriba"
        alCambiar={v => { setNombre(v); limpiar('nombre'); }} alSiguiente={() => refArea.current?.focus()} />
      <Campo etiqueta="Tamaño del lote" valor={area} error={errores.area} teclado="decimal-pad" ayuda="Ejemplo: 2,5"
        refEntrada={refArea} alCambiar={v => { setArea(v); limpiar('area'); }} />
      <Selector etiqueta="¿En qué se mide?" opciones={unidades} valor={unidadArea}
        error={errores.unidadArea} alCambiar={v => { setUnidadArea(v); limpiar('unidadArea'); }} />
      <Boton texto="Guardar lote" alPresionar={guardar} cargando={guardando} />
    </>
  );
}

// --- 3.3 Cultivo (siempre en un lote) -------------------------------------------------------
export function FormularioCultivo({ version, inicial, alGuardar, mostrarAviso }: PropsFormulario<'CULTIVO'>) {
  const { errores, validar, limpiar } = useErrores(mostrarAviso);
  const [guardando, guardarUnaVez] = useGuardando();
  const tipos = useCatalogo('TIPO_CULTIVO', version);
  const fincas = useLista(opcionesFincas, [version]);
  const [idFinca, setIdFinca] = useState<string>();
  const lotes = useLista(() => (idFinca ? opcionesLotes(idFinca) : Promise.resolve([])), [version, idFinca]);
  const [idLote, setIdLote] = useState(inicial?.idLote);
  const [tipoCultivo, setTipoCultivo] = useState(inicial?.tipoCultivo);
  const [especie, setEspecie] = useState(inicial?.especie ?? '');
  const [fechaSiembra, setFechaSiembra] = useState(inicial?.fechaSiembra ?? fechaHoy());
  const especies = useSugerencias('CULTIVO', 'especie', version);
  useRecordado('cultivo.finca', fincas, idFinca, setIdFinca, !inicial);
  useRecordado('cultivo.lote', lotes, idLote, setIdLote, !inicial);

  const guardar = () => guardarUnaVez(async () => {
    const ok = validar({
      idLote: elegido(idLote, 'Elige el lote donde está el cultivo.'),
      tipoCultivo: elegido(tipoCultivo, 'Elige qué cultivo es.'),
      especie: texto(especie, 'Escribe la especie o variedad.', 120),
      fechaSiembra: fecha(fechaSiembra),
    });
    if (ok) {
      recordar('cultivo.finca', idFinca);
      recordar('cultivo.lote', idLote);
      const datos: CultivoDatos = { idLote: idLote!, tipoCultivo: tipoCultivo!, especie: especie.trim(), fechaSiembra };
      await alGuardar(datos);
    }
  });
  return (
    <>
      {inicial ? <PadreFijo etiqueta="Lote" entidad="LOTE" id={inicial.idLote} /> : (
        <>
          <Selector etiqueta="Finca" opciones={fincas} valor={idFinca} vacio="Primero registra una finca."
            error={!idFinca ? errores.idLote : undefined}
            alCambiar={v => { setIdFinca(v); setIdLote(undefined); limpiar('idLote'); }} />
          {idFinca ? (
            <Selector etiqueta="Lote" opciones={lotes} valor={idLote} error={errores.idLote}
              vacio="Esta finca no tiene lotes. Registra uno primero."
              alCambiar={v => { setIdLote(v); limpiar('idLote'); }} />
          ) : null}
        </>
      )}
      <Selector etiqueta="¿Qué cultivo es?" opciones={tipos} valor={tipoCultivo}
        error={errores.tipoCultivo} alCambiar={v => { setTipoCultivo(v); limpiar('tipoCultivo'); }} />
      <Campo etiqueta="Especie o variedad" valor={especie} error={errores.especie} ayuda="Ejemplo: Castillo"
        alCambiar={v => { setEspecie(v); limpiar('especie'); }}>
        <Sugerencias opciones={especies} texto={especie} alElegir={v => { setEspecie(v); limpiar('especie'); }} />
      </Campo>
      <CampoFecha etiqueta="Fecha de siembra" valor={fechaSiembra} error={errores.fechaSiembra}
        alCambiar={v => { setFechaSiembra(v); limpiar('fechaSiembra'); }} />
      <Boton texto="Guardar cultivo" alPresionar={guardar} cargando={guardando} />
    </>
  );
}

// --- 3.4 Cosecha y 3.5 Venta ----------------------------------------------------------------
function FormularioProduccion<E extends 'COSECHA' | 'VENTA'>(props: PropsFormulario<E> & { conValor: boolean }) {
  const { version, alGuardar, mostrarAviso, conValor } = props;
  const inicial = props.inicial as VentaDatos | undefined;
  const clave = conValor ? 'venta' : 'cosecha';
  const { errores, validar, limpiar } = useErrores(mostrarAviso);
  const [guardando, guardarUnaVez] = useGuardando();
  const unidades = useCatalogo('UNIDAD', version);
  const [idCultivo, setIdCultivo] = useState(inicial?.idCultivo);
  const [dia, setDia] = useState(inicial?.fecha ?? fechaHoy());
  const [cantidad, setCantidad] = useState(textoInicial(inicial?.cantidad));
  const [unidad, setUnidad] = useState(inicial?.unidad);
  const [valorTotal, setValorTotal] = useState(pesosIniciales(inicial?.valorTotal));
  useRecordado(`${clave}.unidad`, unidades, unidad, setUnidad, !inicial);

  const guardar = () => guardarUnaVez(async () => {
    const ok = validar({
      idCultivo: elegido(idCultivo, conValor ? 'Elige qué cultivo vendiste.' : 'Elige qué cultivo cosechaste.'),
      fecha: fecha(dia),
      cantidad: numero(cantidad, 'Escribe la cantidad (un número mayor que cero).', 3),
      unidad: elegido(unidad, 'Elige la unidad (kilogramo, arroba, bulto...).'),
      valorTotal: conValor ? pesos(valorTotal, 'Escribe cuánto dinero recibiste en total.') : undefined,
    });
    if (ok) {
      recordar(`${clave}.cultivo`, idCultivo);
      recordar(`${clave}.unidad`, unidad);
      const cosecha: CosechaDatos = { idCultivo: idCultivo!, fecha: dia, cantidad: leerNumero(cantidad)!, unidad: unidad! };
      const datos = conValor ? { ...cosecha, valorTotal: leerNumero(valorTotal)! } : cosecha;
      await alGuardar(datos as DatosPorEntidad[E]);
    }
  });
  return (
    <>
      <SelectorCultivo version={version} valor={idCultivo} error={errores.idCultivo} editando={!!inicial}
        recordarComo={`${clave}.cultivo`} alCambiar={v => { setIdCultivo(v); limpiar('idCultivo'); }} />
      <CampoFecha etiqueta={conValor ? 'Fecha de la venta' : 'Fecha de la cosecha'} valor={dia} error={errores.fecha}
        alCambiar={v => { setDia(v); limpiar('fecha'); }} />
      <Campo etiqueta={conValor ? '¿Cuánto vendiste?' : '¿Cuánto cosechaste?'} valor={cantidad}
        error={errores.cantidad} teclado="decimal-pad" ayuda="Ejemplo: 12,5"
        alCambiar={v => { setCantidad(v); limpiar('cantidad'); }} />
      <Selector etiqueta="Unidad" opciones={unidades} valor={unidad} error={errores.unidad}
        alCambiar={v => { setUnidad(v); limpiar('unidad'); }} />
      {conValor ? (
        <CampoDinero etiqueta="Dinero recibido en total ($)" valor={valorTotal} error={errores.valorTotal}
          ayuda="Ejemplo: 1.200.000" alCambiar={v => { setValorTotal(v); limpiar('valorTotal'); }} />
      ) : null}
      <Boton texto={conValor ? 'Guardar venta' : 'Guardar cosecha'} alPresionar={guardar} cargando={guardando} />
    </>
  );
}

export function FormularioCosecha(props: PropsFormulario<'COSECHA'>) {
  return <FormularioProduccion<'COSECHA'> {...props} conValor={false} />;
}

export function FormularioVenta(props: PropsFormulario<'VENTA'>) {
  return <FormularioProduccion<'VENTA'> {...props} conValor />;
}

// --- 3.6 Gasto y 3.7 Otro ingreso -----------------------------------------------------------
function FormularioDinero<E extends 'GASTO' | 'OTRO_INGRESO'>(props: PropsFormulario<E> & { esGasto: boolean }) {
  const { version, alGuardar, mostrarAviso, esGasto } = props;
  const inicial = props.inicial as (GastoDatos & OtroIngresoDatos) | undefined;
  const entidad: Entidad = esGasto ? 'GASTO' : 'OTRO_INGRESO';
  const { errores, validar, limpiar } = useErrores(mostrarAviso);
  const [guardando, guardarUnaVez] = useGuardando();
  const tipos = useCatalogo(esGasto ? 'CATEGORIA_GASTO' : 'TIPO_INGRESO', version);
  const [dia, setDia] = useState(inicial?.fecha ?? fechaHoy());
  const [tipo, setTipo] = useState(esGasto ? inicial?.categoria : inicial?.tipoIngreso);
  const [concepto, setConcepto] = useState(inicial?.concepto ?? '');
  const [valor, setValor] = useState(pesosIniciales(inicial?.valor));
  const [lugar, setLugar] = useLugarInicial(inicial);
  const conceptos = useSugerencias(entidad, 'concepto', version);
  const refValor = useRef<EntradaTexto>(null);
  const claveFinca = esGasto ? 'gasto.finca' : 'ingreso.finca';

  const guardar = () => guardarUnaVez(async () => {
    const ok = validar({
      fecha: fecha(dia),
      tipo: elegido(tipo, esGasto ? 'Elige el tipo de gasto.' : 'Elige el tipo de ingreso.'),
      concepto: texto(concepto, esGasto ? 'Escribe en qué se gastó.' : 'Escribe de dónde vino el dinero.', 150),
      valor: pesos(valor, esGasto ? 'Escribe cuánto costó.' : 'Escribe cuánto dinero recibiste.'),
      lugar: lugar.idFinca ? undefined : 'Elige la finca.',
    });
    if (ok) {
      recordar(claveFinca, lugar.idFinca);
      const comunes = { fecha: dia, concepto: concepto.trim(), valor: leerNumero(valor)!, ...asignacion(lugar) };
      const datos = esGasto ? { ...comunes, categoria: tipo! } : { ...comunes, tipoIngreso: tipo! };
      await alGuardar(datos as unknown as DatosPorEntidad[E]);
    }
  });
  return (
    <>
      <CampoFecha etiqueta="Fecha" valor={dia} error={errores.fecha} alCambiar={v => { setDia(v); limpiar('fecha'); }} />
      <Selector etiqueta={esGasto ? 'Tipo de gasto' : 'Tipo de ingreso'} opciones={tipos} valor={tipo}
        error={errores.tipo} alCambiar={v => { setTipo(v); limpiar('tipo'); }} />
      <Campo etiqueta={esGasto ? '¿En qué se gastó?' : '¿De dónde vino el dinero?'} valor={concepto}
        error={errores.concepto} ayuda={esGasto ? 'Ejemplo: Dos bultos de abono' : 'Ejemplo: Alquiler del potrero'}
        alSiguiente={() => refValor.current?.focus()} alCambiar={v => { setConcepto(v); limpiar('concepto'); }}>
        <Sugerencias opciones={conceptos} texto={concepto} alElegir={v => { setConcepto(v); limpiar('concepto'); }} />
      </Campo>
      <CampoDinero etiqueta={esGasto ? '¿Cuánto costó? ($)' : '¿Cuánto recibiste? ($)'} valor={valor}
        error={errores.valor} ayuda="Ejemplo: 50.000" refEntrada={refValor}
        alCambiar={v => { setValor(v); limpiar('valor'); }} />
      <SelectorAsignacion version={version} valor={lugar} error={errores.lugar} editando={!!inicial}
        recordarComo={claveFinca} alCambiar={l => { setLugar(l); limpiar('lugar'); }} />
      <Boton texto={esGasto ? 'Guardar gasto' : 'Guardar ingreso'} alPresionar={guardar} cargando={guardando} />
    </>
  );
}

export function FormularioGasto(props: PropsFormulario<'GASTO'>) {
  return <FormularioDinero<'GASTO'> {...props} esGasto />;
}

export function FormularioOtroIngreso(props: PropsFormulario<'OTRO_INGRESO'>) {
  return <FormularioDinero<'OTRO_INGRESO'> {...props} esGasto={false} />;
}

// --- 3.8 Labor con sus insumos, en 3 pasos cortos ----------------------------------------------
interface InsumoEnEdicion { tipoInsumo?: string; cantidad: string; unidad?: string }

const PASOS_LABOR = ['¿Qué se hizo?', '¿Cuánto trabajo fue?', '¿Qué se usó?'];

export function FormularioLabor({ version, inicial, alGuardar, mostrarAviso }: PropsFormulario<'LABOR'>) {
  const { errores, validar, limpiar } = useErrores(mostrarAviso);
  const [guardando, guardarUnaVez] = useGuardando();
  const [paso, setPaso] = useState(0);
  const tipos = useCatalogo('TIPO_LABOR', version);
  const tiposInsumo = useCatalogo('TIPO_INSUMO', version);
  const unidades = useCatalogo('UNIDAD', version);
  const [idCultivo, setIdCultivo] = useState(inicial?.idCultivo);
  const [tipoLabor, setTipoLabor] = useState(inicial?.tipoLabor);
  const [dia, setDia] = useState(inicial?.fecha ?? fechaHoy());
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [horas, setHoras] = useState(textoInicial(inicial?.horas));
  const [trabajadores, setTrabajadores] = useState(inicial ? textoInicial(inicial.trabajadores) : '1');
  const [insumos, setInsumos] = useState<InsumoEnEdicion[]>(
    (inicial?.insumos ?? []).map(i => ({ ...i, cantidad: numeroATexto(i.cantidad) })));

  const cambiarInsumo = (i: number, cambio: Partial<InsumoEnEdicion>, campo: string) => {
    setInsumos(lista => lista.map((x, j) => (j === i ? { ...x, ...cambio } : x)));
    limpiar(`insumo${i}.${campo}`);
  };

  /** Las reglas de cada paso, para validar solo ese paso al tocar "Siguiente". */
  const reglasDePaso = (n: number): Errores => {
    if (n === 0) {
      return {
        idCultivo: elegido(idCultivo, 'Elige el cultivo donde se hizo la labor.'),
        tipoLabor: elegido(tipoLabor, 'Elige qué labor se hizo.'),
        fecha: fecha(dia),
        descripcion: texto(descripcion, 'Escribe qué se hizo.', 300),
      };
    }
    if (n === 1) {
      return {
        horas: numero(horas, 'Escribe las horas trabajadas (más de 0 y hasta 24).', 2, 24),
        trabajadores: numero(trabajadores, 'Escribe cuántas personas trabajaron (de 1 a 1000).', 0, 1000),
      };
    }
    const reglas: Errores = {};
    insumos.forEach((x, i) => {
      reglas[`insumo${i}.tipo`] = elegido(x.tipoInsumo, 'Elige qué se usó.');
      reglas[`insumo${i}.cantidad`] = numero(x.cantidad, 'Escribe cuánto se usó (un número mayor que cero).', 3);
      reglas[`insumo${i}.unidad`] = elegido(x.unidad, 'Elige la unidad.');
    });
    return reglas;
  };
  const conErrores = (reglas: Errores) => Object.values(reglas).some(Boolean);

  const siguiente = () => {
    if (validar(reglasDePaso(paso))) {
      setPaso(paso + 1);
    }
  };

  const guardar = () => guardarUnaVez(async () => {
    // Si algun paso anterior quedo mal (por ejemplo al editar), se vuelve a ese paso.
    const malo = [0, 1, 2].find(n => conErrores(reglasDePaso(n)));
    if (malo !== undefined) {
      setPaso(malo);
      validar(reglasDePaso(malo));
      return;
    }
    mostrarAviso(null);
    recordar('labor.cultivo', idCultivo);
    const datos: LaborDatos = {
      idCultivo: idCultivo!, tipoLabor: tipoLabor!, fecha: dia, descripcion: descripcion.trim(),
      horas: leerNumero(horas)!, trabajadores: leerNumero(trabajadores)!,
      insumos: insumos.map(x => ({ tipoInsumo: x.tipoInsumo!, cantidad: leerNumero(x.cantidad)!, unidad: x.unidad! })),
    };
    await alGuardar(datos);
  });

  return (
    <>
      <View style={estilos.pasos}>
        {PASOS_LABOR.map((nombre, n) => (
          <View key={nombre} style={[estilos.paso, n <= paso && { backgroundColor: COLORES.primario }]} />
        ))}
      </View>
      <Texto negrita>Paso {paso + 1} de {PASOS_LABOR.length}: {PASOS_LABOR[paso]}</Texto>

      {paso === 0 && (
        <>
          <SelectorCultivo version={version} valor={idCultivo} error={errores.idCultivo} editando={!!inicial}
            recordarComo="labor.cultivo" alCambiar={v => { setIdCultivo(v); limpiar('idCultivo'); }} />
          <Selector etiqueta="¿Qué labor se hizo?" opciones={tipos} valor={tipoLabor} error={errores.tipoLabor}
            alCambiar={v => { setTipoLabor(v); limpiar('tipoLabor'); }} />
          <CampoFecha etiqueta="Fecha" valor={dia} error={errores.fecha} alCambiar={v => { setDia(v); limpiar('fecha'); }} />
          <Campo etiqueta="¿Qué se hizo?" valor={descripcion} error={errores.descripcion} multilinea
            ayuda="Ejemplo: Abonada de mitad de año" alCambiar={v => { setDescripcion(v); limpiar('descripcion'); }} />
        </>
      )}

      {paso === 1 && (
        <>
          <CampoNumero etiqueta="Horas trabajadas" valor={horas} error={errores.horas} paso={0.5} minimo={0.5}
            maximo={24} decimales={2} ayuda="Toca − o + , o escribe 2,5 para dos horas y media"
            atajos={[{ texto: '2 horas', valor: 2 }, { texto: '½ día (4 h)', valor: 4 }, { texto: '1 día (8 h)', valor: 8 }]}
            alCambiar={v => { setHoras(v); limpiar('horas'); }} />
          <CampoNumero etiqueta="¿Cuántas personas trabajaron?" valor={trabajadores} error={errores.trabajadores}
            paso={1} minimo={1} maximo={1000} decimales={0}
            alCambiar={v => { setTrabajadores(v); limpiar('trabajadores'); }} />
        </>
      )}

      {paso === 2 && (
        <>
          {insumos.length === 0 && <Texto suave>No se usó ningún insumo. Si se usó, agrégalo abajo.</Texto>}
          {insumos.map((x, i) => (
            <View key={i} style={[estilos.columna, estilos.cajaInsumo]}>
              <Selector etiqueta={`Insumo ${i + 1}: ¿qué se usó?`} opciones={tiposInsumo} valor={x.tipoInsumo}
                error={errores[`insumo${i}.tipo`]} alCambiar={v => cambiarInsumo(i, { tipoInsumo: v }, 'tipo')} />
              <Campo etiqueta="¿Cuánto?" valor={x.cantidad} error={errores[`insumo${i}.cantidad`]} teclado="decimal-pad"
                ayuda="Ejemplo: 2" alCambiar={v => cambiarInsumo(i, { cantidad: v }, 'cantidad')} />
              <Selector etiqueta="Unidad" opciones={unidades} valor={x.unidad} error={errores[`insumo${i}.unidad`]}
                alCambiar={v => cambiarInsumo(i, { unidad: v }, 'unidad')} />
              <Boton texto="Quitar este insumo" variante="peligro"
                alPresionar={() => setInsumos(lista => lista.filter((_, j) => j !== i))} />
            </View>
          ))}
          {insumos.length < 20 && (
            <Boton texto="+ Agregar insumo" variante="secundario"
              alPresionar={() => setInsumos(lista => [...lista, { cantidad: '' }])} />
          )}
        </>
      )}

      {paso < PASOS_LABOR.length - 1 ? (
        <Boton texto="Siguiente →" alPresionar={siguiente} />
      ) : (
        <Boton texto="Guardar labor" alPresionar={guardar} cargando={guardando} />
      )}
      {paso > 0 && <Boton texto="← Atrás" variante="secundario" alPresionar={() => { mostrarAviso(null); setPaso(paso - 1); }} />}
    </>
  );
}
