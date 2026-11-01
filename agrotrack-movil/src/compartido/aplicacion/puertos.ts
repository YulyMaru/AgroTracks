/**
 * Puertos de salida que usan varios modulos. Los casos de uso solo conocen estas interfaces; las
 * implementaciones (SQLite, uuid...) estan en compartido/infraestructura y se conectan en
 * src/composicion.ts.
 */

/** Varias escrituras que deben quedar todas o ninguna (por ejemplo, el registro y su cambio en la cola). */
export interface Transacciones {
  ejecutar(trabajo: () => Promise<void>): Promise<void>;
}

/** Datos sueltos de la app guardados en el celular (cuenta actual, ultima sincronizacion...). */
export interface Metadatos {
  leer(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string): Promise<void>;
  borrar(clave: string): Promise<void>;
}

/** Ids nuevos para los registros: los genera el celular (R3). */
export interface GeneradorIds {
  nuevo(): string;
}
