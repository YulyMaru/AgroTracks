# SPIKE-019: Validar migraciones versionadas en Flyway y SQLite local

## Información general

- **ID:** SPIKE-019
- **Nombre:** Validar migraciones versionadas automáticas en backend (Flyway) y cliente móvil (SQLite)
- **ADR relacionado:** ADR-019 — Versionar el esquema de base de datos con migraciones automáticas
- **ADR complementarios:** ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-006 (Consultar datos offline y detectar conectividad), ADR-013 (Base de datos relacional SQL), ADR-016 (Usar Spring Boot 3 con Java 17 como stack del backend), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil), ADR-018 (Usar monolito modular por capas con arquitectura offline-first y patrón Repository)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles

## 1. Objetivo

Validar técnicamente que Flyway en el backend (Spring Boot + PostgreSQL) y un mecanismo versionado con `PRAGMA user_version` en el cliente móvil (React Native + SQLite) permiten evolucionar el esquema de base de datos de forma reproducible, trazable, atómica y sin pérdida de datos, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-06, ESC-CAL-CF-03, ESC-CAL-CF-05 y ESC-CAL-ESC-01.

El Spike busca comprobar que la estrategia de migraciones versionadas seleccionada en ADR-019 es viable tanto en backend como en cliente móvil, y que ambos esquemas pueden evolucionar de forma consistente sin afectar la sincronización offline.

## 2. Problema que se busca validar

AgroTrack necesita evolucionar su esquema de base de datos a medida que se añaden nuevas funcionalidades, pero existen riesgos de que:

- Las migraciones fallen y dejen la base en un estado inconsistente.
- Se pierdan datos al aplicar cambios de esquema.
- Las migraciones no sean reproducibles entre entornos (desarrollo, pruebas, producción).
- El esquema local (SQLite) y el remoto (PostgreSQL) se desincronicen.
- Las migraciones locales fallen en el móvil y corrompan la base.
- El usuario pierda datos al actualizar la aplicación.
- No haya trazabilidad de qué cambios se aplicaron y cuándo.
- Las migraciones bloqueen el arranque de la app o del backend.

Por esta razón, se necesita un prototipo que implemente al menos dos migraciones versionadas en backend y frontend, y valide su comportamiento en escenarios realistas.

## 3. Pregunta principal del Spike

¿Flyway en el backend y `PRAGMA user_version` en SQLite local permiten aplicar migraciones versionadas de forma reproducible, atómica y sin pérdida de datos, manteniendo consistencia entre esquema local y remoto, y sin bloquear el arranque de la aplicación?

## 4. Hipótesis

Si implementamos:

- **Backend (Flyway)**:
  - Migraciones `V1__inicial.sql` (crear tablas) y `V2__agregar_notas.sql` (añadir columna).
  - Configuración de Flyway en `application.yml`.
  - `ddl-auto=validate` en Hibernate.
  - Historial en `flyway_schema_history`.
- **Cliente móvil (SQLite)**:
  - `PRAGMA user_version` para rastrear la versión del esquema.
  - Migración local v1 (crear tablas) y v2 (añadir columna).
  - Cada migración dentro de una transacción.
  - Ejecución de migraciones al arrancar la app.

Entonces:

- Las migraciones se aplicarán en orden y sin errores.
- Los datos existentes se conservarán tras cada migración.
- Si una migración falla, se revertirá completamente.
- El historial de migraciones será visible en `flyway_schema_history` y `PRAGMA user_version`.
- El esquema local y remoto mantendrán consistencia.
- El arranque de la app y del backend no se bloqueará más de lo aceptable.
- Se podrán añadir nuevas migraciones sin afectar las existentes.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Backend (Spring Boot + Flyway)**:
  - Proyecto Spring Boot 3 con PostgreSQL 15+.
  - Dependencias: `flyway-core`, `flyway-database-postgresql`.
  - Migración `V1__inicial.sql`: crear tablas `fincas`, `lotes`, `cultivos`, `transacciones`, `usuarios`.
  - Migración `V2__agregar_notas_a_transacciones.sql`: añadir columna `notas` a `transacciones`.
  - Migración `V3__agregar_indice_a_transacciones.sql`: añadir índice compuesto.
  - Configuración de Flyway en `application.yml`.
  - `ddl-auto=validate` en Hibernate.
  - Pruebas de aplicación de migraciones en entorno limpio y con datos.
  - Pruebas de rollback ante migración fallida.
  - Pruebas de reproducibilidad entre entornos.
- **Cliente móvil (React Native + SQLite)**:
  - Mecanismo de migraciones con `PRAGMA user_version`.
  - Migración local v1: crear tablas `fincas`, `transacciones`, `operaciones_pendientes`.
  - Migración local v2: añadir columna `notas` a `transacciones`.
  - Migración local v3: añadir índice a `transacciones`.
  - Ejecución de migraciones al arrancar la app, dentro de una transacción.
  - Pruebas de aplicación de migraciones en app limpia y con datos.
  - Pruebas de rollback ante migración fallida.
  - Pruebas de persistencia tras cerrar y reabrir la app.
- **Consistencia local-remoto**:
  - Comparación de esquemas entre backend y frontend.
  - Verificación de que los cambios se aplican de forma paralela.
- **Métricas**:
  - Tiempo de aplicación de cada migración.
  - Número de migraciones aplicadas.
  - Resultado de las pruebas de rollback.
  - Tamaño del historial de migraciones.

### 5.2 No incluye

El Spike no implementará:

- El modelo de datos completo de AgroTrack (solo tablas mínimas).
- La lógica completa de sincronización (solo la estructura de esquema).
- La interfaz definitiva de la aplicación (solo pantallas mínimas).
- Migraciones de datos complejas (solo cambios de esquema).
- Migraciones que requieran downtime prolongado.
- Pruebas en iOS (solo Android).
- Publicación en Google Play ni despliegue en producción.
- Migraciones con cambios incompatibles (breaking changes).
- Pruebas de migración con más de 10,000 registros.

## 6. Caso de prueba principal

**Migraciones a implementar:**

### Backend (Flyway)

| Versión | Descripción | Cambio |
|---------|-------------|--------|
| V1 | `inicial` | Crear tablas `usuarios`, `fincas`, `lotes`, `cultivos`, `transacciones` |
| V2 | `agregar_notas_a_transacciones` | Añadir columna `notas TEXT` a `transacciones` |
| V3 | `agregar_indice_a_transacciones` | Añadir índice compuesto `(id_usuario, fecha, tipo)` |

### Cliente móvil (SQLite)

| Versión | Descripción | Cambio |
|---------|-------------|--------|
| v1 | `inicial` | Crear tablas `fincas`, `transacciones`, `operaciones_pendientes` |
| v2 | `agregar_notas_a_transacciones` | Añadir columna `notas TEXT` a `transacciones` |
| v3 | `agregar_indice_a_transacciones` | Añadir índice `idx_transacciones_usuario_fecha_tipo` |

**Datos de prueba:**

- 20 fincas.
- 100 transacciones (50 ingresos, 50 gastos).
- 5 operaciones pendientes.

**Escenarios:**

1. **Entorno limpio**: aplicar todas las migraciones desde cero.
2. **Entorno con datos**: aplicar migraciones con datos existentes.
3. **Migración fallida**: simular un error en una migración y verificar rollback.
4. **Persistencia**: cerrar y reabrir la app tras migrar.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Migraciones en entorno limpio (backend)

**Objetivo:** Validar que Flyway aplica todas las migraciones desde cero en un entorno limpio.

#### Procedimiento
1. Crear una base de datos PostgreSQL vacía.
2. Arrancar la aplicación Spring Boot.
3. Verificar que Flyway aplica `V1`, `V2` y `V3` en orden.
4. Consultar `flyway_schema_history` y verificar las versiones aplicadas.
5. Verificar que las tablas, columnas e índices existen.

#### Resultado esperado
- Flyway aplica las 3 migraciones sin errores.
- `flyway_schema_history` registra las 3 versiones.
- Las tablas, columnas e índices existen.
- El arranque no supera los 10 s.

---

### 7.2 Prueba 2 — Migraciones con datos existentes (backend)

**Objetivo:** Validar que Flyway aplica migraciones sin pérdida de datos cuando ya existen datos.

#### Procedimiento
1. Aplicar solo `V1` en una base limpia.
2. Insertar 20 fincas y 100 transacciones.
3. Aplicar `V2` (añadir columna `notas`).
4. Verificar que los datos existentes se conservan.
5. Aplicar `V3` (añadir índice).
6. Verificar que los datos siguen intactos y que el índice se usa.

#### Resultado esperado
- Los datos existentes se conservan tras cada migración.
- La columna `notas` se añade con valor `NULL` por defecto.
- El índice se crea correctamente.
- No hay pérdida de datos.

---

### 7.3 Prueba 3 — Migración fallida y rollback (backend)

**Objetivo:** Validar que si una migración falla, se revierte completamente.

#### Procedimiento
1. Crear una migración `V4__migracion_fallida.sql` con un error intencional (ej. tabla inexistente).
2. Arrancar la aplicación.
3. Verificar que Flyway falla y detiene el arranque.
4. Verificar que la base queda en el estado de `V3`.
5. Consultar `flyway_schema_history` y verificar que `V4` no se registró.

#### Resultado esperado
- Flyway falla y detiene el arranque.
- La base queda en el estado de `V3`.
- `V4` no se registra en el historial.
- No hay estados intermedios inconsistentes.

---

### 7.4 Prueba 4 — Reproducibilidad entre entornos (backend)

**Objetivo:** Validar que las migraciones son reproducibles entre entornos.

#### Procedimiento
1. Aplicar migraciones en una base de desarrollo.
2. Exportar el esquema resultante.
3. Aplicar las mismas migraciones en una base de pruebas.
4. Exportar el esquema resultante.
5. Comparar ambos esquemas (tablas, columnas, índices, constraints).

#### Resultado esperado
- Los esquemas son idénticos.
- No hay diferencias entre entornos.
- Las migraciones son reproducibles.

---

### 7.5 Prueba 5 — Migraciones en entorno limpio (frontend)

**Objetivo:** Validar que el mecanismo de migraciones en SQLite aplica todas las migraciones desde cero.

#### Procedimiento
1. Instalar la app en un dispositivo limpio (sin base de datos local).
2. Arrancar la app.
3. Verificar que las migraciones v1, v2 y v3 se aplican en orden.
4. Consultar `PRAGMA user_version` y verificar que es 3.
5. Verificar que las tablas, columnas e índices existen.

#### Resultado esperado
- Las 3 migraciones se aplican sin errores.
- `PRAGMA user_version` es 3.
- Las tablas, columnas e índices existen.
- El arranque no supera los 2 s.

---

### 7.6 Prueba 6 — Migraciones con datos existentes (frontend)

**Objetivo:** Validar que las migraciones locales no pierden datos.

#### Procedimiento
1. Instalar la app con solo la migración v1.
2. Insertar 20 fincas y 100 transacciones.
3. Actualizar la app para que incluya v2 y v3.
4. Arrancar la app.
5. Verificar que las migraciones v2 y v3 se aplican.
6. Verificar que los datos existentes se conservan.

#### Resultado esperado
- Los datos existentes se conservan.
- La columna `notas` se añade con valor `NULL`.
- El índice se crea correctamente.
- `PRAGMA user_version` es 3.

---

### 7.7 Prueba 7 — Migración fallida y rollback (frontend)

**Objetivo:** Validar que si una migración local falla, se revierte completamente.

#### Procedimiento
1. Crear una migración v4 con un error intencional.
2. Arrancar la app con la base en v3.
3. Verificar que la migración v4 falla y se revierte.
4. Verificar que la base queda en v3.
5. Verificar que la app sigue funcionando (sin bloquearse).

#### Resultado esperado
- La migración v4 falla y se revierte.
- La base queda en v3.
- La app no se bloquea; muestra un mensaje de error.
- Los datos existentes se conservan.

---

### 7.8 Prueba 8 — Persistencia tras cerrar y reabrir la app (frontend)

**Objetivo:** Validar que las migraciones se aplican una sola vez y que los datos persisten.

#### Procedimiento
1. Instalar la app y aplicar las migraciones v1, v2 y v3.
2. Insertar 20 fincas y 100 transacciones.
3. Cerrar completamente la app.
4. Reabrir la app.
5. Verificar que no se re-aplican las migraciones.
6. Verificar que los datos persisten.

#### Resultado esperado
- Las migraciones no se re-aplican (idempotencia).
- `PRAGMA user_version` sigue siendo 3.
- Los datos persisten.
- El arranque es rápido (no re-ejecuta migraciones).

---

### 7.9 Prueba 9 — Consistencia entre esquema local y remoto

**Objetivo:** Validar que el esquema local y el remoto mantienen consistencia.

#### Procedimiento
1. Aplicar las migraciones en backend y frontend.
2. Comparar los esquemas: tablas, columnas, tipos, índices.
3. Verificar que las entidades que existen en ambos lados coinciden.
4. Verificar que no hay discrepancias que afecten la sincronización.

#### Resultado esperado
- Los esquemas son consistentes en las entidades compartidas.
- No hay discrepancias que afecten la sincronización.
- Las migraciones se planificaron en conjunto.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Entorno limpio (backend)**: Flyway aplica las 3 migraciones sin errores.
2. **Con datos (backend)**: Las migraciones no pierden datos.
3. **Rollback (backend)**: Una migración fallida se revierte completamente.
4. **Reproducibilidad (backend)**: Los esquemas son idénticos entre entornos.
5. **Entorno limpio (frontend)**: Las 3 migraciones locales se aplican sin errores.
6. **Con datos (frontend)**: Las migraciones locales no pierden datos.
7. **Rollback (frontend)**: Una migración local fallida se revierte.
8. **Persistencia (frontend)**: Las migraciones no se re-aplican tras cerrar y reabrir la app.
9. **Consistencia**: Los esquemas local y remoto son consistentes en entidades compartidas.

El Spike se considerará **RECHAZADO** si:

- Alguna migración falla y deja la base inconsistente.
- Se pierden datos en alguna migración.
- El rollback no funciona.
- Los esquemas no son reproducibles entre entornos.
- Las migraciones locales se re-aplican tras cerrar la app.
- Hay discrepancias entre esquema local y remoto que afecten la sincronización.
- La app se bloquea al aplicar migraciones.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **Base de datos backend**: PostgreSQL 15+ (local o en contenedor Docker).
- **Migraciones backend**: Flyway Community.
- **Persistencia backend**: Spring Data JPA + Hibernate con `ddl-auto=validate`.
- **Cliente móvil**: React Native + TypeScript.
- **Base de datos local**: SQLite con `@op-engineering/op-sqlite`.
- **Migraciones locales**: `PRAGMA user_version` + transacciones.
- **Pruebas backend**: JUnit 5, Spring Boot Test, Testcontainers.
- **Pruebas frontend**: Jest, React Native Testing Library.
- **Medición**: `console.time`, logs, `EXPLAIN ANALYZE` en PostgreSQL.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Flyway puede fallar si la base ya tiene tablas sin historial.
  - **Mitigación**: Usar `flyway.baseline-on-migrate=true` para entornos existentes.

- **Riesgo**: Las migraciones de PostgreSQL con DDL pueden no ser transaccionales en algunos casos.
  - **Mitigación**: Verificar que cada migración sea atómica. Documentar limitaciones.

- **Riesgo**: Las migraciones locales en SQLite pueden corromper la base si fallan.
  - **Mitigación**: Ejecutar cada migración dentro de una transacción. Probar rollback.

- **Riesgo**: Las migraciones locales pueden tardar demasiado en dispositivos de gama baja.
  - **Mitigación**: Medir el tiempo de cada migración. Mantenerlas pequeñas y atómicas.

- **Riesgo**: La app puede bloquearse mientras se aplican las migraciones.
  - **Mitigación**: Mostrar pantalla de carga. Aplicar migraciones antes de renderizar la UI.

- **Riesgo**: Los esquemas local y remoto pueden desincronizarse.
  - **Mitigación**: Planificar las migraciones en conjunto. Documentar el changelog.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 9 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 5, 6 y 7. Si el tiempo no alcanza, documentar 4, 8 y 9 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Backend Spring Boot con Flyway y 3 migraciones.
   - Frontend React Native con mecanismo de migraciones locales y 3 migraciones.
   - Scripts de prueba de migraciones.
   - Documentación del changelog de migraciones.
2. **Reporte de métricas**:
   - Tiempo de aplicación de cada migración (backend y frontend).
   - Resultado de las pruebas de rollback.
   - Resultado de las pruebas de reproducibilidad.
   - Resultado de las pruebas de persistencia.
   - Comparación de esquemas local y remoto.
3. **Evidencia**:
   - Capturas de `flyway_schema_history`.
   - Capturas de `PRAGMA user_version`.
   - Capturas de las migraciones aplicándose.
   - Capturas de rollback exitoso.
   - Capturas de la app tras migrar.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Flyway aplicó las 3 migraciones en entorno limpio?
  - ✅ / ❌ ¿Las migraciones del backend no perdieron datos?
  - ✅ / ❌ ¿El rollback del backend funcionó?
  - ✅ / ❌ ¿Los esquemas del backend fueron reproducibles?
  - ✅ / ❌ ¿Las 3 migraciones locales se aplicaron sin errores?
  - ✅ / ❌ ¿Las migraciones locales no perdieron datos?
  - ✅ / ❌ ¿El rollback local funcionó?
  - ✅ / ❌ ¿Las migraciones locales no se re-aplicaron tras cerrar la app?
  - ✅ / ❌ ¿Los esquemas local y remoto fueron consistentes?

- **Lecciones aprendidas**:
  - (Ejemplo: "Flyway con `baseline-on-migrate=true` es útil si la base ya tiene tablas.")
  - (Ejemplo: "Las migraciones locales en SQLite deben ejecutarse dentro de una transacción para evitar corrupción.")
  - (Ejemplo: "Mantener las migraciones pequeñas y atómicas facilita el rollback y la depuración.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Definir la estrategia de migraciones desde el día 1.")
  - (Ejemplo: "Planificar las migraciones locales y remotas en conjunto.")
  - (Ejemplo: "Probar cada migración en un entorno limpio y en uno con datos.")
  - (Ejemplo: "Documentar el changelog de migraciones.")
  - (Ejemplo: "No usar `ddl-auto=update` en producción; usar `validate`.")
  - (Ejemplo: "Mostrar pantalla de carga mientras se aplican migraciones locales.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)