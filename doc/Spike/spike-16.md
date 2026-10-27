# SPIKE-016: Validar Spring Boot 3 con PostgreSQL, Flyway, Spring Security y JWT

## Información general

- **ID:** SPIKE-016
- **Nombre:** Validar stack backend Spring Boot 3 con PostgreSQL, Flyway, Spring Security y JWT
- **ADR relacionado:** ADR-016 — Usar Spring Boot 3 con Java 17 como stack del backend
- **ADR complementarios:** ADR-011 (Bloquear acceso no autenticado con middleware), ADR-013 (Base de datos relacional SQL), ADR-015 (Usar REST como estilo de comunicación), ADR-007 (Garantizar idempotencia y consistencia en sync), ADR-009 (Optimizar consultas con índices y caché)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 4 días hábiles

## 1. Objetivo

Validar técnicamente que Spring Boot 3 con Java 17, PostgreSQL 15+, Flyway, Spring Security + JWT, Spring Data JPA y SpringDoc OpenAPI cubre todos los requisitos funcionales y no funcionales del backend de AgroTrack, incluyendo transacciones ACID, idempotencia en sincronización, seguridad JWT, migraciones versionadas, documentación OpenAPI y rendimiento dentro de los umbrales definidos.

El Spike busca comprobar que el stack seleccionado en ADR-016 es viable antes de implementar el backend completo de AgroTrack.

## 2. Problema que se busca validar

AgroTrack requiere un backend robusto que soporte transacciones ACID, sincronización idempotente, seguridad JWT y consultas optimizadas. Existen riesgos de que:

- Spring Boot 3 no se integre correctamente con PostgreSQL 15+ en el entorno de despliegue previsto.
- Las transacciones ACID fallen en escenarios de concurrencia o errores parciales.
- Spring Security + JWT no maneje correctamente la expiración y el refresco de tokens.
- Flyway falle al aplicar migraciones en una base con datos existentes.
- SpringDoc no genere documentación OpenAPI correcta y utilizable.
- El rendimiento no cumpla los umbrales definidos (≤ 3 s consultas productivas, ≤ 5 s resúmenes).
- La configuración inicial del proyecto consuma demasiado tiempo del timebox.
- La curva de aprendizaje de Spring Security ralentice al equipo.

Por esta razón, se necesita un prototipo que implemente el stack completo con endpoints representativos, seguridad JWT, migraciones y consultas optimizadas, y mida su comportamiento en condiciones realistas.

## 3. Pregunta principal del Spike

¿Spring Boot 3 con PostgreSQL 15+, Flyway, Spring Security + JWT, Spring Data JPA y SpringDoc OpenAPI permite implementar transacciones ACID, sincronización idempotente, autenticación JWT con refresco, migraciones versionadas, documentación OpenAPI y consultas dentro de los umbrales definidos (≤ 3 s y ≤ 5 s), sin requerir infraestructura adicional?

## 4. Hipótesis

Si implementamos:

- Proyecto Spring Boot 3 con Java 17.
- PostgreSQL 15+ como base de datos.
- Flyway para migraciones versionadas.
- Spring Data JPA + Hibernate para persistencia.
- Spring Security + JWT con access token y refresh token.
- SpringDoc OpenAPI para documentación.
- Endpoints REST representativos: autenticación, fincas, lotes, cultivos, transacciones, sincronización y resumen.
- Manejo de errores con `@ControllerAdvice` y respuestas estructuradas.
- Transacciones declarativas con `@Transactional`.
- Verificación de `idLocal` para idempotencia.
- Índices en PostgreSQL para consultas y agregaciones.

Entonces:

- Las transacciones ACID se completarán o revertirán correctamente en el 100 % de los casos.
- La sincronización será idempotente: 5 reintentos con el mismo `idLocal` generarán 1 solo registro.
- La autenticación JWT funcionará con refresco silencioso.
- Flyway aplicará migraciones sin pérdida de datos.
- SpringDoc generará OpenAPI correcta y utilizable.
- Las consultas productivas cumplirán ≤ 3 s y los resúmenes ≤ 5 s con 10,000 transacciones.
- No se requerirá infraestructura adicional más allá de PostgreSQL y Redis.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Configuración inicial del proyecto Spring Boot 3 con Java 17 y Maven.
- Integración con PostgreSQL 15+ (local o en contenedor).
- Configuración de Flyway con al menos 2 migraciones versionadas.
- Configuración de Spring Security con JWT (access token + refresh token).
- Endpoints REST representativos:
  - `POST /api/v1/autenticacion/inicio-sesion`.
  - `POST /api/v1/autenticacion/renovacion`.
  - `GET /api/v1/fincas` (paginado).
  - `GET /api/v1/lotes?idFinca=...` (filtrado).
  - `GET /api/v1/cultivos?idLote=...` (filtrado).
  - `GET /api/v1/transacciones?pagina=1&limite=20&type=...&desde=...&hasta=...` (paginado y filtrado).
  - `GET /api/v1/resumen?desde=...&hasta=...&idFinca=...` (agregado).
  - `POST /api/v1/sincronizacion/transacciones` (idempotente con `idLocal`).
- Manejo de errores con `@ControllerAdvice`.
- Transacciones declarativas con `@Transactional`.
- Verificación de `idLocal` para idempotencia.
- Índices en PostgreSQL para consultas y agregaciones.
- Documentación con SpringDoc OpenAPI.
- Datos de prueba: 10,000 transacciones, 500 fincas, 2,000 lotes, 50 cultivos.
- Medición de tiempos de respuesta y comportamiento de transacciones.
- Pruebas de integración con Spring Boot Test.
- Pruebas con Testcontainers para PostgreSQL real.

### 5.2 No incluye

El Spike no implementará:

- El modelo de datos completo de AgroTrack (solo entidades mínimas).
- La interfaz definitiva de la aplicación (solo endpoints REST).
- La lógica completa de sincronización (solo el endpoint y su idempotencia).
- Redis para caché (se valida en el SPIKE-009).
- Pruebas en producción (solo entorno local o de staging).
- Seguridad avanzada más allá de JWT (se evaluará en ADR-022).
- Versionado semántico completo (solo prefijo `/api/v1/`).
- Pruebas de carga con más de 10,000 transacciones.
- Migración de datos históricos.

## 6. Caso de prueba principal

**Endpoints a validar:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/autenticacion/inicio-sesion` | Autentica y devuelve access token + refresh token |
| POST | `/api/v1/autenticacion/renovacion` | Refresca el access token |
| GET | `/api/v1/fincas?pagina=1&limite=20` | Lista fincas paginadas |
| GET | `/api/v1/lotes?idFinca=...&pagina=1&limite=20` | Lista lotes por finca |
| GET | `/api/v1/cultivos?idLote=...&pagina=1&limite=20` | Lista cultivos por lote |
| GET | `/api/v1/transacciones?pagina=1&limite=20&type=EXPENSE&desde=...&hasta=...` | Lista transacciones filtradas |
| GET | `/api/v1/resumen?desde=...&hasta=...&idFinca=...` | Resumen económico agregado |
| POST | `/api/v1/sincronizacion/transacciones` | Sincroniza transacciones con `idLocal` |

**Datos de prueba:**

- 500 fincas.
- 2,000 lotes.
- 50 cultivos.
- 10,000 transacciones (5,000 ingresos, 5,000 gastos).
- Usuario mock autenticado.

**Entorno:**

- PostgreSQL 15+ (local o en contenedor Docker).
- Redis (opcional, solo si el tiempo lo permite).
- Java 17, Maven, Spring Boot 3.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Configuración inicial y migraciones con Flyway

**Objetivo:** Validar que el proyecto Spring Boot 3 se configura correctamente y que Flyway aplica migraciones sin errores.

#### Procedimiento
1. Crear el proyecto Spring Boot 3 con las dependencias necesarias (Web, JPA, Security, Flyway, PostgreSQL, Validation, SpringDoc).
2. Configurar la conexión a PostgreSQL en `application.yml`.
3. Crear la primera migración Flyway (crear tablas: `usuarios`, `fincas`, `lotes`, `cultivos`, `transacciones`, `operaciones_pendientes`).
4. Ejecutar la aplicación y verificar que Flyway aplica la migración.
5. Insertar datos de prueba.
6. Crear una segunda migración (añadir columna `notas` a `transacciones`).
7. Reiniciar la aplicación y verificar que Flyway aplica la migración sin pérdida de datos.

#### Resultado esperado
- El proyecto arranca sin errores.
- Flyway aplica las migraciones correctamente.
- Los datos previos se conservan tras la segunda migración.
- La tabla `flyway_schema_history` refleja las versiones aplicadas.

---

### 7.2 Prueba 2 — Transacciones ACID

**Objetivo:** Validar que las transacciones declarativas de Spring funcionan correctamente.

#### Procedimiento
1. Implementar un servicio con `@Transactional` que inserte una finca, un lote, un cultivo y una transacción en una sola operación.
2. Simular un fallo antes del commit (ej. lanzar una excepción en la inserción del cultivo).
3. Verificar que ninguna de las inserciones previas quedó en la base.
4. Repetir sin fallo y verificar que las 4 inserciones se completan.
5. Probar con concurrencia: 10 hilos insertando simultáneamente.

#### Resultado esperado
- Ante fallo: rollback completo, 0 registros insertados.
- Sin fallo: commit exitoso, 4 registros insertados.
- La integridad referencial se mantiene.
- La concurrencia no genera condiciones de carrera.

---

### 7.3 Prueba 3 — Autenticación JWT y refresco silencioso

**Objetivo:** Validar que Spring Security + JWT funciona con access token y refresh token.

#### Procedimiento
1. Consumir `POST /api/v1/autenticacion/inicio-sesion` con credenciales válidas.
2. Verificar que se recibe access token y refresh token.
3. Consumir un endpoint protegido con el token en el header `Authorization: Bearer <token>`.
4. Simular token expirado y consumir un endpoint protegido.
5. Verificar que el backend devuelve 401.
6. Consumir `POST /api/v1/autenticacion/renovacion` con el refresh token y verificar que se obtiene un nuevo access token.
7. Simular refresh token inválido y verificar que el backend devuelve 401.

#### Resultado esperado
- Login exitoso con tokens.
- Endpoints protegidos accesibles con token válido.
- Token expirado devuelve 401.
- Refresco exitoso devuelve nuevo access token.
- Refresh token inválido devuelve 401.
- Los endpoints públicos (login, refresh) son accesibles sin token.

---

### 7.4 Prueba 4 — Sincronización idempotente con `idLocal`

**Objetivo:** Validar que la verificación de `idLocal` impide duplicados.

#### Procedimiento
1. Consumir `POST /api/v1/sincronizacion/transacciones` con una transacción y `idLocal = "abc-123"`.
2. Verificar que el backend crea 1 registro.
3. Reintentar 5 veces la misma solicitud con el mismo `idLocal`.
4. Verificar que el backend devuelve la misma respuesta y no crea nuevos registros.
5. Consultar la base de datos y verificar que solo existe 1 registro con ese `idLocal`.

#### Resultado esperado
- El backend crea exactamente 1 registro.
- Los reintentos devuelven la misma respuesta (mismo código HTTP, mismo cuerpo).
- No hay duplicados.
- La restricción única en `idLocal` se respeta.

---

### 7.5 Prueba 5 — Consultas productivas con paginación y filtros

**Objetivo:** Medir el tiempo de respuesta de consultas productivas.

#### Procedimiento
1. Consumir `GET /api/v1/fincas?pagina=1&limite=20` con 500 fincas.
2. Consumir `GET /api/v1/lotes?idFinca=...&pagina=1&limite=20` con 2,000 lotes.
3. Consumir `GET /api/v1/cultivos?idLote=...&pagina=1&limite=20` con 50 cultivos.
4. Consumir `GET /api/v1/transacciones?pagina=1&limite=20&type=EXPENSE&desde=...&hasta=...` con 10,000 transacciones.
5. Medir tiempos con Postman, JMeter o k6.
6. Repetir 3 veces y promediar.

#### Resultado esperado
- Consultas productivas (fincas, lotes, cultivos): ≤ 3 s.
- Listados de transacciones con paginación: ≤ 2 s por página.
- Los filtros se aplican correctamente.
- La respuesta incluye metadatos de paginación (`pagina`, `limite`, `total`).

---

### 7.6 Prueba 6 — Resumen económico agregado

**Objetivo:** Medir el tiempo de respuesta del endpoint de resumen económico.

#### Procedimiento
1. Consumir `GET /api/v1/resumen?desde=...&hasta=...&idFinca=...` con 10,000 transacciones.
2. Medir el tiempo desde la solicitud hasta la respuesta.
3. Repetir con diferentes períodos y filtros.
4. Repetir 3 veces y promediar.
5. Verificar que los cálculos son correctos (ingresos, gastos, resultado).

#### Resultado esperado
- Resumen económico: ≤ 5 s.
- Los cálculos son correctos.
- La respuesta incluye los datos necesarios para las tarjetas (ADR-003).
- Los índices se utilizan correctamente (verificar con `EXPLAIN ANALYZE`).

---

### 7.7 Prueba 7 — Documentación OpenAPI con SpringDoc

**Objetivo:** Validar que SpringDoc genera documentación OpenAPI correcta y utilizable.

#### Procedimiento
1. Configurar SpringDoc en el proyecto.
2. Acceder a `/swagger-ui.html` y `/v3/api-docs`.
3. Verificar que todos los endpoints están documentados.
4. Verificar que los esquemas de request/response son correctos.
5. Generar un cliente TypeScript a partir de OpenAPI y verificar que compila.

#### Resultado esperado
- OpenAPI se genera sin errores.
- Todos los endpoints están documentados.
- Los esquemas son correctos.
- El cliente generado compila y es utilizable.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Configuración y migraciones**: El proyecto arranca correctamente y Flyway aplica migraciones sin pérdida de datos.
2. **Transacciones ACID**: El 100 % de las transacciones se completan o revierten correctamente.
3. **Autenticación JWT**: Login, uso de token y refresco funcionan correctamente.
4. **Idempotencia**: 5 reintentos con el mismo `idLocal` generan exactamente 1 registro.
5. **Consultas productivas**: ≤ 3 s para fincas, lotes y cultivos con 10,000 registros.
6. **Resumen económico**: ≤ 5 s con 10,000 transacciones.
7. **Documentación OpenAPI**: Se genera correctamente y es utilizable.

El Spike se considerará **RECHAZADO** si:

- Flyway falla o pierde datos en las migraciones.
- Alguna transacción ACID deja datos parciales.
- La autenticación JWT falla en login, uso o refresco.
- La sincronización genera duplicados.
- Las consultas productivas superan los 3 s.
- El resumen económico supera los 5 s.
- SpringDoc no genera documentación correcta.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **Build**: Maven.
- **Base de datos**: PostgreSQL 15+ (local o en contenedor Docker).
- **Migraciones**: Flyway.
- **Persistencia**: Spring Data JPA + Hibernate.
- **Seguridad**: Spring Security + JWT (access token + refresh token).
- **Documentación**: SpringDoc OpenAPI.
- **Validación**: esquema JSON compartido (ADR-002) con `json-schema-validator`; Jakarta Validation (Bean Validation) para la estructura de los DTO.
- **Manejo de errores**: `@ControllerAdvice`.
- **Pruebas**: JUnit 5, Mockito, Spring Boot Test, Testcontainers.
- **Medición**: Postman, JMeter o k6; `EXPLAIN ANALYZE` en PostgreSQL.
- **Datos de prueba**: script de generación de 10,000 transacciones, 500 fincas, 2,000 lotes, 50 cultivos.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: La configuración inicial de Spring Security puede consumir demasiado tiempo.
  - **Mitigación**: Usar una plantilla de configuración conocida y ajustarla. Priorizar pruebas 1, 2 y 3.

- **Riesgo**: Flyway puede fallar si la base ya tiene tablas.
  - **Mitigación**: Usar `flyway.clean` en el entorno de pruebas. Documentar el procedimiento para producción.

- **Riesgo**: Las transacciones ACID pueden fallar en concurrencia.
  - **Mitigación**: Usar `@Transactional` con el nivel de aislamiento adecuado. Probar con 10 hilos concurrentes.

- **Riesgo**: El refresco de JWT puede no funcionar correctamente.
  - **Mitigación**: Implementar `TokenRenovacionProvider` y validar con pruebas de expiración.

- **Riesgo**: SpringDoc puede no documentar correctamente los endpoints.
  - **Mitigación**: Usar anotaciones `@Operation`, `@ApiResponse` y validar con Swagger UI.

- **Riesgo**: El timebox de 4 días puede ser insuficiente para las 7 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4 y 5. Si el tiempo no alcanza, documentar 6 y 7 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Proyecto Spring Boot 3 configurado.
   - Migraciones Flyway.
   - Endpoints REST representativos.
   - Configuración de Spring Security + JWT.
   - Manejo de errores con `@ControllerAdvice`.
   - Verificación de `idLocal` para idempotencia.
   - Documentación OpenAPI con SpringDoc.
   - Script de generación de datos de prueba.
2. **Reporte de métricas**:
   - Tiempos de respuesta de consultas y resumen.
   - Resultados de las pruebas de idempotencia.
   - Resultados de las pruebas de autenticación y refresco.
   - Resultados de las pruebas de transacciones ACID.
   - `EXPLAIN ANALYZE` de consultas críticas.
3. **Evidencia**:
   - Capturas de Swagger UI.
   - Logs del backend mostrando migraciones, transacciones e idempotencia.
   - Capturas de Postman o JMeter mostrando tiempos.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El proyecto arrancó y Flyway aplicó migraciones sin pérdida de datos?
  - ✅ / ❌ ¿Las transacciones ACID se completaron o revirtieron correctamente?
  - ✅ / ❌ ¿La autenticación JWT y el refresco funcionaron?
  - ✅ / ❌ ¿La sincronización idempotente generó 1 solo registro tras 5 reintentos?
  - ✅ / ❌ ¿Las consultas productivas cumplieron ≤ 3 s?
  - ✅ / ❌ ¿El resumen económico cumplió ≤ 5 s?
  - ✅ / ❌ ¿SpringDoc generó OpenAPI correcta?

- **Lecciones aprendidas**:
  - (Ejemplo: "Spring Security requiere configuración explícita para permitir endpoints públicos como login y refresh.")
  - (Ejemplo: "Flyway con `baseline-on-migrate` es útil si la base ya tiene tablas.")
  - (Ejemplo: "Las transacciones declarativas con `@Transactional` simplifican enormemente el manejo de ACID.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Definir la estructura modular por dominio desde el día 1.")
  - (Ejemplo: "Usar Testcontainers para validar PostgreSQL real en las pruebas.")
  - (Ejemplo: "Configurar Spring Boot Actuator y Micrometer para monitoreo.")
  - (Ejemplo: "Aprovechar SpringDoc para generar el cliente TypeScript del frontend.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)