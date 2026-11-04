import { fechaValida, leerNumero } from './formato';

/**
 * Reglas de validacion de los formularios (ADR-002). Son funciones puras: funcionan sin conexion y
 * devuelven el mensaje para el campesino, o `undefined` si el dato esta bien. Repiten las mismas
 * restricciones que valida el backend (obligatorio, largo maximo, mayor que cero, decimales, fecha no
 * futura) para que un registro hecho sin senal no termine en ERROR al sincronizar.
 */

/** Texto obligatorio con largo maximo. */
export function texto(v: string, mensaje: string, maximo: number): string | undefined {
  if (!v.trim()) {
    return mensaje;
  }
  return v.trim().length > maximo ? `Escribe máximo ${maximo} letras.` : undefined;
}

/** Opcion obligatoria de una lista. */
export const elegido = (v: string | undefined, mensaje: string): string | undefined => (v ? undefined : mensaje);

/** Fecha obligatoria que no puede estar en el futuro. */
export const fecha = (v: string): string | undefined =>
  (fechaValida(v) ? undefined : 'Elige la fecha. No puede ser una fecha futura.');

/** Numero mayor que cero, con un maximo de decimales y, si se da, un valor maximo. */
export function numero(v: string, mensaje: string, decimales: number, maximo?: number): string | undefined {
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

/** Pesos: enteros (sin centavos), mayores que cero y hasta 999.999.999.999. */
export const pesos = (v: string, mensaje: string): string | undefined => numero(v, mensaje, 0, 999_999_999_999);
