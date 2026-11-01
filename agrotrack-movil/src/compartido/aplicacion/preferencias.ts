import type { Metadatos } from './puertos';

/**
 * Lo ultimo que eligio el campesino (la finca, el cultivo, la unidad...) para no tener que
 * elegirlo cada vez. Se guarda en el celular.
 */
export function crearPreferencias(metadatos: Metadatos) {
  return {
    leer: (clave: string) => metadatos.leer(`preferencia.${clave}`),
    recordar: (clave: string, valor: string) => metadatos.guardar(`preferencia.${clave}`, valor),
  };
}

export type Preferencias = ReturnType<typeof crearPreferencias>;
