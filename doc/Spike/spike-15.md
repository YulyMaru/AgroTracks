# SPIKE-015: Validar REST como estilo de comunicación para AgroTrack

## Información general

- **ID:** SPIKE-015
- **Nombre:** Validar REST con JSON sobre HTTPS para sincronización, consultas y autenticación
- **ADR relacionado:** ADR-015 — Usar REST como estilo de comunicación entre cliente y servidor
- **ADR complementarios:** ADR-001 (Sincronización offline con retry y backoff), ADR-007 (Garantizar idempotencia y consistencia en sync), ADR-009 (Optimizar consultas con índices y caché), ADR-011 (Bloquear acceso no autenticado con middleware), ADR-013 (Base de datos relacional SQL)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles

## 1. Objetivo

Validar técnicamente que REST con JSON sobre HTTPS es suficiente para cubrir las necesidades de comunicación de AgroTrack: sincronización offline idempotente, consultas paginadas y filtradas, autenticación con JWT y manejo de errores, sin necesidad de GraphQL, gRPC, WebSockets o SSE.

El Spike busca comprobar que el estilo REST definido en ADR-015 se integra sin fricción con el motor de sincronización (ADR-001), la cola de pendientes (ADR-005), el repositorio local (ADR-006, ADR-013) y el middleware de autenticación (ADR-011), cumpliendo con los escenarios ESC-CAL-DP-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-INT-03, ESC-CAL-RN-02, ESC-CAL-RN-04 y ESC-CAL-SEG-01.

## 2. Problema que se busca validar

AgroTrack necesita un estilo de comunicación simple, compatible con redes rurales inestables y que permita sincronización confiable. Existen riesgos de que:

- REST no sea suficiente para sincronización idempotente sin introducir duplicados.
- Las consultas paginadas no cumplan los tiempos definidos (≤ 3 s para consultas productivas, ≤ 5 s para resúmenes).
- La autenticación JWT no se integre correctamente con el interceptor de Axios y el refresco silencioso.
- El manejo de errores HTTP no sea claro para el cliente móvil.
- La falta de versionado rompa compatibilidad en el futuro.
- La ausencia de WebSockets o SSE impida algún caso de uso real (no identificado aún).
- REST no permita reducir el sobre-fetching en vistas complejas.

Por esta razón, se necesita un prototipo que implemente endpoints REST representativos, los consuma desde React Native con Axios, y mida su comportamiento en condiciones realistas.

## 3. Pregunta principal del Spike

¿REST con JSON sobre HTTPS permite implementar sincronización idempotente, consultas paginadas ≤ 3 s, resúmenes económicos ≤ 5 s, autenticación JWT con refresco silencioso y manejo de errores estructurado, sin necesidad de GraphQL, gRPC, WebSockets o SSE?

## 4. Hipótesis

Si implementamos:

- Endpoints REST versionados (`/api/v1/...`) para fincas, lotes, cultivos, transacciones y sincronización.
- Sincronización con `POST /api/v1/sync/transactions` que verifica `localId` para idempotencia.
- Paginación con `?page=1&size=20` y filtros por fecha, tipo, finca, lote y cultivo.
- Autenticación con JWT en header `Authorization: Bearer <token>`.
- Interceptor en Axios para inyectar token y manejar 401 con refresco silencioso.
- Manejo de errores con códigos HTTP estándar y cuerpo estructurado (`code`, `message`, `details`).
- Documentación con OpenAPI/Swagger.

Entonces:

- La sincronización será idempotente: N reintentos con el mismo `localId` generarán 1 solo registro.
- Las consultas paginadas cumplirán ≤ 3 s para 10,000 transacciones.
- Los resúmenes económicos cumplirán ≤ 5 s para 10,000 transacciones.
- La autenticación JWT funcionará con refresco silencioso sin interrumpir al usuario.
- Los errores HTTP serán interpretados correctamente por el cliente.
- El versionado permitirá evolucionar la API sin romper compatibilidad.
- No se necesitarán GraphQL, gRPC, WebSockets ni SSE.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Implementación de un backend mock con Spring Boot que exponga endpoints REST representativos:
  - `POST /api/v1/auth/login` (autenticación).
  - `POST /api/v1/auth/refresh` (refresco de token).
  - `GET /api/v1/farms` (listado paginado).
  - `GET /api/v1/lots?farmId=...` (listado filtrado).
  - `GET /api/v1/crops?lotId=...` (listado filtrado).
  - `GET /api/v1/transactions?page=1&size=20&type=EXPENSE&from=...&to=...` (listado paginado y filtrado).
  - `GET /api/v1/summary?from=...&to=...&farmId=...&cropId=...` (resumen económico agregado).
  - `POST /api/v1/sync/transactions` (sincronización idempotente con `localId`).
- Cliente móvil en React Native con Axios que consuma los endpoints.
- Interceptor de Axios para inyectar token y manejar 401 con refresco silencioso.
- Simulación de errores HTTP (400, 401, 403, 404, 409, 500, 503).
- Pruebas de idempotencia: 5 reintentos con el mismo `localId` → 1 registro.
- Pruebas de paginación y filtros.
- Pruebas de rendimiento con 10,000 transacciones (mock o base de datos real).
- Pruebas de autenticación: login, token expirado, refresco exitoso, refresco fallido.
- Documentación OpenAPI/Swagger.

### 5.2 No incluye

El Spike no implementará:

- La interfaz definitiva de la aplicación (solo pantallas de prueba).
- El modelo de datos completo de AgroTrack (solo transacciones y entidades mínimas).
- La lógica completa de sincronización (solo el endpoint y su idempotencia).
- GraphQL, gRPC, WebSockets o SSE (explícitamente descartados).
- Pruebas en iOS (solo Android).
- Seguridad avanzada más allá de JWT (se evaluará en ADR-022).
- Versionado semántico completo (solo prefijo `/api/v1/`).
- Pruebas de carga con más de 10,000 transacciones.

## 6. Caso de prueba principal

**Endpoints a validar:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Autentica y devuelve access token + refresh token |
| POST | `/api/v1/auth/refresh` | Refresca el access token |
| GET | `/api/v1/farms?page=1&size=20` | Lista fincas paginadas |
| GET | `/api/v1/lots?farmId=...&page=1&size=20` | Lista lotes por finca |
| GET | `/api/v1/crops?lotId=...&page=1&size=20` | Lista cultivos por lote |
| GET | `/api/v1/transactions?page=1&size=20&type=EXPENSE&from=...&to=...` | Lista transacciones filtradas |
| GET | `/api/v1/summary?from=...&to=...&farmId=...&cropId=...` | Resumen económico agregado |
| POST | `/api/v1/sync/transactions` | Sincroniza transacciones con `localId` |

**Datos de prueba:**

- 500 fincas.
- 2,000 lotes.
- 50 cultivos.
- 10,000 transacciones (5,000 ingresos, 5,000 gastos).
- Usuario mock autenticado.

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Autenticación JWT y refresco silencioso

**Objetivo:** Validar que el login, el uso del token y el refresco silencioso funcionan correctamente.

#### Procedimiento
1. Consumir `POST /api/v1/auth/login` con credenciales válidas.
2. Verificar que se recibe access token y refresh token.
3. Consumir un endpoint protegido (`GET /api/v1/farms`) con el token en el header.
4. Simular token expirado (401) en el backend mock.
5. Verificar que el interceptor de Axios detecta el 401 y llama a `POST /api/v1/auth/refresh`.
6. Verificar que la solicitud original se reintenta con el nuevo token.
7. Simular fallo en el refresco (refresh token inválido) y verificar que se redirige a login.

#### Resultado esperado
- Login exitoso con tokens.
- Endpoints protegidos accesibles con token válido.
- Refresco silencioso funcional sin interrupción para el usuario.
- Redirección a login si el refresco falla.
- Sin múltiples solicitudes de refresco simultáneas.

---

### 7.2 Prueba 2 — Sincronización idempotente con `localId`

**Objetivo:** Validar que los reintentos con el mismo `localId` no generan duplicados.

#### Procedimiento
1. Consumir `POST /api/v1/sync/transactions` con una transacción y `localId = "abc-123"`.
2. Verificar que el backend crea 1 registro.
3. Reintentar 5 veces la misma solicitud con el mismo `localId`.
4. Verificar que el backend devuelve la misma respuesta y no crea nuevos registros.
5. Consultar el backend y verificar que solo existe 1 registro con ese `localId`.

#### Resultado esperado
- El backend crea exactamente 1 registro.
- Los reintentos devuelven la misma respuesta.
- No hay duplicados.
- El estado local pasa a `SYNCED` una sola vez.

---

### 7.3 Prueba 3 — Consultas paginadas y filtradas

**Objetivo:** Medir el tiempo de respuesta de consultas REST con paginación y filtros.

#### Procedimiento
1. Consumir `GET /api/v1/transactions?page=1&size=20&type=EXPENSE&from=...&to=...` con 10,000 transacciones.
2. Medir el tiempo desde la solicitud hasta la respuesta.
3. Repetir con diferentes páginas y filtros.
4. Medir también `GET /api/v1/farms`, `GET /api/v1/lots`, `GET /api/v1/crops`.
5. Repetir 3 veces y promediar.

#### Resultado esperado
- Consultas productivas (fincas, lotes, cultivos): ≤ 3 s.
- Listados de transacciones con paginación: ≤ 2 s por página.
- Los filtros se aplican correctamente.
- La respuesta incluye metadatos de paginación (`page`, `size`, `total`).

---

### 7.4 Prueba 4 — Resumen económico agregado

**Objetivo:** Medir el tiempo de respuesta del endpoint de resumen económico.

#### Procedimiento
1. Consumir `GET /api/v1/summary?from=...&to=...&farmId=...&cropId=...` con 10,000 transacciones.
2. Medir el tiempo desde la solicitud hasta la respuesta.
3. Repetir con diferentes períodos y filtros.
4. Repetir 3 veces y promediar.

#### Resultado esperado
- Resumen económico: ≤ 5 s.
- Los cálculos son correctos (ingresos, gastos, resultado).
- La respuesta incluye los datos necesarios para las tarjetas (ADR-003).

---

### 7.5 Prueba 5 — Manejo de errores HTTP

**Objetivo:** Validar que el cliente interpreta correctamente los errores HTTP.

#### Procedimiento
1. Forzar respuestas de error en el backend mock: 400, 401, 403, 404, 409, 500, 503.
2. Consumir endpoints desde el cliente móvil.
3. Verificar que el cliente muestra mensajes claros y accionables.
4. Verificar que los errores 401 disparan el refresco o redirección a login.
5. Verificar que los errores 500/503 se reintentan según la política de retry (ADR-001).

#### Resultado esperado
- El cliente interpreta correctamente cada código.
- Los mensajes son claros y no técnicos.
- Los errores transitorios se reintentan.
- Los errores de autenticación redirigen a login.

---

### 7.6 Prueba 6 — Documentación OpenAPI

**Objetivo:** Validar que la documentación OpenAPI se genera correctamente y es útil para el equipo móvil.

#### Procedimiento
1. Configurar SpringDoc para generar OpenAPI.
2. Acceder a `/swagger-ui.html` y `/v3/api-docs`.
3. Verificar que todos los endpoints están documentados.
4. Verificar que los esquemas de request/response son correctos.
5. Generar un cliente TypeScript a partir de OpenAPI y verificar que compila.

#### Resultado esperado
- OpenAPI se genera sin errores.
- Todos los endpoints están documentados.
- El cliente generado compila y es utilizable.
- El equipo móvil puede usar la documentación para integrarse.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Autenticación**: Login, uso de token y refresco silencioso funcionan correctamente.
2. **Idempotencia**: 5 reintentos con el mismo `localId` generan exactamente 1 registro.
3. **Consultas productivas**: ≤ 3 s para fincas, lotes y cultivos con 10,000 registros.
4. **Resumen económico**: ≤ 5 s con 10,000 transacciones.
5. **Manejo de errores**: El cliente interpreta correctamente los códigos HTTP y muestra mensajes claros.
6. **Documentación**: OpenAPI se genera sin errores y es útil para el equipo.
7. **Sin estilos alternativos**: No se necesita GraphQL, gRPC, WebSockets ni SSE para cumplir los casos de uso.

El Spike se considerará **RECHAZADO** si:

- La sincronización genera duplicados.
- Las consultas productivas superan los 3 s.
- El resumen económico supera los 5 s.
- El refresco silencioso falla o interrumpe al usuario.
- El cliente no interpreta correctamente los errores HTTP.
- OpenAPI no se genera o es incorrecto.
- Se identifica un caso de uso que requiere GraphQL, gRPC, WebSockets o SSE.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **Base de datos**: PostgreSQL 15+ (con datos de prueba) o H2 en memoria para simplificar.
- **Documentación**: SpringDoc OpenAPI.
- **Autenticación**: JWT con access token y refresh token.
- **Cliente móvil**: React Native + TypeScript + Axios.
- **Interceptor**: Axios interceptors para token y 401.
- **Medición**: Postman, JMeter o k6 para medir tiempos de respuesta; logs del backend; React Native Debugger.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Datos de prueba**: script de generación de 10,000 transacciones, 500 fincas, 2,000 lotes, 50 cultivos.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: El backend mock puede no reflejar fielmente el comportamiento del backend real.
  - **Mitigación**: Documentar las diferencias y ajustar el mock para simular latencia y errores.

- **Riesgo**: El refresco silencioso puede disparar múltiples solicitudes simultáneas.
  - **Mitigación**: Implementar una cola de solicitudes durante el refresco para que solo una solicitud de refresco se ejecute a la vez.

- **Riesgo**: Las consultas paginadas pueden ser lentas si no se indexan correctamente.
  - **Mitigación**: Crear índices en PostgreSQL para los campos de filtro y ordenamiento.

- **Riesgo**: El resumen económico puede ser lento si no se optimiza.
  - **Mitigación**: Usar agregaciones en servidor (SUM, GROUP BY) y caché (Redis o Caffeine).

- **Riesgo**: La documentación OpenAPI puede no generarse correctamente.
  - **Mitigación**: Configurar SpringDoc desde el inicio y validar con Swagger UI.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 6 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3 y 5. Si el tiempo no alcanza, documentar 4 y 6 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Backend Spring Boot con endpoints REST.
   - Documentación OpenAPI.
   - Cliente React Native con Axios e interceptor.
   - Script de generación de datos de prueba.
2. **Reporte de métricas**:
   - Tiempos de respuesta de consultas y resumen.
   - Resultados de las pruebas de idempotencia.
   - Resultados de las pruebas de autenticación y refresco.
   - Resultados del manejo de errores.
3. **Evidencia**:
   - Capturas o video del flujo completo.
   - Capturas de Swagger UI.
   - Logs del backend mostrando idempotencia y refresco.
   - Capturas del cliente mostrando mensajes de error.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿La autenticación JWT y el refresco silencioso funcionaron?
  - ✅ / ❌ ¿La sincronización idempotente generó 1 solo registro tras 5 reintentos?
  - ✅ / ❌ ¿Las consultas productivas cumplieron ≤ 3 s?
  - ✅ / ❌ ¿El resumen económico cumplió ≤ 5 s?
  - ✅ / ❌ ¿El manejo de errores HTTP fue correcto?
  - ✅ / ❌ ¿OpenAPI se generó correctamente?
  - ✅ / ❌ ¿Se confirmó que no se necesitan GraphQL, gRPC, WebSockets ni SSE?

- **Lecciones aprendidas**:
  - (Ejemplo: "El interceptor de Axios debe manejar el refresco de forma atómica para evitar múltiples solicitudes simultáneas.")
  - (Ejemplo: "Los endpoints de sincronización deben verificar `localId` antes de insertar para garantizar idempotencia.")
  - (Ejemplo: "La paginación con `page` y `size` es suficiente; no se necesita cursor-based pagination para este volumen.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Definir los endpoints REST desde el inicio con OpenAPI.")
  - (Ejemplo: "Usar versionado en la URL (`/api/v1/`).")
  - (Ejemplo: "Diseñar endpoints idempotentes para sincronización.")
  - (Ejemplo: "No introducir GraphQL ni WebSockets sin un caso de uso claro.")
  - (Ejemplo: "Mantener las respuestas JSON simples y paginadas.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)