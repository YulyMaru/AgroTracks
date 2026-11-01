/**
 * (En JavaScript porque usa fs de Node, que el codigo de la app no tiene.)
 *
 * Reglas de la arquitectura hexagonal de la app (ADR-032). Revisa los imports del codigo:
 * si alguien rompe una regla, esta prueba falla y dice en que archivo.
 *  1. El dominio es TypeScript puro: no usa librerias ni otras capas.
 *  2. La aplicacion (casos de uso y puertos) no usa librerias de React Native ni la infraestructura.
 *  3. Un modulo solo usa otro desde su infraestructura, y solo su aplicacion (API publica) o su dominio.
 *  4. Las pantallas y la navegacion nunca tocan la infraestructura: usan src/composicion.ts.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const RAIZ = path.join(__dirname, '..');

function archivos(carpeta) {
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap(e => {
    const ruta = path.join(carpeta, e.name);
    return e.isDirectory() ? archivos(ruta) : /\.tsx?$/.test(e.name) ? [ruta] : [];
  });
}

/** Imports de un archivo: las librerias tal cual y los relativos como ruta dentro de src/. */
function imports(archivo) {
  const codigo = fs.readFileSync(archivo, 'utf-8');
  return [...codigo.matchAll(/from '([^']+)'/g)].map(([, origen]) =>
    origen.startsWith('.') ? path.relative(SRC, path.resolve(path.dirname(archivo), origen)).replace(/\\/g, '/') : origen);
}

const relativo = archivo => path.relative(SRC, archivo).replace(/\\/g, '/');
const esLibreria = i => !i.startsWith('..') && !/^(compartido|modulos|pantallas|navegacion|composicion)/.test(i);
const todos = archivos(SRC);

function violaciones(filtro, prohibido) {
  return todos.filter(a => filtro(relativo(a)))
    .flatMap(a => imports(a).filter(i => prohibido(i, relativo(a))).map(i => `${relativo(a)} importa ${i}`));
}

test('el dominio es TypeScript puro', () => {
  expect(violaciones(
    a => a.includes('/dominio/'),
    i => esLibreria(i) || i.includes('/aplicacion/') || i.includes('/infraestructura/'),
  )).toEqual([]);
});

test('la aplicacion solo habla con puertos', () => {
  expect(violaciones(
    a => a.includes('/aplicacion/'),
    i => esLibreria(i) || i.includes('/infraestructura/'),
  )).toEqual([]);
});

test('los modulos solo se hablan por su API publica y desde un adaptador', () => {
  expect(violaciones(
    a => a.startsWith('modulos/'),
    (i, a) => {
      const propio = a.split('/')[1];
      const [carpeta, otro, capa] = i.split('/');
      if (carpeta !== 'modulos' || otro === propio) {
        return false;
      }
      const desdeAdaptador = a.split('/')[2] === 'infraestructura';
      return !desdeAdaptador || !['aplicacion', 'dominio'].includes(capa);
    },
  )).toEqual([]);
});

test('las pantallas y la navegacion no tocan la infraestructura', () => {
  const ui = [...todos.filter(a => /^(pantallas|navegacion)\//.test(relativo(a))), path.join(RAIZ, 'App.tsx')];
  const malos = ui.flatMap(a => imports(a).filter(i => i.includes('infraestructura')).map(i => `${a} importa ${i}`));
  expect(malos).toEqual([]);
});
