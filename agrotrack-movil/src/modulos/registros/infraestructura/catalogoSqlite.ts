import { consultar, ejecutar } from '../../../compartido/infraestructura/sqlite/baseDatos';
import type { CatalogoLocal } from '../aplicacion/puertos';
import type { Parametro } from '../dominio/modelo';

/** Adaptador de {@link CatalogoLocal}: la tabla parametros del celular. */
export const catalogoSqlite: CatalogoLocal = {
  activos: tipo => consultar<Parametro>(
    'SELECT tipo, codigo, etiqueta FROM parametros WHERE tipo = ? AND activo = 1 ORDER BY orden', [tipo]),

  todos: () => consultar<Parametro>('SELECT tipo, codigo, etiqueta FROM parametros'),

  async guardar(parametros) {
    for (const p of parametros) {
      await ejecutar(
        `INSERT INTO parametros (tipo, codigo, etiqueta, orden, activo) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(tipo, codigo) DO UPDATE SET etiqueta = excluded.etiqueta, orden = excluded.orden,
           activo = excluded.activo`,
        [p.tipo, p.codigo, p.etiqueta, p.orden, p.activo ? 1 : 0]);
    }
  },
};
