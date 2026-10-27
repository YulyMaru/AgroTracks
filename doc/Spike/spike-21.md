# SPIKE-021: Validar monitoreo y observabilidad con Spring Boot Actuator, Prometheus, Grafana y Firebase

## Información general

- **ID:** SPIKE-021
- **Nombre:** Validar monitoreo y observabilidad en backend y frontend con stack open source + Firebase
- **ADR relacionado:** ADR-021 — Implementar monitoreo y observabilidad en backend y frontend
- **ADR complementarios:** ADR-001 (Sincronización offline con retry y backoff), ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-007 (Garantizar idempotencia y consistencia en sync), ADR-009 (Optimizar consultas con índices y caché), ADR-011 (Bloquear acceso no autenticado con middleware), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil), ADR-018 (Usar monolito modular por capas con arquitectura offline-first y patrón Repository), ADR-019 (Versionar el esquema de base de datos con migraciones automáticas), ADR-020 (Definir la estrategia de pruebas en capas para backend y frontend)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles 

## 1. Objetivo

Validar técnicamente que Spring Boot Actuator + Micrometer + Prometheus + Grafana + Alertmanager en el backend, y Firebase Crashlytics + Firebase Analytics + React Native DevTools en el frontend móvil, permiten monitorear y observar el sistema de forma completa, detectar errores tempranamente, rastrear operaciones de sincronización con `idTraza`, y visualizar métricas de rendimiento sin degradar el servicio, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-03, ESC-CAL-CF-05, ESC-CAL-RN-02, ESC-CAL-RN-04, ESC-CAL-SEG-01, ESC-CAL-ESC-01 y ESC-CAL-INT-03.

El Spike busca comprobar que la estrategia de observabilidad seleccionada en ADR-021 es viable antes de implementarla completamente en AgroTrack.

## 2. Problema que se busca validar

AgroTrack necesita visibilidad completa de su funcionamiento en producción, pero existen riesgos de que:

- Los errores críticos (fallos de sincronización, pérdida de datos, problemas de autenticación) no se detecten a tiempo.
- No haya métricas de rendimiento para validar los umbrales definidos.
- No se pueda rastrear una operación desde que se registra offline hasta que se sincroniza.
- No se pueda diagnosticar por qué falla una sincronización.
- Los crashes en el frontend no se registren ni se analicen.
- Las alertas no se disparen ante problemas críticos.
- El monitoreo degrade el rendimiento del backend o del frontend.
- La configuración de Prometheus y Grafana sea compleja y consuma demasiado tiempo.
- El `idTraza` no se propague correctamente entre frontend y backend.

Por esta razón, se necesita un prototipo que implemente el stack de observabilidad, configure dashboards y alertas, y valide su comportamiento en condiciones realistas.

## 3. Pregunta principal del Spike

¿Spring Boot Actuator + Micrometer + Prometheus + Grafana + Alertmanager en el backend, y Firebase Crashlytics + Firebase Analytics + React Native DevTools en el frontend, permiten monitorear métricas, detectar errores, rastrear operaciones con `idTraza` y visualizar dashboards sin degradar el rendimiento, y se integran correctamente con el stack de AgroTrack?

## 4. Hipótesis

Si implementamos:

- **Backend**:
  - Spring Boot Actuator con endpoints `/health`, `/metrics`, `/prometheus`.
  - Micrometer para recolectar métricas.
  - Prometheus para almacenar métricas.
  - Grafana para visualizar dashboards.
  - Alertmanager para alertas.
  - `idTraza` propagado en logs y respuestas HTTP.
- **Frontend**:
  - Firebase Crashlytics para crashes.
  - Firebase Analytics para eventos clave.
  - React Native DevTools para debugging en desarrollo.
  - Captura de errores no controlados.

Entonces:

- Las métricas del backend se expondrán correctamente.
- Grafana mostrará dashboards con latencia, errores, throughput, JVM, DB y sincronización.
- Las alertas se dispararán ante errores críticos.
- El `idTraza` permitirá rastrear una operación desde el móvil hasta el backend.
- Crashlytics registrará crashes y errores no controlados.
- Analytics registrará eventos clave de usuario.
- El monitoreo no degradará el rendimiento (< 5 % de overhead).
- La configuración será reproducible y mantenible.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Backend (Spring Boot)**:
  - Añadir `spring-boot-starter-actuator` y `micrometer-registry-prometheus`.
  - Configurar endpoints de Actuator (`/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`).
  - Configurar Prometheus con `prometheus.yml` para hacer scraping.
  - Configurar Grafana con al menos 3 dashboards:
    - Endpoints (latencia p50/p95/p99, tasa de errores, throughput).
    - JVM (memoria, GC, threads).
    - Sincronización (operaciones pendientes, reintentos, idempotencia).
  - Configurar Alertmanager con al menos 3 alertas:
    - Errores 500 > 1 % en 5 minutos.
    - Latencia p95 > 3 s en consultas productivas.
    - Fallos de sincronización > 5 % en 10 minutos.
  - Inyectar `idTraza` en logs y respuestas HTTP.
  - Endpoints representativos para generar métricas:
    - `GET /api/v1/fincas` (consulta productiva).
    - `GET /api/v1/resumen` (resumen económico).
    - `POST /api/v1/sincronizacion/transacciones` (sincronización idempotente).
- **Frontend (React Native)**:
  - Integrar Firebase Crashlytics.
  - Integrar Firebase Analytics.
  - Integrar React Native DevTools para desarrollo.
  - Capturar errores no controlados y enviarlos a Crashlytics.
  - Registrar eventos clave en Analytics: login, registro offline, sincronización, consulta de resumen.
  - Generar `idTraza` y enviarlo en el header `X-Trace-Id`.
- **Infraestructura**:
  - Docker Compose con Prometheus, Grafana y Alertmanager.
  - Configuración de alertas en Alertmanager.
  - Configuración de dashboards en Grafana (JSON exportable).
- **Pruebas**:
  - Verificar que las métricas se exponen correctamente.
  - Verificar que Grafana muestra los dashboards.
  - Verificar que las alertas se disparan correctamente.
  - Verificar que el `idTraza` se propaga correctamente.
  - Verificar que Crashlytics registra crashes.
  - Verificar que Analytics registra eventos.
  - Medir el overhead del monitoreo.

### 5.2 No incluye

El Spike no implementará:

- Todas las métricas posibles (solo las críticas).
- Todas las alertas posibles (solo las críticas).
- Logs centralizados con Loki (se deja como pendiente para futuro).
- Trazas distribuidas con Tempo o Jaeger (se deja como pendiente).
- Monitoreo de infraestructura (CPU, disco, red del servidor).
- Monitoreo de la base de datos PostgreSQL a nivel de servidor.
- Dashboards avanzados con variables dinámicas.
- Integración con Slack o email para alertas (se documenta pero no se implementa).
- Pruebas en producción.
- Configuración de alta disponibilidad para Prometheus/Grafana.

## 6. Caso de prueba principal

**Endpoints a monitorear:**

| Método | Endpoint | Métrica esperada |
|--------|----------|------------------|
| GET | `/api/v1/fincas` | Latencia, throughput, tasa de errores |
| GET | `/api/v1/resumen` | Latencia, throughput, tasa de errores |
| POST | `/api/v1/sincronizacion/transacciones` | Latencia, throughput, tasa de errores, idempotencia |

**Métricas a exponer:**

- `http_server_requests_seconds` (latencia por endpoint).
- `http_server_requests_total` (throughput y errores).
- `jvm_memory_used_bytes` (memoria JVM).
- `jvm_gc_pause_seconds` (pausas de GC).
- `hikaricp_connections_active` (conexiones a BD).
- `sincronizacion_operaciones_pendientes_total` (operaciones pendientes).
- `sincronizacion_reintentos_total` (reintentos).
- `sincronizacion_operaciones_repetidas_total` (idempotencia).

**Eventos de Analytics:**

- `inicio_sesion_exitoso`, `inicio_sesion_fallido`.
- `registro_offline_guardado`.
- `sincronizacion_exitosa`, `sincronizacion_fallida`.
- `resumen_consultado`.

**Infraestructura:**

- Docker Compose con:
  - Prometheus (puerto 9090).
  - Grafana (puerto 3000).
  - Alertmanager (puerto 9093).
  - Backend Spring Boot (puerto 8080).

**Datos de prueba:**

- 20 fincas.
- 100 transacciones (50 ingresos, 50 gastos).
- 5 operaciones pendientes.
- Usuario mock autenticado.

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Exposición de métricas con Actuator y Micrometer

**Objetivo:** Validar que Spring Boot Actuator y Micrometer exponen las métricas correctamente.

#### Procedimiento
1. Añadir las dependencias de Actuator y Micrometer.
2. Configurar `application.yml` para exponer `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`.
3. Consumir `GET /actuator/health` y verificar que devuelve `UP`.
4. Consumir `GET /actuator/metrics` y verificar que lista las métricas disponibles.
5. Consumir `GET /actuator/prometheus` y verificar que expone las métricas en formato Prometheus.
6. Consumir los endpoints representativos y verificar que las métricas se actualizan.

#### Resultado esperado
- `/actuator/health` devuelve `UP`.
- `/actuator/metrics` lista las métricas.
- `/actuator/prometheus` expone las métricas en formato Prometheus.
- Las métricas se actualizan tras consumir los endpoints.
- No hay errores de configuración.

---

### 7.2 Prueba 2 — Configuración de Prometheus y scraping

**Objetivo:** Validar que Prometheus hace scraping de las métricas del backend.

#### Procedimiento
1. Configurar `prometheus.yml` para hacer scraping de `backend:8080/actuator/prometheus` cada 15 s.
2. Levantar Prometheus con Docker Compose.
3. Verificar en la UI de Prometheus (puerto 9090) que el target está `UP`.
4. Ejecutar consultas PromQL para verificar que las métricas están disponibles.
5. Consumir los endpoints representativos y verificar que las métricas se actualizan en Prometheus.

#### Resultado esperado
- Prometheus hace scraping correctamente.
- El target está `UP`.
- Las métricas están disponibles en Prometheus.
- Las métricas se actualizan tras consumir los endpoints.
- No hay errores de scraping.

---

### 7.3 Prueba 3 — Dashboards en Grafana

**Objetivo:** Validar que Grafana muestra dashboards con las métricas críticas.

#### Procedimiento
1. Configurar Grafana con Prometheus como fuente de datos.
2. Crear 3 dashboards:
   - Endpoints: latencia p50/p95/p99, tasa de errores, throughput.
   - JVM: memoria, GC, threads.
   - Sincronización: operaciones pendientes, reintentos, idempotencia.
3. Consumir los endpoints representativos y verificar que los dashboards se actualizan.
4. Exportar los dashboards como JSON.

#### Resultado esperado
- Grafana muestra los 3 dashboards.
- Los dashboards se actualizan en tiempo real.
- Los dashboards son legibles y útiles.
- Los dashboards se exportan como JSON.

---

### 7.4 Prueba 4 — Alertas en Alertmanager

**Objetivo:** Validar que Alertmanager dispara alertas ante errores críticos.

#### Procedimiento
1. Configurar Alertmanager con al menos 3 alertas:
   - Errores 500 > 1 % en 5 minutos.
   - Latencia p95 > 3 s en consultas productivas.
   - Fallos de sincronización > 5 % en 10 minutos.
2. Simular un error 500 en el backend.
3. Verificar que la alerta se dispara en Alertmanager.
4. Simular latencia alta en un endpoint.
5. Verificar que la alerta se dispara.
6. Simular fallos de sincronización.
7. Verificar que la alerta se dispara.

#### Resultado esperado
- Las 3 alertas se disparan correctamente.
- Alertmanager muestra las alertas activas.
- Las alertas se resuelven cuando el problema desaparece.
- No hay falsos positivos/negativos.

---

### 7.5 Prueba 5 — Propagación de `idTraza`

**Objetivo:** Validar que el `idTraza` se propaga entre frontend y backend.

#### Procedimiento
1. Generar un `idTraza` en el frontend.
2. Enviarlo en el header `X-Trace-Id` en cada solicitud HTTP.
3. Configurar el backend para leer el header y añadirlo al MDC (Mapped Diagnostic Context).
4. Verificar que el `idTraza` aparece en los logs del backend.
5. Verificar que el `idTraza` aparece en las respuestas de error.
6. Rastrear una operación desde el frontend hasta el backend.

#### Resultado esperado
- El `idTraza` se propaga correctamente.
- Aparece en los logs del backend.
- Aparece en las respuestas de error.
- Permite rastrear una operación de extremo a extremo.
- No hay errores de propagación.

---

### 7.6 Prueba 6 — Firebase Crashlytics

**Objetivo:** Validar que Crashlytics registra crashes y errores no controlados.

#### Procedimiento
1. Integrar Firebase Crashlytics en el frontend.
2. Provocar un crash intencional (ej. acceso a propiedad de `null`).
3. Verificar que Crashlytics registra el crash.
4. Provocar un error no controlado (ej. excepción en una promesa).
5. Verificar que Crashlytics registra el error.
6. Enviar un error personalizado con `crashlytics().recordError()`.
7. Verificar que Crashlytics lo registra.

#### Resultado esperado
- Crashlytics registra crashes.
- Crashlytics registra errores no controlados.
- Crashlytics registra errores personalizados.
- La consola de Firebase muestra los errores.
- No hay errores de integración.

---

### 7.7 Prueba 7 — Firebase Analytics

**Objetivo:** Validar que Analytics registra eventos clave de usuario.

#### Procedimiento
1. Integrar Firebase Analytics en el frontend.
2. Registrar eventos clave:
   - `inicio_sesion_exitoso`, `inicio_sesion_fallido`.
   - `registro_offline_guardado`.
   - `sincronizacion_exitosa`, `sincronizacion_fallida`.
   - `resumen_consultado`.
3. Consumir la app y provocar cada evento.
4. Verificar en la consola de Firebase que los eventos se registran.
5. Verificar que los parámetros de cada evento son correctos.

#### Resultado esperado
- Analytics registra los eventos.
- Los parámetros son correctos.
- La consola de Firebase muestra los eventos.
- No hay errores de integración.

---

### 7.8 Prueba 8 — Overhead del monitoreo

**Objetivo:** Medir el overhead del monitoreo en el backend y frontend.

#### Procedimiento
1. Medir el tiempo de respuesta de los endpoints sin monitoreo.
2. Activar Actuator, Micrometer y Prometheus.
3. Medir el tiempo de respuesta de los mismos endpoints.
4. Comparar los tiempos.
5. Medir el impacto en el consumo de CPU y memoria del backend.
6. Medir el impacto en el tamaño del APK del frontend.

#### Resultado esperado
- El overhead del monitoreo es < 5 % en tiempo de respuesta.
- El impacto en CPU y memoria es < 10 %.
- El impacto en el tamaño del APK es < 2 MB.
- El monitoreo no degrada la experiencia del usuario.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Métricas**: Actuator y Micrometer exponen las métricas correctamente.
2. **Prometheus**: Prometheus hace scraping sin errores.
3. **Grafana**: Los 3 dashboards se muestran y actualizan correctamente.
4. **Alertas**: Las 3 alertas se disparan correctamente.
5. **`idTraza`**: Se propaga entre frontend y backend y permite rastrear operaciones.
6. **Crashlytics**: Registra crashes, errores no controlados y errores personalizados.
7. **Analytics**: Registra los eventos clave con parámetros correctos.
8. **Overhead**: El overhead del monitoreo es < 5 % en tiempo de respuesta.

El Spike se considerará **RECHAZADO** si:

- Las métricas no se exponen correctamente.
- Prometheus no hace scraping.
- Los dashboards de Grafana no se muestran o no se actualizan.
- Las alertas no se disparan.
- El `idTraza` no se propaga.
- Crashlytics no registra crashes o errores.
- Analytics no registra eventos.
- El overhead del monitoreo supera el 5 %.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **Métricas backend**: Spring Boot Actuator + Micrometer.
- **Almacenamiento de métricas**: Prometheus.
- **Visualización**: Grafana.
- **Alertas**: Alertmanager.
- **Logs**: SLF4J + Logback con MDC para `idTraza`.
- **Frontend**: React Native + TypeScript.
- **Crashes frontend**: Firebase Crashlytics.
- **Eventos frontend**: Firebase Analytics.
- **Debugging frontend**: React Native DevTools.
- **Infraestructura**: Docker Compose con Prometheus, Grafana y Alertmanager.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Datos de prueba**: script de generación de 20 fincas, 100 transacciones, 5 pendientes.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: La configuración de Prometheus y Grafana puede consumir demasiado tiempo.
  - **Mitigación**: Usar Docker Compose con configuraciones predefinidas. Priorizar pruebas 1, 2 y 3.

- **Riesgo**: Las alertas pueden generar falsos positivos.
  - **Mitigación**: Ajustar los umbrales después de observar el comportamiento real. Documentar los ajustes.

- **Riesgo**: El `idTraza` puede no propagarse correctamente.
  - **Mitigación**: Usar un filtro en el backend para leer el header y añadirlo al MDC. Probar con múltiples solicitudes.

- **Riesgo**: Crashlytics puede no registrarse en el plan gratuito de Firebase.
  - **Mitigación**: Verificar el plan. Crashlytics es gratuito e ilimitado.

- **Riesgo**: Analytics puede tener límites en el plan gratuito.
  - **Mitigación**: Verificar los límites. El plan gratuito permite hasta 500 eventos distintos.

- **Riesgo**: El overhead del monitoreo puede ser mayor al esperado.
  - **Mitigación**: Medir con y sin monitoreo. Ajustar la frecuencia de scraping si es necesario.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 8 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4, 5 y 6. Si el tiempo no alcanza, documentar 7 y 8 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Backend Spring Boot con Actuator, Micrometer y `idTraza`.
   - Frontend React Native con Crashlytics, Analytics y React Native DevTools.
   - `docker-compose.yml` con Prometheus, Grafana y Alertmanager.
   - `prometheus.yml` con configuración de scraping.
   - Dashboards de Grafana exportados como JSON.
   - Configuración de Alertmanager.
2. **Reporte de métricas**:
   - Overhead del monitoreo en tiempo de respuesta.
   - Impacto en CPU y memoria del backend.
   - Impacto en tamaño del APK del frontend.
   - Resultados de las pruebas de alertas.
   - Resultados de las pruebas de `idTraza`.
   - Resultados de las pruebas de Crashlytics y Analytics.
3. **Evidencia**:
   - Capturas de Grafana mostrando los dashboards.
   - Capturas de Prometheus mostrando las métricas.
   - Capturas de Alertmanager mostrando las alertas.
   - Capturas de Crashlytics mostrando los crashes.
   - Capturas de Analytics mostrando los eventos.
   - Capturas de logs con `idTraza`.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Actuator y Micrometer expusieron las métricas?
  - ✅ / ❌ ¿Prometheus hizo scraping sin errores?
  - ✅ / ❌ ¿Grafana mostró los 3 dashboards?
  - ✅ / ❌ ¿Las 3 alertas se dispararon correctamente?
  - ✅ / ❌ ¿El `idTraza` se propagó entre frontend y backend?
  - ✅ / ❌ ¿Crashlytics registró crashes y errores?
  - ✅ / ❌ ¿Analytics registró los eventos clave?
  - ✅ / ❌ ¿El overhead del monitoreo fue < 5 %?

- **Lecciones aprendidas**:
  - (Ejemplo: "El `idTraza` debe generarse en el frontend y propagarse en todas las solicitudes.")
  - (Ejemplo: "Los umbrales de alertas deben ajustarse después de observar el comportamiento real.")
  - (Ejemplo: "Grafana con dashboards predefinidos acelera la configuración.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Configurar Actuator y Micrometer desde el día 1.")
  - (Ejemplo: "Inyectar `idTraza` en todas las solicitudes.")
  - (Ejemplo: "Configurar alertas para errores críticos (fallos de sincronización, pérdida de datos, 500).")
  - (Ejemplo: "Usar Crashlytics desde la primera versión.")
  - (Ejemplo: "Migrar a Grafana Cloud o Loki si el volumen de logs crece.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)