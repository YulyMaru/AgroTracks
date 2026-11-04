/**
 * Sistema de diseno de la app (SPIKE-010, SPIKE-017, SPIKE-023; ADR-010, ADR-023):
 *
 *  - Contraste WCAG 2.1 AA de cada par letra/fondo que usan los componentes: 4,5:1 para letra normal y
 *    3:1 para letra grande (>= 24 px, o >= 18,66 px en negrita).
 *  - Todos los controles que se tocan miden al menos 48 x 48 dp y los botones vecinos se separan 8 dp.
 *  - Los valores se muestran con su concepto y unidad ("$1.200.000", "120 kilogramos").
 *  - 10.000 identificadores UUID sin repetidos.
 */
import { generadorUuid } from '../src/compartido/infraestructura/ids/generadorUuid';
import { cantidadConUnidad, escribirPesos, formatoPesos } from '../src/compartido/dominio/formato';
import { COLORES, estilos } from '../src/pantallas/componentes';

jest.mock('@op-engineering/op-sqlite', () => require('../pruebas/dobles').opSqlite);
jest.mock('react-native-keychain', () => require('../pruebas/dobles').keychain);

type Estilo = Record<string, unknown>;
const E = estilos as unknown as Record<string, Estilo>;

// --- Contraste ----------------------------------------------------------------------------------
const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const luminancia = (c: number[]) => {
  const [r, g, b] = c.map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** Color con transparencia (opacidad del texto o un rgba) sobre un fondo solido. */
const mezclar = (frente: number[], fondo: number[], alfa: number) => frente.map((v, i) => v * alfa + fondo[i] * (1 - alfa));
function contraste(texto: number[], fondo: number[]): number {
  const [a, b] = [luminancia(texto), luminancia(fondo)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

/** Letra grande segun WCAG: 24 px, o 18,66 px en negrita. */
const esGrande = (e: Estilo) => {
  const tamano = Number(e.fontSize ?? 17);
  return tamano >= 24 || (tamano >= 18.66 && e.fontFamily === 'Inter-SemiBold');
};

/** Cada texto de la app con el fondo sobre el que se dibuja. */
const fondoSelectorSesion = mezclar([2, 44, 34], rgb(COLORES.primarioOscuro), 0.6);
const PARES: { donde: string; estilo: Estilo; texto: number[]; fondo: number[] }[] = [
  ...['fondo', 'tarjeta'].flatMap(f => [
    { donde: `texto sobre ${f}`, estilo: E.texto, texto: rgb(COLORES.texto), fondo: rgb(COLORES[f as 'fondo']) },
    { donde: `textoSuave sobre ${f}`, estilo: E.textoSuave, texto: rgb(COLORES.suave), fondo: rgb(COLORES[f as 'fondo']) },
    { donde: `ayuda sobre ${f}`, estilo: E.ayuda, texto: rgb(COLORES.suave), fondo: rgb(COLORES[f as 'fondo']) },
    { donde: `mensajeError sobre ${f}`, estilo: E.mensajeError, texto: rgb(COLORES.error), fondo: rgb(COLORES[f as 'fondo']) },
    { donde: `enlace sobre ${f}`, estilo: E.enlaceTexto, texto: rgb(COLORES.primario), fondo: rgb(COLORES[f as 'fondo']) },
  ]),
  { donde: 'boton principal', estilo: E.botonTexto, texto: rgb(COLORES.blanco), fondo: rgb(COLORES.primario) },
  { donde: 'boton secundario', estilo: { ...E.botonTexto, ...E.botonTextoSecundario }, texto: rgb(COLORES.primario), fondo: rgb(COLORES.primarioSuave) },
  { donde: 'boton peligro', estilo: { ...E.botonTexto, ...E.botonTextoPeligro }, texto: rgb(COLORES.error), fondo: rgb(COLORES.errorSuave) },
  { donde: 'boton rapido (naranja)', estilo: E.botonRapidoTexto, texto: rgb(COLORES.blanco), fondo: rgb(COLORES.naranja) },
  { donde: 'insignia de Envios', estilo: E.insigniaTexto, texto: rgb(COLORES.blanco), fondo: rgb(COLORES.naranja) },
  { donde: 'chip', estilo: E.chipTexto, texto: rgb(COLORES.primarioOscuro), fondo: rgb(COLORES.blanco) },
  { donde: 'chip elegido', estilo: { ...E.chipTexto, ...E.chipTextoActivo }, texto: rgb(COLORES.blanco), fondo: rgb(COLORES.primario) },
  { donde: 'nombre de la app en la barra', estilo: E.nombreApp, texto: rgb(COLORES.blanco), fondo: rgb(COLORES.primario) },
  { donde: 'subtitulo de la barra', estilo: E.subtituloApp, texto: rgb(COLORES.verdeClaro), fondo: rgb(COLORES.primario) },
  { donde: 'subtitulo de la entrada', estilo: E.subtituloApp, texto: rgb(COLORES.verdeClaro), fondo: rgb(COLORES.primarioOscuro) },
  { donde: 'pildora En linea', estilo: E.pildoraTexto, texto: rgb(COLORES.primarioSuave), fondo: rgb(COLORES.primarioOscuro) },
  { donde: 'pestana', estilo: E.pestanaTexto, texto: rgb(COLORES.suave), fondo: rgb(COLORES.tarjeta) },
  { donde: 'pestana activa', estilo: { ...E.pestanaTexto, ...E.pestanaTextoActivo }, texto: rgb(COLORES.primario), fondo: rgb(COLORES.primarioSuave) },
  { donde: 'bienvenida: etiqueta', estilo: E.bienvenidaEtiqueta, texto: rgb(COLORES.verdeClaro), fondo: rgb(COLORES.teal) },
  { donde: 'bienvenida: nombre', estilo: E.bienvenidaNombre, texto: rgb(COLORES.blanco), fondo: rgb(COLORES.teal) },
  { donde: 'bienvenida: chip', estilo: E.bienvenidaChipTexto, texto: rgb(COLORES.primarioSuave), fondo: rgb(COLORES.primarioOscuro) },
  { donde: 'bienvenida: Salir', estilo: E.salirTexto, texto: rgb(COLORES.blanco), fondo: rgb(COLORES.teal) },
  { donde: 'etiqueta pequena', estilo: E.etiquetaPequena, texto: rgb(COLORES.primario), fondo: rgb(COLORES.primarioSuave) },
  { donde: 'cifra: etiqueta', estilo: E.cifraEtiqueta, texto: rgb(COLORES.suave), fondo: rgb(COLORES.primarioSuave) },
  { donde: 'selector de entrada', estilo: E.opcionSesionTexto, texto: rgb(COLORES.verdeClaro), fondo: fondoSelectorSesion },
  { donde: 'selector de entrada elegido', estilo: { ...E.opcionSesionTexto, ...E.opcionSesionTextoActivo }, texto: rgb(COLORES.primarioOscuro), fondo: rgb(COLORES.blanco) },
  ...(['primarioSuave', 'errorSuave'] as const).flatMap(f => [
    { donde: `movimiento: titulo sobre ${f}`, estilo: E.movimientoTitulo, texto: rgb(COLORES.texto), fondo: rgb(COLORES[f]) },
    { donde: `movimiento: detalle sobre ${f}`, estilo: E.movimientoDetalle, texto: rgb(COLORES.suaveOscuro), fondo: rgb(COLORES[f]) },
  ]),
  { donde: 'movimiento: valor que entro', estilo: E.movimientoValor, texto: rgb(COLORES.primario), fondo: rgb(COLORES.primarioSuave) },
  { donde: 'movimiento: valor que salio', estilo: E.movimientoValor, texto: rgb(COLORES.errorOscuro), fondo: rgb(COLORES.errorSuave) },
  { donde: 'envio: Por enviar', estilo: E.texto, texto: rgb(COLORES.pendiente), fondo: rgb(COLORES.tarjeta) },
  { donde: 'aviso de informacion', estilo: E.texto, texto: rgb(COLORES.texto), fondo: rgb(COLORES.pendienteSuave) },
  // Botones de color de "Anotar" (PantallaAnotar.tsx): titulo y ayuda en blanco.
  ...(['error', 'primario', 'pendiente', 'teal'] as const).flatMap(c => [
    { donde: `boton de color ${c}: titulo`, estilo: E.botonColorTitulo, texto: rgb(COLORES.blanco), fondo: rgb(COLORES[c]) },
    { donde: `boton de color ${c}: ayuda`, estilo: E.botonColorDetalle, texto: mezclar(rgb(COLORES.blanco), rgb(COLORES[c]), Number(E.botonColorDetalle.opacity ?? 1)), fondo: rgb(COLORES[c]) },
  ]),
];

describe('SPIKE-023: contraste WCAG 2.1 AA', () => {
  test.each(PARES)('$donde', ({ estilo, texto, fondo }) => {
    const minimo = esGrande(estilo) ? 3 : 4.5;
    expect(Math.round(contraste(texto, fondo) * 100) / 100).toBeGreaterThanOrEqual(minimo);
  });
});

// --- Tamanos tactiles ---------------------------------------------------------------------------
/** Estilos de todo lo que se toca (Pressable, TextInput) en src/pantallas. */
const TOCABLES = ['avisoCerrar', 'boton', 'botonColor', 'botonMenu', 'botonMes', 'botonNumero', 'botonRapido',
  'chip', 'chipSugerencia', 'enlace', 'entrada', 'opcionSesion', 'pestana', 'salir', 'volver'];

describe('SPIKE-010 / SPIKE-023: controles de al menos 48 x 48 dp', () => {
  test.each(TOCABLES)('%s', nombre => {
    const e = E[nombre];
    const alto = Number(e.minHeight ?? e.height ?? 0);
    expect(alto).toBeGreaterThanOrEqual(48);
    // El ancho lo da el contenido o el flex; si esta fijo, tambien debe ser de 48.
    if (e.minWidth !== undefined || e.width !== undefined) {
      expect(Number(e.minWidth ?? e.width)).toBeGreaterThanOrEqual(48);
    }
  });

  test('el boton del ojo (ver clave) mide 48 dp dentro de un campo de 56 dp', () => {
    const ojo = E.botonOjo;
    expect(Number(E.entrada.minHeight) - Number(ojo.top) - Number(ojo.bottom)).toBeGreaterThanOrEqual(48);
    expect(Number(ojo.width)).toBeGreaterThanOrEqual(48);
  });

  test('los grupos de botones vecinos se separan al menos 8 dp', () => {
    for (const grupo of ['chips', 'rejilla', 'filaNumero', 'selectorSesion']) {
      expect([grupo, Number(E[grupo].gap)]).toEqual([grupo, expect.any(Number)]);
      expect(Number(E[grupo].gap)).toBeGreaterThanOrEqual(8);
    }
  });

  test('ningun texto es mas pequeno de 12 px', () => {
    const pequenos = Object.entries(E).filter(([, e]) => e.fontSize !== undefined && Number(e.fontSize) < 12);
    expect(pequenos).toEqual([]);
  });
});

// --- Valores con concepto y unidad --------------------------------------------------------------
describe('SPIKE-010: valores con su unidad', () => {
  test('pesos con signo y puntos de miles; cantidades con su unidad en palabras', () => {
    const espacio = (t: string) => t.replace(/ /g, ' ');
    expect(espacio(formatoPesos(1_200_000))).toBe('$1.200.000');
    expect(escribirPesos('1200000')).toBe('1.200.000');
    expect(cantidadConUnidad(120, 'Kilogramo')).toBe('120 kilogramos');
    expect(cantidadConUnidad(1, 'Bulto')).toBe('1 bulto');
    expect(cantidadConUnidad(2.5, 'Hectárea')).toBe('2,5 hectáreas');
  });
});

// --- UUID ---------------------------------------------------------------------------------------
test('SPIKE-017: 10.000 UUID v4 sin repetidos', () => {
  const ids = new Set(Array.from({ length: 10_000 }, () => generadorUuid.nuevo()));
  expect(ids.size).toBe(10_000);
  ids.forEach(id => expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/));
});
