# SPIKE-013: Validar SQLite local y réplica de esquema relacional

## Información general

- **ID:** SPIKE-013
- **Nombre:** Validar SQLite local, transacciones ACID y réplica del esquema relacional
- **ADR relacionado:** ADR-013 — Usar base de datos relacional SQL para backend y almacenamiento local
- **ADR complementarios:** ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-006 (Consultar datos offline y detectar conectividad), ADR-007 (Garantizar idempotencia y consistencia en sync), ADR-009 (Optimizar consultas con índices y caché)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 4 días hábiles 

## 1. Objetivo

Validar técnicamente que SQLite en el cliente móvil puede replicar fielmente el esquema relacional del backend (PostgreSQL), soportar transacciones ACID, mantener integridad referencial, y ejecutar consultas agregadas y de listado dentro de los tiempos definidos, cumpliendo con los escenarios ESC-CAL-DP-01, ESC-CAL-DP-02, ESC-CAL-DP-06, ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05, ESC-CAL-RN-04 y ESC-CAL-ESC-01.

El Spike busca comprobar que la estrategia de persistencia SQL relacional (PostgreSQL + SQLite) definida en ADR-013 es viable antes de implementar el modelo de datos completo de AgroTrack.

## 2. Problema que se busca validar

AgroTrack debe almacenar localmente información relacional (fincas, lotes, cultivos, transacciones) y sincronizarla con el backend. Existen riesgos de que:

- SQLite local no soporte el volumen de datos esperado (10,000 transacciones) con tiempos aceptables.
- Las transacciones ACID no funcionen correctamente en React Native (cierre abrupto, concurrencia).
- La integridad referencial se rompa al sincronizar datos parciales.
- El esquema local no pueda replicar fielmente el esquema remoto.
- Las migraciones locales fallen y dejen la base en un estado inconsistente.
- Las consultas agregadas (sumas, agrupaciones) sean lentas en dispositivos de gama baja.
- La idempotencia no se pueda garantizar con restricciones únicas locales.

Por esta razón, se necesita un prototipo que implemente el esquema relacional en SQLite, ejecute transacciones, consultas y migraciones, y mida su comportamiento en condiciones realistas.

## 3. Pregunta principal del Spike

¿SQLite en React Native puede replicar el esquema relacional de PostgreSQL, soportar transacciones ACID, mantener integridad referencial, ejecutar consultas agregadas ≤ 2 s para 100 registros y ≤ 5 s para 10,000 registros, y aplicar migraciones versionadas sin corromper la base?

## 4. Hipótesis

Si implementamos:

- Un esquema relacional local con entidades para fincas, lotes, cultivos, transacciones, operaciones pendientes y control de migraciones.
- Foreign keys activadas para garantizar integridad referencial.
- Transacciones ACID al insertar, actualizar y eliminar.
- Índices en campos de filtro y ordenamiento frecuentes (usuario, fecha, tipo, estado).
- Una restricción única sobre el identificador local de cada operación para garantizar idempotencia.
- Un mecanismo de migraciones versionadas.

Entonces:

- El 100 % de las transacciones ACID se completarán o revertirán correctamente.
- La integridad referencial se mantendrá en el 100 % de las operaciones.
- Las consultas de listado (100 registros) se completarán en ≤ 2 s.
- Las consultas agregadas (10,000 registros) se completarán en ≤ 5 s.
- Las migraciones se aplicarán sin corromper la base.
- La idempotencia se garantizará con el identificador único local.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Diseño conceptual del esquema relacional local (sin implementar el modelo de datos definitivo de AgroTrack).
- Entidades mínimas a modelar: fincas, lotes, cultivos, transacciones, operaciones pendientes y control de versiones de esquema.
- Relaciones entre entidades (finca → lotes → cultivos → transacciones).
- Activación de foreign keys y restricciones únicas.
- Implementación de un mecanismo de migraciones versionadas.
- Generación de datos de prueba: 500 fincas, 2,000 lotes, 10,000 transacciones.
- Transacciones ACID: insertar una finca, un lote, un cultivo y una transacción en una sola operación atómica.
- Pruebas de rollback ante fallo simulado.
- Consultas de listado: fincas, lotes, cultivos y transacciones (con paginación).
- Consultas agregadas: resumen económico por período, por finca y por cultivo.
- Medición de tiempos con 100, 1,000 y 10,000 registros.
- Pruebas de idempotencia con identificador único local.
- Pruebas de migración de una versión a otra sin pérdida de datos.
- Pruebas de corrupción: cierre abrupto durante una transacción.

### 5.2 No incluye

El Spike no implementará:

- El modelo de datos definitivo de AgroTrack (solo las entidades mínimas para validar).
- La definición de columnas, tipos de datos, nombres finales ni restricciones definitivas.
- Sincronización real con PostgreSQL (se usará un mock).
- La interfaz definitiva de la aplicación (solo pantallas de prueba).
- Optimización avanzada de rendimiento (solo índices básicos).
- Resolución de conflictos entre datos locales y remotos.
- Cifrado de SQLite (se evaluará en ADR-022).
- Pruebas en iOS (solo Android).
- Scripts SQL ni código de creación de tablas (se definirán en la implementación posterior).

## 6. Caso de prueba principal

**Entidades conceptuales a validar:**

- **Fincas**: identificador, usuario asociado, nombre, fechas de creación y actualización.
- **Lotes**: identificador, finca asociada, nombre, área, unidad de medida, fechas de auditoría.
- **Cultivos**: identificador, lote asociado, nombre, fechas de auditoría.
- **Transacciones**: identificador, identificador único local, usuario, finca/lote/cultivo asociados, tipo (ingreso/gasto), monto, descripción, fecha, fechas de auditoría.
- **Operaciones pendientes**: identificador único local, tipo de operación, payload, estado, contador de reintentos, fechas.
- **Control de migraciones**: versión del esquema.

**Relaciones a validar:**

- Una finca tiene muchos lotes.
- Un lote tiene muchos cultivos.
- Un cultivo puede tener muchas transacciones.
- Una transacción puede asociarse a finca, lote o cultivo (opcionalmente).
- Una operación pendiente referencia una transacción por identificador único local.

**Datos de prueba:**

- 500 fincas.
- 2,000 lotes.
- 10,000 transacciones (5,000 ingresos, 5,000 gastos).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Creación de esquema y migraciones

**Objetivo:** Validar que el esquema se crea correctamente y que las migraciones versionadas funcionan sin pérdida de datos.

#### Procedimiento
1. Inicializar la base con versión de esquema inicial.
2. Aplicar la primera migración (crear entidades).
3. Verificar que la versión del esquema se actualiza correctamente.
4. Insertar datos de prueba (fincas y transacciones).
5. Aplicar una segunda migración (añadir un nuevo campo a transacciones, por ejemplo una nota).
6. Verificar que la versión del esquema se actualiza.
7. Verificar que los datos previos siguen intactos.

#### Resultado esperado
- Las migraciones se aplican correctamente.
- Los datos previos se conservan.
- No hay corrupción de la base.
- La versión del esquema refleja el estado correcto.

---

### 7.2 Prueba 2 — Transacciones ACID

**Objetivo:** Validar que las transacciones ACID se completan o revierten correctamente.

#### Procedimiento
1. Iniciar una transacción que inserte una finca, un lote, un cultivo y una transacción.
2. Simular un fallo antes de confirmar la transacción (ej. error en la inserción del cultivo).
3. Verificar que ninguna de las inserciones previas quedó en la base.
4. Repetir sin fallo y verificar que las 4 inserciones se completan.

#### Resultado esperado
- Ante fallo: rollback completo, 0 registros insertados.
- Sin fallo: confirmación exitosa, 4 registros insertados.
- La integridad referencial se mantiene.

---

### 7.3 Prueba 3 — Integridad referencial

**Objetivo:** Validar que las relaciones entre entidades y las restricciones únicas funcionan.

#### Procedimiento
1. Intentar insertar un lote asociado a una finca inexistente.
2. Verificar que la inserción es rechazada.
3. Insertar una finca, luego un lote, luego un cultivo, luego una transacción.
4. Eliminar la finca y verificar que los lotes, cultivos y transacciones asociadas se eliminan o actualizan según la política definida.
5. Intentar insertar dos transacciones con el mismo identificador único local.
6. Verificar que la segunda es rechazada.

#### Resultado esperado
- Las inserciones con referencia inválida son rechazadas.
- Las eliminaciones en cascada funcionan según la política definida.
- La restricción única sobre el identificador local impide duplicados.

---

### 7.4 Prueba 4 — Consultas de listado con paginación

**Objetivo:** Medir el tiempo de consulta de listados con diferentes volúmenes de datos.

#### Procedimiento
1. Cargar 500 fincas, 2,000 lotes y 10,000 transacciones.
2. Ejecutar consultas de listado con paginación (20 registros por página):
   - Listar fincas.
   - Listar lotes por finca.
   - Listar cultivos por lote.
   - Listar transacciones por usuario y período.
3. Medir tiempos con 100, 1,000 y 10,000 registros.
4. Repetir 3 veces y promediar.

#### Resultado esperado
- Listados de 100 registros: ≤ 2 s.
- Listados de 10,000 registros con paginación: ≤ 2 s.
- La interfaz no se congela durante la consulta.

---

### 7.5 Prueba 5 — Consultas agregadas

**Objetivo:** Medir el tiempo de consultas agregadas (resúmenes económicos).

#### Procedimiento
1. Ejecutar consultas agregadas:
   - Suma de ingresos y gastos por período.
   - Suma por finca.
   - Suma por cultivo.
   - Conteo de transacciones por tipo.
2. Medir tiempos con 100, 1,000 y 10,000 registros.
3. Repetir 3 veces y promediar.

#### Resultado esperado
- Agregaciones sobre 10,000 registros: ≤ 5 s.
- Agregaciones sobre 100 registros: ≤ 2 s.
- Los índices se utilizan correctamente (verificar con el plan de ejecución de la base).

---

### 7.6 Prueba 6 — Corrupción ante cierre abrupto

**Objetivo:** Validar que la base no se corrompe si la app se cierra durante una transacción.

#### Procedimiento
1. Iniciar una transacción que inserte 100 transacciones.
2. Simular cierre abrupto de la app a mitad de la transacción.
3. Reabrir la app y verificar el estado de la base.
4. Ejecutar la verificación de integridad de la base.

#### Resultado esperado
- La base no se corrompe.
- Las transacciones no confirmadas se revierten.
- La verificación de integridad devuelve un resultado exitoso.

---

### 7.7 Prueba 7 — Idempotencia con identificador único local

**Objetivo:** Validar que la restricción única sobre el identificador local impide duplicados.

#### Procedimiento
1. Insertar una transacción con un identificador único local.
2. Intentar insertar otra transacción con el mismo identificador único local.
3. Verificar que la segunda es rechazada.
4. Simular 5 reintentos de sincronización con el mismo identificador.
5. Verificar que solo existe 1 registro.

#### Resultado esperado
- La restricción única funciona.
- Solo existe 1 registro por identificador único local.
- Los reintentos no generan duplicados.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Esquema y migraciones**: El esquema se crea correctamente y las migraciones se aplican sin pérdida de datos.
2. **Transacciones ACID**: El 100 % de las transacciones se completan o revierten correctamente.
3. **Integridad referencial**: Las referencias entre entidades y las restricciones únicas funcionan en el 100 % de los casos.
4. **Listados**: ≤ 2 s para 100 registros y ≤ 2 s para 10,000 registros con paginación.
5. **Agregaciones**: ≤ 2 s para 100 registros y ≤ 5 s para 10,000 registros.
6. **Integridad**: La verificación de integridad devuelve resultado exitoso tras cierre abrupto.
7. **Idempotencia**: La restricción única sobre el identificador local impide duplicados en el 100 % de los reintentos.

El Spike se considerará **RECHAZADO** si:

- Alguna migración falla o pierde datos.
- Alguna transacción ACID deja datos parciales.
- La integridad referencial se rompe.
- Los listados superan los 2 s para 100 registros.
- Las agregaciones superan los 5 s para 10,000 registros.
- La base se corrompe ante cierre abrupto.
- La idempotencia falla y se crean duplicados.

## 9. Entorno técnico del spike

- **Cliente móvil**: React Native + TypeScript.
- **Base de datos local**: SQLite mediante una librería compatible con React Native.
- **Dispositivo de prueba**: Android gama baja (Samsung Galaxy A12 o similar, RAM 4 GB), gama media (Xiaomi Redmi Note 10) y gama alta (Samsung Galaxy S22).
- **Generación de datos**: script en Node.js que produce los datos de prueba en formato JSON.
- **Medición**: herramientas de perfilado de React Native, temporizadores de alto rendimiento y el plan de ejecución de consultas de la base de datos.
- **Backend mock**: no se usa backend real; la sincronización se simula con logs.
- **Pruebas de cierre abrupto**: forzar el cierre del proceso de la app desde Android.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: La librería de SQLite para React Native puede tener problemas de rendimiento con 10,000 registros.
  - **Mitigación**: Probar con al menos dos librerías disponibles. Si el rendimiento es insuficiente, documentar y ajustar el volumen máximo.

- **Riesgo**: Las transacciones ACID pueden no funcionar correctamente en React Native por problemas de concurrencia.
  - **Mitigación**: Usar una sola conexión y serializar las operaciones. Probar con inserciones concurrentes.

- **Riesgo**: Las migraciones pueden fallar si la base ya tiene datos.
  - **Mitigación**: Probar la migración con datos cargados. Ejecutar cada migración dentro de una transacción.

- **Riesgo**: El cierre abrupto puede corromper la base.
  - **Mitigación**: Activar el modo de journaling adecuado y el nivel de sincronización apropiado. Probar la verificación de integridad tras el cierre.

- **Riesgo**: Los índices pueden no usarse si las consultas no están bien escritas.
  - **Mitigación**: Usar el plan de ejecución de consultas para verificar el uso de índices. Ajustar las consultas si es necesario.

- **Riesgo**: El timebox de 4 días puede ser insuficiente para las 7 pruebas.
  - **Mitigación**: Priorizar las pruebas 1, 2, 3, 4 y 7. Si el tiempo no alcanza, documentar 5 y 6 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Diseño conceptual del esquema relacional local.
   - Mecanismo de migraciones versionadas.
   - Script de generación de datos de prueba.
   - Consultas de listado y agregadas.
   - Pruebas de transacciones ACID, integridad e idempotencia.
2. **Reporte de métricas**:
   - Tiempos de listados y agregaciones con 100, 1,000 y 10,000 registros.
   - Resultados de la verificación de integridad.
   - Uso de índices (plan de ejecución).
   - Resultados de las pruebas de idempotencia.
3. **Evidencia**:
   - Capturas o video del flujo completo.
   - Logs de la base mostrando transacciones y rollbacks.
   - Capturas del plan de ejecución antes y después de índices.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El esquema se creó y las migraciones funcionaron?
  - ✅ / ❌ ¿Las transacciones ACID se completaron o revirtieron correctamente?
  - ✅ / ❌ ¿La integridad referencial se mantuvo?
  - ✅ / ❌ ¿Los listados cumplieron ≤ 2 s para 100 registros?
  - ✅ / ❌ ¿Las agregaciones cumplieron ≤ 5 s para 10,000 registros?
  - ✅ / ❌ ¿La base sobrevivió al cierre abrupto sin corromperse?
  - ✅ / ❌ ¿La idempotencia con identificador único local impidió duplicados?

- **Lecciones aprendidas**:
  - (Ejemplo: "El modo de journaling WAL es más resistente a cierres abruptos que el modo por defecto.")
  - (Ejemplo: "Los índices compuestos en usuario, fecha y tipo son esenciales para las agregaciones.")
  - (Ejemplo: "Las migraciones deben ejecutarse dentro de una transacción para evitar estados inconsistentes.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Usar una librería de SQLite optimizada para React Native.")
  - (Ejemplo: "Definir el esquema completo y las migraciones desde el día 1.")
  - (Ejemplo: "Añadir índices en estado y fecha de creación para la cola de pendientes.")
  - (Ejemplo: "Implementar un proceso de archivado de transacciones antiguas (> 2 años).")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)