/**
 * Componentes visuales de AgroTrack, pensados para campesinos (ADR-010, ADR-023):
 * letra propia y clara (Inter), tamanos grandes, botones de minimo 56dp y avisos dentro
 * de la pantalla en lugar de ventanas del sistema.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { leerNumero, numeroATexto } from '../compartido/dominio/formato';

/** Paleta del prototipo: verde campo (esmeralda), grises pizarra y naranja para lo mas importante. */
export const COLORES = {
  primario: '#047857',
  primarioOscuro: '#065F46',
  primarioSuave: '#ECFDF5',
  primarioBorde: '#D1FAE5',
  verdeVivo: '#4ADE80',
  verdeClaro: '#A7F3D0',
  teal: '#0F766E',
  naranja: '#F97316',
  ambar: '#F59E0B',
  ambarSuave: '#FEF3C7',
  fondo: '#F8FAFC',
  tarjeta: '#FFFFFF',
  texto: '#1E293B',
  suave: '#64748B',
  borde: '#E2E8F0',
  bordeSuave: '#F1F5F9',
  pendiente: '#B45309',
  pendienteSuave: '#FEF3C7',
  error: '#DC2626',
  errorVivo: '#EF4444',
  errorSuave: '#FEF2F2',
  errorBorde: '#FEE2E2',
  blanco: '#FFFFFF',
};

/** La app trae su propia letra: el tema del celular (p. ej. MIUI) no la cambia. */
export const FUENTES = {
  normal: 'Inter-Regular',
  negrita: 'Inter-SemiBold',
};

// --- Texto --------------------------------------------------------------------------------------
export function Texto(props: {
  children: React.ReactNode;
  estilo?: StyleProp<TextStyle>;
  negrita?: boolean;
  suave?: boolean;
}) {
  return (
    <Text style={[estilos.texto, props.negrita && estilos.negrita, props.suave && estilos.textoSuave, props.estilo]}>
      {props.children}
    </Text>
  );
}

export function Titulo({ children }: { children: React.ReactNode }) {
  return <Text style={estilos.titulo}>{children}</Text>;
}

export function Subtitulo({ children }: { children: React.ReactNode }) {
  return <Text style={estilos.subtitulo}>{children}</Text>;
}

export function Tarjeta({ children, estilo }: { children: React.ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return <View style={[estilos.tarjeta, estilo]}>{children}</View>;
}

// --- Avisos -------------------------------------------------------------------------------------
/**
 * Para las promesas que se lanzan sin esperar (cargas de pantalla, sincronizar): si fallan, el
 * error queda en el registro en lugar de perderse en silencio.
 */
export const registrarFallo = (donde: string) => (error: unknown) => {
  console.error(`[${donde}] fallo`, error);
};

export type TipoAviso = 'exito' | 'error' | 'info';

export interface Aviso {
  tipo: TipoAviso;
  titulo: string;
  mensaje?: string;
}

/** Aviso dentro de la pantalla (no una ventana del sistema). El de exito se cierra solo. */
export function CajaAviso({ aviso, alCerrar }: { aviso: Aviso | null; alCerrar: () => void }) {
  useEffect(() => {
    if (aviso?.tipo === 'exito') {
      const t = setTimeout(alCerrar, 4000);
      return () => clearTimeout(t);
    }
  }, [aviso, alCerrar]);
  if (!aviso) {
    return null;
  }
  const colores = {
    exito: { fondo: COLORES.primarioSuave, borde: COLORES.primario, icono: '✓' },
    error: { fondo: COLORES.errorSuave, borde: COLORES.error, icono: '!' },
    info: { fondo: COLORES.pendienteSuave, borde: COLORES.pendiente, icono: 'i' },
  }[aviso.tipo];
  return (
    <View style={[estilos.aviso, { backgroundColor: colores.fondo, borderColor: colores.borde }]}>
      <View style={[estilos.avisoIcono, { backgroundColor: colores.borde }]}>
        <Text style={estilos.avisoIconoTexto}>{colores.icono}</Text>
      </View>
      <View style={estilos.avisoCuerpo}>
        <Text style={[estilos.negrita, estilos.texto]}>{aviso.titulo}</Text>
        {aviso.mensaje ? <Text style={[estilos.texto, estilos.avisoMensaje]}>{aviso.mensaje}</Text> : null}
      </View>
      <Pressable onPress={alCerrar} style={estilos.avisoCerrar} accessibilityLabel="Cerrar aviso">
        <Text style={estilos.avisoCerrarTexto}>✕</Text>
      </Pressable>
    </View>
  );
}

// --- Encabezado con "Volver" ----------------------------------------------------------------------
export function Encabezado({ titulo, alVolver }: { titulo: string; alVolver: () => void }) {
  return (
    <View style={estilos.encabezado}>
      <Pressable onPress={alVolver} style={estilos.volver} accessibilityLabel="Volver">
        <Text style={estilos.volverTexto}>‹ Volver</Text>
      </Pressable>
      <Text style={estilos.encabezadoTitulo}>{titulo}</Text>
    </View>
  );
}

// --- Confirmacion -------------------------------------------------------------------------------
export interface PedidoConfirmacion {
  icono: string;
  titulo: string;
  mensaje: string;
  /** Texto del boton que confirma: "Sí, eliminar". */
  textoSi: string;
  /** Texto del boton que cancela: "No, dejarlo". */
  textoNo: string;
  /** Para acciones que borran o quitan algo: el boton de confirmar va en rojo. */
  peligro?: boolean;
}

/**
 * Ventana para confirmar antes de salir, eliminar, corregir o descartar (ADR-010, ADR-023): con la
 * letra y los botones grandes de la app en lugar de la ventana del sistema. Uso:
 *
 *   const [ventana, confirmar] = useConfirmacion();
 *   if (await confirmar({ ... })) { ... }   // y poner {ventana} en la pantalla
 *
 * El boton "atras" del celular o tocar fuera de la ventana cuenta como "No".
 */
export function useConfirmacion(): [React.ReactNode, (pedido: PedidoConfirmacion) => Promise<boolean>] {
  const [pedido, setPedido] = useState<PedidoConfirmacion | null>(null);
  const responder = useRef<(si: boolean) => void>(() => {});

  const confirmar = useCallback((nuevo: PedidoConfirmacion) => new Promise<boolean>(resolver => {
    responder.current = si => {
      setPedido(null);
      resolver(si);
    };
    setPedido(nuevo);
  }), []);

  const ventana = (
    <Modal visible={pedido !== null} transparent animationType="fade" statusBarTranslucent
      onRequestClose={() => responder.current(false)}>
      <Pressable style={estilos.fondoVentana} onPress={() => responder.current(false)} accessibilityLabel="Cerrar">
        {pedido && (
          // Tocar dentro de la ventana no la cierra
          <Pressable style={estilos.ventana} onPress={() => {}}>
            <Text style={estilos.iconoVentana}>{pedido.icono}</Text>
            <Text style={estilos.tituloVentana}>{pedido.titulo}</Text>
            <Texto suave estilo={estilos.textoCentro}>{pedido.mensaje}</Texto>
            <Boton texto={pedido.textoSi} variante={pedido.peligro ? 'peligro' : 'principal'}
              alPresionar={() => responder.current(true)} />
            <Boton texto={pedido.textoNo} variante="secundario" alPresionar={() => responder.current(false)} />
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
  return [ventana, confirmar];
}

// --- Teclado ------------------------------------------------------------------------------------
/** Espacio que se deja entre el campo y el teclado, para ver tambien la ayuda o las sugerencias. */
const MARGEN_TECLADO = 96;

/** Lo usan los campos para avisar que se enfocaron (ver {@link Desplazable}). */
const ContextoTeclado = createContext<{ alEnfocar: () => void } | null>(null);

/**
 * ScrollView para pantallas con campos de texto. La app dibuja de borde a borde (edge-to-edge) y
 * en ese modo Android ya no achica la pantalla al abrir el teclado: el teclado tapaba los campos de
 * abajo. Aqui se agrega al final un espacio del alto del teclado y se sube el campo que se esta
 * escribiendo hasta que quede encima del teclado, sin tener que cerrarlo para ver lo escrito.
 */
export function Desplazable({ children, estilo }: { children: React.ReactNode; estilo?: StyleProp<ViewStyle> }) {
  const desplazable = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const posicion = useRef(0);
  /** Donde empieza el teclado en la pantalla (null si esta cerrado). */
  const bordeTeclado = useRef<number | null>(null);
  const [altoTeclado, setAltoTeclado] = useState(0);

  const subirCampoActivo = useCallback(() => {
    const borde = bordeTeclado.current;
    const campo = TextInput.State.currentlyFocusedInput();
    if (borde === null || !campo) {
      return;
    }
    campo.measureInWindow((_x, y, _ancho, alto) => {
      const tapado = y + alto + MARGEN_TECLADO - borde;
      if (tapado > 0) {
        desplazable.current?.scrollTo({ y: posicion.current + tapado, animated: true });
      }
    });
  }, []);

  useEffect(() => {
    const abrir = Keyboard.addListener('keyboardDidShow', e => {
      bordeTeclado.current = e.endCoordinates.screenY;
      setAltoTeclado(e.endCoordinates.height);
      // Espera a que se aplique el espacio extra antes de medir el campo
      setTimeout(subirCampoActivo, 60);
    });
    const cerrar = Keyboard.addListener('keyboardDidHide', () => {
      bordeTeclado.current = null;
      setAltoTeclado(0);
    });
    return () => {
      abrir.remove();
      cerrar.remove();
    };
  }, [subirCampoActivo]);

  // Con el teclado ya abierto, pasar a otro campo (tecla "Siguiente") tambien lo sube
  const alEnfocar = useCallback(() => setTimeout(subirCampoActivo, 60), [subirCampoActivo]);

  return (
    <ContextoTeclado.Provider value={{ alEnfocar }}>
      <ScrollView ref={desplazable} contentContainerStyle={[estilo, altoTeclado > 0 && { paddingBottom: altoTeclado + 40 }]}
        keyboardShouldPersistTaps="handled" scrollEventThrottle={16}
        onScroll={e => { posicion.current = e.nativeEvent.contentOffset.y; }}>
        {children}
      </ScrollView>
    </ContextoTeclado.Provider>
  );
}

// --- Formularios --------------------------------------------------------------------------------
/** Lo que se enfoca con la tecla "Siguiente". */
export type EntradaTexto = React.ComponentRef<typeof TextInput>;

export function MensajeError({ error }: { error?: string }) {
  return error ? <Text style={estilos.mensajeError}>⚠ {error}</Text> : null;
}

export function Campo(props: {
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  error?: string;
  ayuda?: string;
  secreto?: boolean;
  teclado?: 'default' | 'email-address' | 'decimal-pad' | 'number-pad';
  multilinea?: boolean;
  /** Para pasar a este campo con la tecla "Siguiente" del campo anterior. */
  refEntrada?: React.Ref<EntradaTexto>;
  /** Si se indica, la tecla del teclado dice "Siguiente" y llama esto (pasar al otro campo). */
  alSiguiente?: () => void;
  /** Lo que se muestra debajo del campo (por ejemplo, sugerencias). */
  children?: React.ReactNode;
  /** Sin mayusculas automaticas (nombre de usuario). */
  sinMayusculas?: boolean;
  /** Texto gris de ejemplo dentro del campo vacio. */
  ejemplo?: string;
}) {
  const [verClave, setVerClave] = useState(false);
  const teclado = useContext(ContextoTeclado);
  const entrada = (
    <TextInput
      onFocus={teclado?.alEnfocar}
      style={[estilos.entrada, props.multilinea && estilos.entradaMultilinea, props.error && estilos.entradaError,
        props.secreto && estilos.entradaConBoton]}
      value={props.valor}
      onChangeText={props.alCambiar}
      secureTextEntry={props.secreto && !verClave}
      keyboardType={props.teclado ?? 'default'}
      placeholder={props.ejemplo}
      autoCorrect={!(props.secreto || props.sinMayusculas || props.teclado === 'email-address')}
      autoCapitalize={props.teclado === 'email-address' || props.secreto || props.sinMayusculas ? 'none' : 'sentences'}
      multiline={props.multilinea}
      placeholderTextColor={COLORES.suave}
      ref={props.refEntrada}
      returnKeyType={props.alSiguiente ? 'next' : 'done'}
      submitBehavior={props.alSiguiente ? 'submit' : 'blurAndSubmit'}
      onSubmitEditing={props.alSiguiente}
    />
  );
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{props.etiqueta}</Text>
      {props.secreto ? (
        <View>
          {entrada}
          <Pressable style={estilos.botonOjo} onPress={() => setVerClave(v => !v)}
            accessibilityLabel={verClave ? 'Ocultar clave' : 'Ver clave'}>
            <Text style={estilos.botonOjoTexto}>{verClave ? '🙈' : '👁️'}</Text>
          </Pressable>
        </View>
      ) : entrada}
      {props.children}
      {props.error ? <MensajeError error={props.error} /> : props.ayuda ? (
        <Text style={estilos.ayuda}>{props.ayuda}</Text>
      ) : null}
    </View>
  );
}

/**
 * Numero con botones grandes - y + (horas, trabajadores...), para no tener que escribirlo.
 * Tambien se puede escribir, y tener atajos como "1/2 dia".
 */
export function CampoNumero(props: {
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  paso: number;
  minimo: number;
  maximo: number;
  decimales: number;
  error?: string;
  ayuda?: string;
  atajos?: { texto: string; valor: number }[];
}) {
  const actual = leerNumero(props.valor);
  const teclado = useContext(ContextoTeclado);
  const fijar = (n: number) => {
    const factor = 10 ** props.decimales;
    const limitado = Math.min(props.maximo, Math.max(props.minimo, Math.round(n * factor) / factor));
    props.alCambiar(numeroATexto(limitado));
  };
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{props.etiqueta}</Text>
      <View style={estilos.filaNumero}>
        <Pressable style={({ pressed }) => [estilos.botonNumero, pressed && estilos.presionado]}
          accessibilityLabel={`Menos ${props.etiqueta}`}
          onPress={() => fijar((actual ?? props.minimo + props.paso) - props.paso)}>
          <Text style={estilos.botonNumeroTexto}>−</Text>
        </Pressable>
        <TextInput style={[estilos.entrada, estilos.entradaNumero, props.error && estilos.entradaError]}
          value={props.valor} onChangeText={props.alCambiar} onFocus={teclado?.alEnfocar}
          keyboardType={props.decimales > 0 ? 'decimal-pad' : 'number-pad'} />
        <Pressable style={({ pressed }) => [estilos.botonNumero, pressed && estilos.presionado]}
          accessibilityLabel={`Más ${props.etiqueta}`}
          onPress={() => fijar((actual ?? props.minimo - props.paso) + props.paso)}>
          <Text style={estilos.botonNumeroTexto}>+</Text>
        </Pressable>
      </View>
      {props.atajos && (
        <View style={estilos.chips}>
          {props.atajos.map(a => (
            <Pressable key={a.texto} style={[estilos.chip, actual === a.valor && estilos.chipActivo]} onPress={() => fijar(a.valor)}>
              <Text style={[estilos.chipTexto, actual === a.valor && estilos.chipTextoActivo]}>{a.texto}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {props.error ? <MensajeError error={props.error} /> : props.ayuda ? (
        <Text style={estilos.ayuda}>{props.ayuda}</Text>
      ) : null}
    </View>
  );
}

/**
 * Lo que ya escribio antes y se parece a lo que va escribiendo: al tocarlo se completa el campo.
 * Muestra maximo 4.
 */
export function Sugerencias({ opciones, texto, alElegir }: {
  opciones: string[]; texto: string; alElegir: (v: string) => void;
}) {
  const buscado = texto.trim().toLowerCase();
  const visibles = opciones
    .filter(o => o.toLowerCase() !== buscado && o.toLowerCase().includes(buscado))
    .slice(0, 4);
  if (visibles.length === 0) {
    return null;
  }
  return (
    <View style={estilos.chips}>
      {visibles.map(o => (
        <Pressable key={o} style={estilos.chipSugerencia} onPress={() => alElegir(o)} accessibilityLabel={`Usar ${o}`}>
          <Text style={estilos.chipTexto}>↺ {o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Barra horizontal proporcional para las graficas: etiqueta, barra y valor. */
export function Barra({ etiqueta, valor, proporcion, color }: {
  etiqueta: string; valor: string; proporcion: number; color: string;
}) {
  return (
    <View style={estilos.barraFila}>
      <View style={estilos.filaEntre}>
        <Text style={[estilos.texto, estilos.barraEtiqueta]} numberOfLines={2}>{etiqueta}</Text>
        <Text style={[estilos.texto, estilos.negrita]}>{valor}</Text>
      </View>
      <View style={estilos.barraFondo}>
        <View style={[estilos.barraRelleno, { width: `${Math.max(2, Math.round(proporcion * 100))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export interface Opcion {
  valor: string;
  etiqueta: string;
}

/** Opciones tactiles grandes. Si es opcional, al tocar de nuevo la opcion elegida se quita. */
export function Selector(props: {
  etiqueta: string;
  opciones: Opcion[];
  valor: string | undefined;
  alCambiar: (v: string | undefined) => void;
  error?: string;
  opcional?: boolean;
  vacio?: string;
}) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{props.etiqueta}</Text>
      <View style={[estilos.chips, props.error && estilos.chipsError]}>
        {props.opciones.map(o => {
          const activo = o.valor === props.valor;
          return (
            <Pressable key={o.valor} style={[estilos.chip, activo && estilos.chipActivo]}
              onPress={() => props.alCambiar(props.opcional && activo ? undefined : o.valor)}>
              <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{activo ? '✓ ' : ''}{o.etiqueta}</Text>
            </Pressable>
          );
        })}
        {props.opciones.length === 0 && <Text style={estilos.textoSuave}>{props.vacio ?? 'No hay opciones.'}</Text>}
      </View>
      <MensajeError error={props.error} />
    </View>
  );
}

export function Boton(props: {
  texto: string;
  alPresionar: () => void;
  cargando?: boolean;
  variante?: 'principal' | 'secundario' | 'peligro';
}) {
  const secundario = props.variante === 'secundario';
  const peligro = props.variante === 'peligro';
  return (
    <Pressable
      style={({ pressed }) => [estilos.boton, secundario && estilos.botonSecundario, peligro && estilos.botonPeligro,
        pressed && estilos.presionado,
        props.cargando && estilos.deshabilitado]}
      onPress={props.alPresionar}
      disabled={props.cargando}>
      {props.cargando ? <ActivityIndicator color={secundario ? COLORES.primario : peligro ? COLORES.error : COLORES.blanco} /> : (
        <Text style={[estilos.botonTexto, secundario && estilos.botonTextoSecundario, peligro && estilos.botonTextoPeligro]}>
          {props.texto}
        </Text>
      )}
    </Pressable>
  );
}

/** Boton grande del menu principal: icono + nombre. */
export function BotonMenu({ icono, texto, alPresionar }: { icono: string; texto: string; alPresionar: () => void }) {
  return (
    <Pressable style={({ pressed }) => [estilos.botonMenu, pressed && estilos.presionado]} onPress={alPresionar}>
      <Text style={estilos.botonMenuIcono}>{icono}</Text>
      <Text style={estilos.botonMenuTexto}>{texto}</Text>
    </Pressable>
  );
}

// --- Barras de la pantalla principal ----------------------------------------------------------------
/** Barra verde de arriba: logo, nombre de la app, en que seccion esta y si hay internet. */
export function BarraSuperior({ subtitulo, conectado }: { subtitulo: string; conectado: boolean }) {
  return (
    <View style={estilos.barraSuperior}>
      <View style={estilos.marca}>
        <Image source={require('../recursos/logo.png')} style={estilos.logo} accessibilityLabel="AgroTrack" />
        <View>
          <Text style={estilos.nombreApp}>AgroTrack</Text>
          <Text style={estilos.subtituloApp}>{subtitulo}</Text>
        </View>
      </View>
      <View style={estilos.pildora}>
        <View style={[estilos.puntoConexion, { backgroundColor: conectado ? COLORES.verdeVivo : COLORES.ambar }]} />
        <Text style={estilos.pildoraTexto}>{conectado ? 'En línea' : 'Sin internet'}</Text>
      </View>
    </View>
  );
}

export type Pestana = 'inicio' | 'anotar' | 'cuentas' | 'envios';

const PESTANAS: { id: Pestana; icono: string; texto: string }[] = [
  { id: 'inicio', icono: '🏠', texto: 'Inicio' },
  { id: 'anotar', icono: '✍️', texto: 'Anotar' },
  { id: 'cuentas', icono: '📊', texto: 'Cuentas' },
  { id: 'envios', icono: '📤', texto: 'Envíos' },
];

/** Barra de abajo con iconos grandes y su nombre. En Envios muestra cuantos faltan por enviar. */
export function BarraInferior({ activa, alElegir, porEnviar }: {
  activa: Pestana; alElegir: (p: Pestana) => void; porEnviar: number;
}) {
  return (
    <View style={estilos.barraInferior}>
      {PESTANAS.map(p => {
        const esActiva = p.id === activa;
        return (
          <Pressable key={p.id} onPress={() => alElegir(p.id)} accessibilityLabel={p.texto}
            style={({ pressed }) => [estilos.pestana, esActiva && estilos.pestanaActiva, pressed && estilos.presionado]}>
            <Text style={estilos.pestanaIcono}>{p.icono}</Text>
            <Text style={[estilos.pestanaTexto, esActiva && estilos.pestanaTextoActivo]}>{p.texto}</Text>
            {p.id === 'envios' && porEnviar > 0 && (
              <View style={estilos.insignia}><Text style={estilos.insigniaTexto}>{porEnviar}</Text></View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Un movimiento de dinero: verde si entro, rojo si salio. */
export function TarjetaMovimiento({ icono, titulo, detalle, valor, entro }: {
  icono: string; titulo: string; detalle: string; valor: string; entro: boolean;
}) {
  return (
    <View style={[estilos.movimiento, {
      backgroundColor: entro ? COLORES.primarioSuave : COLORES.errorSuave,
      borderColor: entro ? COLORES.primarioBorde : COLORES.errorBorde,
    }]}>
      <Text style={[estilos.movimientoIcono, { backgroundColor: entro ? COLORES.primarioBorde : COLORES.errorBorde }]}>
        {icono}
      </Text>
      <View style={estilos.movimientoCuerpo}>
        <Text style={estilos.movimientoTitulo} numberOfLines={1}>{titulo}</Text>
        <Text style={estilos.movimientoDetalle} numberOfLines={1}>{detalle}</Text>
      </View>
      <Text style={[estilos.movimientoValor, { color: entro ? COLORES.primario : COLORES.error }]}>
        {entro ? '+ ' : '- '}{valor}
      </Text>
    </View>
  );
}

/** Boton grande de color con icono, titulo y una ayuda corta (Gasté dinero, Vendí cosecha...). */
export function BotonColor({ icono, titulo, detalle, color, alPresionar }: {
  icono: string; titulo: string; detalle: string; color: string; alPresionar: () => void;
}) {
  return (
    <Pressable onPress={alPresionar} accessibilityLabel={titulo}
      style={({ pressed }) => [estilos.botonColor, { backgroundColor: color }, pressed && estilos.presionado]}>
      <Text style={estilos.botonColorIcono}>{icono}</Text>
      <Text style={estilos.botonColorTitulo}>{titulo}</Text>
      <Text style={estilos.botonColorDetalle}>{detalle}</Text>
    </Pressable>
  );
}

/** Estado de envio de un registro o cambio: por enviar, con problema o enviado. */
export function IndicadorEnvio({ estado }: { estado: 'PENDIENTE' | 'ERROR' | 'SINCRONIZADO' }) {
  if (estado === 'PENDIENTE') {
    return <Texto negrita estilo={{ color: COLORES.pendiente }}>⏱ Por enviar</Texto>;
  }
  if (estado === 'ERROR') {
    return <Texto negrita estilo={{ color: COLORES.error }}>⚠ Problema</Texto>;
  }
  return <Texto negrita estilo={{ color: COLORES.primario }}>✓ Enviado</Texto>;
}

// --- Estilos --------------------------------------------------------------------------------------
export const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  centrado: { flex: 1 },
  pantalla: { padding: 16, gap: 16, paddingBottom: 40 },
  texto: { fontFamily: FUENTES.normal, fontSize: 17, color: COLORES.texto, lineHeight: 24 },
  negrita: { fontFamily: FUENTES.negrita },
  textoSuave: { fontFamily: FUENTES.normal, fontSize: 16, color: COLORES.suave, lineHeight: 22 },
  titulo: { fontFamily: FUENTES.negrita, fontSize: 28, color: COLORES.texto, lineHeight: 36 },
  subtitulo: { fontFamily: FUENTES.negrita, fontSize: 20, color: COLORES.texto, lineHeight: 28 },
  tarjeta: {
    backgroundColor: COLORES.tarjeta, borderRadius: 24, padding: 18, gap: 10,
    borderWidth: 2, borderColor: COLORES.bordeSuave,
  },

  aviso: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 2, borderRadius: 20, padding: 14, gap: 12 },
  avisoIcono: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avisoIconoTexto: { fontFamily: FUENTES.negrita, color: COLORES.blanco, fontSize: 17 },
  avisoCuerpo: { flex: 1, gap: 2 },
  avisoMensaje: { fontSize: 16 },
  avisoCerrar: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  avisoCerrarTexto: { fontFamily: FUENTES.negrita, fontSize: 18, color: COLORES.suave },

  encabezado: {
    backgroundColor: COLORES.primario, paddingHorizontal: 8, paddingVertical: 10, flexDirection: 'row',
    alignItems: 'center', gap: 4, elevation: 4,
  },
  volver: { minHeight: 48, paddingHorizontal: 10, justifyContent: 'center' },
  volverTexto: { fontFamily: FUENTES.negrita, fontSize: 18, color: COLORES.blanco },
  encabezadoTitulo: { flex: 1, fontFamily: FUENTES.negrita, fontSize: 20, color: COLORES.blanco },

  campo: { gap: 6 },
  etiqueta: { fontFamily: FUENTES.negrita, fontSize: 17, color: COLORES.texto },
  entrada: {
    minHeight: 56, borderWidth: 2, borderColor: COLORES.borde, borderRadius: 16, paddingHorizontal: 14,
    fontFamily: FUENTES.normal, fontSize: 18, color: COLORES.texto, backgroundColor: COLORES.blanco,
  },
  entradaMultilinea: { minHeight: 90, textAlignVertical: 'top', paddingVertical: 12 },
  entradaError: { borderColor: COLORES.error, backgroundColor: COLORES.errorSuave },
  ayuda: { fontFamily: FUENTES.normal, fontSize: 15, color: COLORES.suave },
  mensajeError: { fontFamily: FUENTES.negrita, fontSize: 15, color: COLORES.error },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderRadius: 12 },
  chipsError: { borderWidth: 1.5, borderColor: COLORES.error, padding: 6, backgroundColor: COLORES.errorSuave },
  chip: {
    minHeight: 50, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1.5, borderColor: COLORES.primario,
    justifyContent: 'center', backgroundColor: COLORES.blanco,
  },
  chipActivo: { backgroundColor: COLORES.primario },
  chipTexto: { fontFamily: FUENTES.normal, fontSize: 17, color: COLORES.primarioOscuro },
  chipTextoActivo: { fontFamily: FUENTES.negrita, color: COLORES.blanco },

  boton: {
    minHeight: 58, borderRadius: 20, backgroundColor: COLORES.primario, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 16, elevation: 2,
  },
  botonSecundario: { backgroundColor: COLORES.primarioSuave, borderWidth: 2, borderColor: COLORES.primarioBorde, elevation: 0 },
  botonTexto: { fontFamily: FUENTES.negrita, fontSize: 19, color: COLORES.blanco },
  botonTextoSecundario: { color: COLORES.primario },
  botonPeligro: { backgroundColor: COLORES.errorSuave, borderWidth: 2, borderColor: COLORES.errorBorde, elevation: 0 },
  botonTextoPeligro: { color: COLORES.error },
  presionado: { opacity: 0.75 },
  deshabilitado: { opacity: 0.6 },

  botonMenu: {
    flexBasis: '47%', flexGrow: 1, minHeight: 104, borderRadius: 24, backgroundColor: COLORES.tarjeta,
    borderWidth: 2, borderColor: COLORES.primarioBorde, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6,
  },
  botonMenuIcono: { fontSize: 34 },
  botonMenuTexto: { fontFamily: FUENTES.negrita, fontSize: 17, color: COLORES.texto, textAlign: 'center' },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  portada: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  logoPortada: { width: 96, height: 96, borderRadius: 28, marginBottom: 8 },
  cabeceraInicio: { backgroundColor: COLORES.primario, padding: 16, paddingBottom: 20 },
  grupo: { gap: 10 },
  columna: { gap: 14 },
  filaNumero: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botonNumero: {
    width: 56, height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: COLORES.primario,
    backgroundColor: COLORES.primarioSuave, alignItems: 'center', justifyContent: 'center',
  },
  botonNumeroTexto: { fontFamily: FUENTES.negrita, fontSize: 28, color: COLORES.primarioOscuro, lineHeight: 32 },
  entradaNumero: { flex: 1, textAlign: 'center', fontSize: 22 },
  chipSugerencia: {
    minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 22,
    borderWidth: 1, borderStyle: 'dashed', borderColor: COLORES.primario, backgroundColor: COLORES.tarjeta,
  },
  barraFila: { gap: 6 },
  barraEtiqueta: { flex: 1 },
  barraFondo: { height: 18, borderRadius: 9, backgroundColor: COLORES.fondo, overflow: 'hidden' },
  barraRelleno: { height: 18, borderRadius: 9 },
  botonMes: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: COLORES.primario,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORES.tarjeta,
  },
  botonMesTexto: { fontSize: 30, lineHeight: 34, color: COLORES.primario },
  tituloMes: { fontSize: 21, flex: 1, textAlign: 'center' },
  cifra: { fontSize: 20 },
  cifraGrande: { fontSize: 26, lineHeight: 32 },
  separador: { height: 1, backgroundColor: COLORES.borde },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  puntoLeyenda: { width: 14, height: 14, borderRadius: 7 },
  columnasMeses: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  columnaMes: { flex: 1, alignItems: 'center', gap: 6 },
  barrasMes: { height: 140, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barraVertical: { width: 12, borderRadius: 4, minHeight: 2 },
  entradaFecha: { justifyContent: 'center' },
  entradaConBoton: { paddingRight: 60 },
  botonOjo: {
    position: 'absolute', right: 6, top: 6, bottom: 6, width: 48, borderRadius: 12,
    backgroundColor: COLORES.bordeSuave, alignItems: 'center', justifyContent: 'center',
  },
  botonOjoTexto: { fontSize: 20 },
  pasos: { flexDirection: 'row', gap: 6 },
  paso: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORES.borde },
  cajaInsumo: { borderWidth: 2, borderColor: COLORES.borde, borderRadius: 20, padding: 14 },

  // --- Barra superior (logo, nombre, estado de conexion) -----------------------------------------
  barraSuperior: {
    backgroundColor: COLORES.primario, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 16 },
  nombreApp: { fontFamily: FUENTES.negrita, fontSize: 24, color: COLORES.blanco, lineHeight: 30 },
  subtituloApp: { fontFamily: FUENTES.negrita, fontSize: 13, color: COLORES.verdeClaro },
  pildora: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORES.primarioOscuro,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  puntoConexion: { width: 10, height: 10, borderRadius: 5 },
  pildoraTexto: { fontFamily: FUENTES.negrita, fontSize: 13, color: COLORES.primarioSuave },

  // --- Barra inferior (pestanas con iconos grandes) -----------------------------------------------
  barraInferior: {
    flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORES.tarjeta, paddingVertical: 8,
    borderTopWidth: 2, borderTopColor: COLORES.bordeSuave, elevation: 12,
  },
  pestana: { alignItems: 'center', justifyContent: 'center', minWidth: 72, minHeight: 56, borderRadius: 18, paddingHorizontal: 8 },
  pestanaActiva: { backgroundColor: COLORES.primarioSuave },
  pestanaIcono: { fontSize: 24, lineHeight: 30 },
  pestanaTexto: { fontFamily: FUENTES.normal, fontSize: 13, color: COLORES.suave },
  pestanaTextoActivo: { fontFamily: FUENTES.negrita, color: COLORES.primario },
  insignia: {
    position: 'absolute', top: 2, right: 10, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: COLORES.naranja, alignItems: 'center', justifyContent: 'center',
  },
  insigniaTexto: { fontFamily: FUENTES.negrita, fontSize: 12, color: COLORES.blanco },

  // --- Inicio ---------------------------------------------------------------------------------
  bienvenida: { backgroundColor: COLORES.teal, borderRadius: 24, padding: 20, gap: 6, overflow: 'hidden', elevation: 3 },
  bienvenidaAdorno: { position: 'absolute', right: -6, bottom: -14, fontSize: 84, opacity: 0.2 },
  bienvenidaEtiqueta: { fontFamily: FUENTES.negrita, fontSize: 13, color: COLORES.verdeClaro, letterSpacing: 1 },
  bienvenidaNombre: { fontFamily: FUENTES.negrita, fontSize: 26, color: COLORES.blanco, lineHeight: 32 },
  bienvenidaChip: {
    alignSelf: 'flex-start', backgroundColor: COLORES.primarioOscuro, borderRadius: 12, paddingHorizontal: 10,
    paddingVertical: 5, marginTop: 4,
  },
  bienvenidaChipTexto: { fontFamily: FUENTES.negrita, fontSize: 13, color: COLORES.primarioSuave },
  salir: { position: 'absolute', top: 10, right: 12, minHeight: 40, minWidth: 56, justifyContent: 'center', alignItems: 'center' },
  salirTexto: { fontFamily: FUENTES.negrita, fontSize: 15, color: COLORES.blanco },
  etiquetaPequena: { fontFamily: FUENTES.negrita, fontSize: 12, color: COLORES.primario, backgroundColor: COLORES.primarioSuave,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  cajaCifras: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORES.primarioSuave, borderRadius: 18,
    borderWidth: 1, borderColor: COLORES.primarioBorde, padding: 14, gap: 8,
  },
  cifraEtiqueta: { fontFamily: FUENTES.negrita, fontSize: 13, color: COLORES.suave },
  botonRapido: {
    minHeight: 64, borderRadius: 24, backgroundColor: COLORES.naranja, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingHorizontal: 16, elevation: 6,
  },
  botonRapidoIcono: { fontSize: 26, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 14, paddingHorizontal: 6 },
  botonRapidoTexto: { fontFamily: FUENTES.negrita, fontSize: 18, color: COLORES.blanco, flexShrink: 1 },

  // --- Movimientos y botones de colores -------------------------------------------------------
  movimiento: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1 },
  movimientoIcono: { fontSize: 22, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 14, overflow: 'hidden' },
  movimientoCuerpo: { flex: 1, gap: 2 },
  movimientoTitulo: { fontFamily: FUENTES.negrita, fontSize: 16, color: COLORES.texto },
  movimientoDetalle: { fontFamily: FUENTES.normal, fontSize: 13, color: COLORES.suave },
  movimientoValor: { fontFamily: FUENTES.negrita, fontSize: 16 },
  botonColor: {
    flexBasis: '47%', flexGrow: 1, minHeight: 128, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    padding: 12, gap: 6, elevation: 4,
  },
  botonColorIcono: { fontSize: 30, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden' },
  botonColorTitulo: { fontFamily: FUENTES.negrita, fontSize: 17, color: COLORES.blanco, textAlign: 'center' },
  botonColorDetalle: { fontFamily: FUENTES.normal, fontSize: 13, color: COLORES.blanco, opacity: 0.85, textAlign: 'center' },
  tituloPantalla: { fontFamily: FUENTES.negrita, fontSize: 22, color: COLORES.texto, textAlign: 'center' },
  fondoVentana: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 20 },
  ventana: { backgroundColor: COLORES.tarjeta, borderRadius: 24, padding: 22, gap: 12 },
  iconoVentana: { fontSize: 44, textAlign: 'center' },
  tituloVentana: { fontFamily: FUENTES.negrita, fontSize: 22, color: COLORES.texto, textAlign: 'center', lineHeight: 30 },
  textoCentro: { textAlign: 'center' },
  derecha: { textAlign: 'right' },

  // --- Entrar / crear cuenta ------------------------------------------------------------------
  cabeceraSesion: { backgroundColor: COLORES.primarioOscuro, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 16, gap: 14, elevation: 4 },
  selectorSesion: {
    flexDirection: 'row', gap: 6, backgroundColor: 'rgba(2,44,34,0.6)', padding: 5, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  opcionSesion: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  opcionSesionActiva: { backgroundColor: COLORES.blanco },
  opcionSesionTexto: { fontFamily: FUENTES.negrita, fontSize: 16, color: COLORES.verdeClaro },
  opcionSesionTextoActivo: { color: COLORES.primarioOscuro },
  tarjetaInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: 24, padding: 14 },
  tarjetaInfoVerde: { backgroundColor: COLORES.primarioSuave, borderColor: COLORES.primarioBorde },
  tarjetaInfoNaranja: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  tarjetaInfoIcono: { fontSize: 34, backgroundColor: COLORES.blanco, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden' },
  tarjetaInfoCuerpo: { flex: 1, gap: 2 },
  tarjetaInfoTitulo: { fontFamily: FUENTES.negrita, fontSize: 18, color: COLORES.texto },
  botonVerde: { backgroundColor: COLORES.primario },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  enlace: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  enlaceTexto: { fontFamily: FUENTES.negrita, fontSize: 17, color: COLORES.primario },
});
