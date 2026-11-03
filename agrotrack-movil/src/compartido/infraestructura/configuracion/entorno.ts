/**
 * URL del backend, segun como se compilo la app (__DEV__ lo define React Native).
 * - Desarrollo (emulador o celular por USB): localhost + `adb reverse tcp:8080 tcp:8080`.
 *   Se evita 10.0.2.2 o la IP del PC porque desde Android 17 (API 37) la "red local"
 *   exige el permiso ACCESS_LOCAL_NETWORK (dispositivos cercanos); localhost no lo exige.
 * - Release (el APK que se reparte): el backend en Google Cloud (ADR-031), siempre HTTPS (ADR-022).
 *   Despues del primer despliegue, poner aqui la URL que muestra Cloud Run (agrotrack-prod)
 *   o, cuando haya dominio con Cloudflare, https://api.<dominio>.
 */
const URL_DESARROLLO = 'http://localhost:8080';
const URL_PRODUCCION = 'https://agrotrack-prod-126803478598.us-east1.run.app';

export const URL_BACKEND = __DEV__ ? URL_DESARROLLO : URL_PRODUCCION;

export const CONFIG_SINCRONIZACION = {
  /**
   * "La conexion es estable?": el backend debe responder en este tiempo. Cloud Run apaga el backend
   * cuando nadie lo usa y el primer arranque de la JVM tarda unos segundos (ADR-031); como la
   * sincronizacion va en segundo plano, se espera lo suficiente para no tomarlo como falta de red.
   */
  tiempoMaximoChequeoMs: 25000,
  tiempoMaximoPeticionMs: 30000,
  /** Debe coincidir con agrotrack.sincronizacion.max-operaciones-por-lote del backend. */
  operacionesPorLote: 100,
  /** Reintentos con backoff exponencial ante fallos temporales (ADR-001). */
  maxReintentos: 5,
  esperaInicialMs: 1000,
  esperaMaximaMs: 30000,
};
