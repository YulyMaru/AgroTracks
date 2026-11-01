/**
 * Composicion de la app (raiz de la arquitectura hexagonal): el UNICO lugar que conoce los
 * adaptadores (SQLite, HTTP, Keychain, NetInfo) y los conecta con los casos de uso. Las pantallas
 * solo usan el objeto {@link app} y los tipos del dominio.
 */
import { crearPreferencias } from './compartido/aplicacion/preferencias';
import { mensajeDeError } from './compartido/dominio/errores';
import { CONFIG_SINCRONIZACION } from './compartido/infraestructura/configuracion/entorno';
import { configurarTokens, registrarAlExpirarSesion } from './compartido/infraestructura/http/clienteHttp';
import { generadorUuid } from './compartido/infraestructura/ids/generadorUuid';
import {
  abrirBaseDatos,
  metadatosSqlite,
  registrarTablas,
  transaccionesSqlite,
} from './compartido/infraestructura/sqlite/baseDatos';
import { crearCasosAnalisis } from './modulos/analisis/aplicacion/casosDeUso';
import { crearFuenteRegistrosAdaptador } from './modulos/analisis/infraestructura/fuenteRegistrosAdaptador';
import { crearCasosSesion } from './modulos/autenticacion/aplicacion/casosDeUso';
import type { Tokens } from './modulos/autenticacion/dominio/sesion';
import { almacenSesionKeychain } from './modulos/autenticacion/infraestructura/almacenSesionKeychain';
import { apiAutenticacionHttp } from './modulos/autenticacion/infraestructura/apiAutenticacionHttp';
import { crearDatosCuentaSqlite } from './modulos/autenticacion/infraestructura/datosCuentaSqlite';
import { crearCasosRegistros } from './modulos/registros/aplicacion/casosDeUso';
import { catalogoSqlite } from './modulos/registros/infraestructura/catalogoSqlite';
import { crearColaCambiosAdaptador } from './modulos/registros/infraestructura/colaCambiosAdaptador';
import { SQL_TABLAS_REGISTROS, TABLAS_REGISTROS } from './modulos/registros/infraestructura/esquemaSqlite';
import { registrosSqlite } from './modulos/registros/infraestructura/registrosSqlite';
import { crearCola } from './modulos/sincronizacion/aplicacion/cola';
import { crearMotor, type Motor } from './modulos/sincronizacion/aplicacion/motor';
import { colaSqlite, SQL_TABLAS_COLA } from './modulos/sincronizacion/infraestructura/colaSqlite';
import { crearCopiaLocalAdaptador } from './modulos/sincronizacion/infraestructura/copiaLocalAdaptador';
import { redNetInfo } from './modulos/sincronizacion/infraestructura/redNetInfo';
import { servidorHttp } from './modulos/sincronizacion/infraestructura/servidorHttp';
import { crearSesionActivaAdaptador } from './modulos/sincronizacion/infraestructura/sesionActivaAdaptador';

// Tablas de cada modulo.
registrarTablas([...SQL_TABLAS_COLA, ...SQL_TABLAS_REGISTROS]);

// Autenticacion.
const sesion = crearCasosSesion({
  almacen: almacenSesionKeychain,
  api: apiAutenticacionHttp,
  datos: crearDatosCuentaSqlite(['operaciones_pendientes', ...TABLAS_REGISTROS]),
});
configurarTokens({
  obtener: () => almacenSesionKeychain.obtener(),
  guardarRenovados: tokens => almacenSesionKeychain.guardar(tokens as Tokens),
  borrar: () => almacenSesionKeychain.borrar(),
});

// Cola, registros y motor (el motor se crea despues: registros solo pregunta si esta enviando).
const cola = crearCola(colaSqlite, generadorUuid);
let motor: Motor | null = null;
const registros = crearCasosRegistros({
  repositorio: registrosSqlite,
  catalogo: catalogoSqlite,
  cola: crearColaCambiosAdaptador(cola, () => motor?.haySincronizacionEnCurso() ?? false),
  transacciones: transaccionesSqlite,
  metadatos: metadatosSqlite,
  ids: generadorUuid,
});
motor = crearMotor({
  cola: colaSqlite,
  servidor: servidorHttp,
  copia: crearCopiaLocalAdaptador(registros),
  red: redNetInfo,
  sesion: crearSesionActivaAdaptador(sesion),
  metadatos: metadatosSqlite,
  config: CONFIG_SINCRONIZACION,
});

// Analisis de las cuentas (lee de registros por su API publica).
const analisis = crearCasosAnalisis({ fuente: crearFuenteRegistrosAdaptador(registros) });

export const app = {
  sesion,
  registros,
  cola,
  motor,
  analisis,
  preferencias: crearPreferencias(metadatosSqlite),
  /** Prepara la base de datos local antes de mostrar la app. */
  iniciar: async () => {
    await abrirBaseDatos();
  },
  alExpirarSesion: registrarAlExpirarSesion,
  mensajeDeError,
};
