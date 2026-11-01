/**
 * Lectura de numeros y fechas tal como los escribe un campesino en Colombia (ADR-010).
 */

/**
 * Convierte "50.000", "$ 1.200.000" o "2,5" en numero. En Colombia el punto separa miles y
 * la coma separa decimales. Devuelve null si el texto no es un numero mayor que cero.
 */
export function leerNumero(texto: string): number | null {
  const limpio = texto.replace(/[\s$]/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(limpio)) {
    return null;
  }
  const valor = Number(limpio);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

/**
 * Pesos con puntos de miles mientras se escriben: "1200000" -> "1.200.000". Solo deja digitos
 * (el dinero va en pesos enteros, R6).
 */
export function escribirPesos(texto: string): string {
  const digitos = texto.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre',
  'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const dos = (n: number) => String(n).padStart(2, '0');

/** Date -> AAAA-MM-DD en la zona horaria del celular. No usar toISOString(): da la fecha UTC. */
export function aFechaIso(fecha: Date): string {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** AAAA-MM-DD -> Date a medianoche local. */
export function deFechaIso(texto: string): Date {
  const [a, m, d] = texto.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Fecha de hoy en la zona horaria del celular (AAAA-MM-DD). */
export function fechaHoy(): string {
  return aFechaIso(new Date());
}

/** "2026-10-21" -> "martes 21 de octubre de 2026". */
export function fechaLegible(texto: string): string {
  const f = deFechaIso(texto);
  return `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
}

/** "Hoy", "Ayer" o "21 oct". */
export function fechaCorta(texto: string): string {
  if (texto === fechaHoy()) {
    return 'Hoy';
  }
  if (texto === fechaAyer()) {
    return 'Ayer';
  }
  const f = deFechaIso(texto);
  return `${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)}`;
}

/** "2026-10" -> "Octubre de 2026". */
export function nombreMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  const nombre = MESES[m - 1];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} de ${a}`;
}

/** "2026-10" -> "oct". */
export function mesCorto(mes: string): string {
  return MESES[Number(mes.split('-')[1]) - 1].slice(0, 3);
}

/** Valida AAAA-MM-DD, que sea una fecha real y que no sea futura (el backend exige PastOrPresent). */
export function fechaValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return false;
  }
  const [a, m, d] = texto.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  const real = fecha.getFullYear() === a && fecha.getMonth() === m - 1 && fecha.getDate() === d;
  return real && texto <= fechaHoy();
}

export function formatoPesos(valor: number): string {
  return `$${Math.round(valor).toLocaleString('es-CO')}`;
}

/** 2.5 -> "2,5"; 1200 -> "1.200". */
export function formatoNumero(valor: number | string): string {
  return Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 4 });
}

/** 120 y "Kilogramo" -> "120 kilogramos"; 1 y "Bulto" -> "1 bulto"; 3 y "Unidad" -> "3 unidades". */
export function cantidadConUnidad(cantidad: number, unidad: string): string {
  const nombre = unidad.toLowerCase();
  if (cantidad === 1) {
    return `1 ${nombre}`;
  }
  const plural = nombre.split(' ').map((palabra, i) =>
    i > 0 ? palabra : /[aeiouáéó]$/.test(palabra) ? `${palabra}s` : `${palabra}es`).join(' ');
  return `${formatoNumero(cantidad)} ${plural}`;
}

/** Numero guardado -> texto para el campo al editar ("2,5"), sin separador de miles. */
export function numeroATexto(valor: number): string {
  return String(valor).replace('.', ',');
}

/** Fecha de ayer en la zona horaria del celular (AAAA-MM-DD). */
export function fechaAyer(): string {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return aFechaIso(ayer);
}
