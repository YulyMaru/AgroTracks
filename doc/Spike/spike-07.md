# SPIKE-007: Validar consistencia, idempotencia e interrupciones

## Información general

- **ID:** SPIKE-007
- **Nombre:** Validar consistencia de cálculos, sincronización idempotente y conservación ante interrupción
- **ADR relacionado:** ADR-007 — Garantizar idempotencia y consistencia en sync
- **ADR complementarios:** ADR-001 (Implementar sincronización offline con retry y backoff), ADR-005 (Registrar offline con SQLite y cola de pendientes), ADR-006 (Consultar datos offline y detectar conectividad)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 4 días hábiles (32 horas hombre)

## 1. Objetivo

Validar técnicamente que AgroTrack puede garantizar tres comportamientos críticos en la sincronización offline:

1. **Consistencia de cálculos**: al modificar un gasto o ingreso, los cálculos económicos posteriores reflejan el valor actualizado.
2. **Idempotencia**: los reintentos de sincronización con el mismo `localId` no generan registros duplicados en el backend.
3. **Conservación ante interrupción**: los registros no confirmados permanecen en estado `PENDING` si la conexión se interrumpe antes de recibir confirmación.

El Spike busca comprobar que estos tres comportamientos se cumplen de forma integrada, cumpliendo con los escenarios ESC-CAL-CF-03, ESC-CAL-CF-04, ESC-CAL-CF-05 y ESC-CAL-INT-03, antes de implementar la funcionalidad completa.

## 2. Problema que se busca validar

AgroTrack depende de la sincronización confiable para que los datos económicos sean correctos, pero existen riesgos de que:

- Los cálculos económicos muestren datos obsoletos después de modificar un registro.
- Los reintentos de sincronización (parte del ADR-001) generen duplicados en el backend.
- Los registros no confirmados se marquen como sincronizados antes de tiempo.
- Una interrupción de conexión a mitad de la sincronización cause pérdida de datos.
- El usuario vea resultados incorrectos y tome decisiones equivocadas.

Por esta razón, se necesita una prueba técnica que demuestre que la estrategia de idempotencia, consistencia y conservación funciona antes de implementarla en producción.

## 3. Pregunta principal del Spike

¿El sistema actualiza correctamente los cálculos tras modificar un dato, los reintentos de sincronización con el mismo `localId` generan exactamente 1 registro en el backend, y los registros no confirmados permanecen en estado `PENDING` ante una interrupción de conexión?

## 4. Hipótesis

Si implementamos:

- **Servicios de cálculo centralizados** que siempre leen de la fuente de datos actualizada.
- **`localId` (UUID)** generado en el cliente y enviado en cada reintento.
- **Backend con verificación de `localId`** como clave de idempotencia.
- **Cola persistente** que conserva registros en `PENDING` hasta recibir confirmación explícita.

Entonces:

- El 100 % de los cálculos posteriores a una modificación reflejarán el valor actualizado.
- Después de N reintentos con el mismo `localId`, existirá exactamente 1 registro en el backend.
- El 100 % de los registros no confirmados permanecerá en `PENDING` tras una interrupción.
- El registro solo pasará a `SYNCED` tras recibir confirmación del servidor.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Servicios de cálculo centralizados para ingresos y gastos.
- Invalidación de caché al modificar un registro.
- Generación de `localId` (UUID) en el cliente.
- Endpoint mock en el backend con verificación de `localId`.
- Cola persistente (SQLite) que conserva registros en `PENDING`.
- Simulación de reintentos (5 veces con el mismo `localId`).
- Simulación de interrupción de conexión a mitad de la sincronización.
- Medición de tiempos y conteo de registros creados.

### 5.2 No incluye

El Spike no implementará:

- Todos los tipos de operaciones de AgroTrack (solo gastos e ingresos).
- Sincronización real con el backend (se usará un mock).
- Resolución de conflictos entre versiones offline y online.
- Versionado de registros.
- Sistema completo de autenticación (se usará un usuario mock).
- Optimización de rendimiento para grandes volúmenes.
- Interfaz definitiva de la aplicación (solo pantallas de prueba).

## 6. Caso de prueba principal

Se utilizarán operaciones de gasto e ingreso para comprobar los tres comportamientos.

**Datos de prueba:**

- **Gasto inicial**: $100.000 COP, descripción "Compra de fertilizante", `localId = "abc-123"`.
- **Modificación**: el mismo gasto cambia a $50.000 COP.
- **Escenario de interrupción**: gasto de $30.000 COP con conexión inestable.

**Escenarios:**

1. **Consistencia**: registrar gasto → consultar resultado → modificar → consultar nuevamente.
2. **Idempotencia**: registrar gasto con `localId` → simular 5 reintentos → verificar 1 registro.
3. **Interrupción**: registrar gasto → iniciar sync → cortar conexión → verificar `PENDING`.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Consistencia de cálculos

**Objetivo:** Validar que los cálculos económicos se actualizan después de modificar un registro.

#### Procedimiento
1. Registrar un gasto de $100.000 COP.
2. Consultar el resultado económico (debe mostrar -$100.000).
3. Modificar el gasto a $50.000 COP.
4. Consultar el resultado económico nuevamente.
5. Repetir con un ingreso: registrar $200.000, modificar a $150.000, consultar.

#### Resultado esperado
- El primer cálculo muestra -$100.000.
- Después de la modificación, el cálculo muestra -$50.000.
- Con el ingreso: el primer cálculo muestra +$200.000, después +$150.000.
- No hay valores obsoletos en caché.

---

### 7.2 Prueba 2 — Idempotencia ante reintentos

**Objetivo:** Validar que los reintentos con el mismo `localId` no generan duplicados en el backend.

#### Procedimiento
1. Registrar un gasto offline con `localId = "abc-123"`.
2. Simular 5 reintentos de sincronización con el mismo `localId`.
3. Consultar el backend mock.
4. Verificar la cantidad de registros creados.

#### Resultado esperado
- El backend crea **exactamente 1 registro** correspondiente al `localId = "abc-123"`.
- En los reintentos 2 a 5, el backend devuelve la misma respuesta sin crear nuevos registros.
- El estado local pasa a `SYNCED` una sola vez.
- No hay duplicación en los cálculos económicos.

---

### 7.3 Prueba 3 — Conservación ante interrupción de conexión

**Objetivo:** Validar que los registros no confirmados permanecen en `PENDING` si la conexión se interrumpe.

#### Procedimiento
1. Registrar un gasto offline.
2. Iniciar la sincronización (mock).
3. Simular pérdida de conexión antes de recibir la confirmación del backend.
4. Observar el estado del registro.
5. Reactivar la conexión.
6. Verificar que el sistema reintenta y sincroniza.

#### Resultado esperado
- El registro permanece en `PENDING` tras la interrupción.
- No se marca como `SYNCED` sin confirmación.
- Al reconectar, el sistema reintenta y sincroniza correctamente.
- No hay pérdida ni duplicación.

---

### 7.4 Prueba 4 — Consistencia + Idempotencia + Interrupción combinadas

**Objetivo:** Validar que los tres comportamientos funcionan de forma integrada en un flujo realista.

#### Procedimiento
1. Registrar 3 gastos offline con `localId` distintos.
2. Modificar uno de ellos localmente.
3. Iniciar sincronización.
4. Simular interrupción después del primer envío.
5. Reactivar conexión y permitir que el sistema reintente.
6. Consultar los cálculos económicos y verificar el backend.

#### Resultado esperado
- Los 3 registros llegan al backend sin duplicarse.
- El registro modificado refleja el valor actualizado.
- Los cálculos económicos son consistentes con los datos finales.
- No hay pérdida ni duplicación.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Consistencia de cálculos**: El 100 % de las modificaciones se reflejan en los cálculos posteriores.
2. **Idempotencia**: Después de 5 reintentos con el mismo `localId`, existe exactamente 1 registro en el backend.
3. **Conservación ante interrupción**: El 100 % de los registros no confirmados permanece en `PENDING`.
4. **Integración**: Los tres comportamientos funcionan juntos en el flujo combinado (Prueba 4).
5. **Sin pérdida**: No se pierde ningún registro durante las pruebas.

El Spike se considerará **RECHAZADO** si:

- Algún cálculo posterior a una modificación muestra el valor obsoleto.
- Los reintentos generan más de 1 registro en el backend.
- Algún registro se marca como `SYNCED` sin confirmación del servidor.
- Se pierde algún registro durante una interrupción.
- Los cálculos económicos finales no coinciden con los datos del backend.

## 9. Entorno técnico del spike

Para la ejecución de este Spike, se utilizará el siguiente stack:

- **Cliente móvil**: React Native o Flutter (el que use AgroTrack).
- **Base de datos local**: SQLite (con `react-native-sqlite-storage` o `sqflite`).
- **Servicios de cálculo**: Funciones puras centralizadas (`calculateEconomicResult(transactions)`).
- **Generación de UUID**: `react-native-uuid` o equivalente.
- **Backend mock**: Endpoint REST que simula la verificación de `localId` y devuelve respuestas predefinidas (éxito, error, timeout).
- **Simulación de interrupciones**: Interruptor manual para cortar la conexión a mitad del envío.
- **Medición**: Logs de tiempo y conteo de registros creados.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: El backend mock puede no reflejar fielmente el comportamiento del backend real.
  - **Mitigación**: Documentar las diferencias y ajustar el mock para simular también errores de red y latencia.

- **Riesgo**: La invalidación de caché puede olvidarse en algún punto del flujo.
  - **Mitigación**: Implementar la invalidación como parte del servicio centralizado, no en cada pantalla.

- **Riesgo**: La cola persistente puede corromperse si el dispositivo se apaga durante una escritura.
  - **Mitigación**: Usar transacciones de SQLite. Probar el escenario de apagado abrupto.

- **Riesgo**: Los reintentos con el mismo `localId` pueden tardar demasiado si el backoff está mal configurado.
  - **Mitigación**: Configurar backoff con límites máximos (≤ 10 intentos en el primer minuto).

- **Riesgo**: La simulación de interrupción puede no ser realista si no se prueba en dispositivo físico.
  - **Mitigación**: Probar también en dispositivo físico con modo avión y conexión inestable.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Servicios de cálculo centralizados.
   - Generación de `localId` (UUID).
   - Endpoint mock con verificación de idempotencia.
   - Cola persistente con estado `PENDING`/`SYNCED`.
   - Simulación de interrupciones.
2. **Reporte de pruebas**:
   - Resultados de las 4 pruebas.
   - Conteo de registros creados en el backend tras los reintentos.
   - Estados de los registros tras las interrupciones.
   - Tiempos de sincronización.
3. **Evidencia**:
   - Capturas o video del flujo completo.
   - Logs del backend mostrando la verificación de `localId`.
   - Logs de SQLite mostrando los cambios de estado.
4. **Este documento actualizado** con la sección de "Conclusión del Spike" llenada, incluyendo recomendaciones para la implementación en producción.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Los cálculos se actualizaron tras modificar?
  - ✅ / ❌ ¿Los 5 reintentos generaron 1 solo registro?
  - ✅ / ❌ ¿Los registros no confirmados permanecieron en `PENDING`?
  - ✅ / ❌ ¿Los tres comportamientos funcionaron juntos?
  - ✅ / ❌ ¿Se perdió algún registro?

- **Lecciones aprendidas**:
  - (Ejemplo: "La invalidación de caché debe ser parte del servicio centralizado, no de cada pantalla.")
  - (Ejemplo: "La verificación de `localId` en el backend debe ser estricta y devolver la misma respuesta en reintentos.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Implementar idempotencia desde el día 1.")
  - (Ejemplo: "Usar transacciones en SQLite para evitar corrupción.")
  - (Ejemplo: "Monitorear la cantidad de registros en `PENDING` y el tiempo promedio de sincronización.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)