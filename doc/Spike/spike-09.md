# SPIKE-009: Validar rendimiento y escalabilidad de consultas

## Información general

- **ID:** SPIKE-009
- **Nombre:** Validar rendimiento de consultas y resúmenes con índices, agregaciones en servidor y caché
- **ADR relacionado:** ADR-009 — Optimizar consultas con índices y caché
- **ADR complementarios:** ADR-001 (Implementar sincronización offline con retry y backoff), ADR-006 (Consultar datos offline y detectar conectividad)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 4 días hábiles (32 horas hombre)

## 1. Objetivo

Validar técnicamente que la estrategia de optimización avanzada (índices compuestos, agregaciones en servidor, paginación y caché de resúmenes) permite cumplir los umbrales de tiempo definidos en ADR-009, cumpliendo con los escenarios ESC-CAL-RN-02, ESC-CAL-RN-04 y ESC-CAL-ESC-01:

- Consultas de fincas/lotes/cultivos: ≤ 3 s.
- Resúmenes económicos: ≤ 5 s.
- Volumen máximo: 10,000 transacciones, 500 fincas, 2,000 lotes.

El Spike busca comprobar que las optimizaciones son suficientes antes de implementarlas en producción.

## 2. Problema que se busca validar

AgroTrack acumulará datos históricos durante meses o años. Sin optimizaciones, las consultas y resúmenes se degradarán linealmente y la app se volverá inutilizable. Existen riesgos de que:

- Las consultas superen los 3 s con 10,000 registros.
- Los resúmenes superen los 5 s con períodos largos.
- La caché quede desactualizada si no se invalida correctamente.
- Los índices no sean suficientes para las agregaciones complejas.
- El hit ratio de caché sea bajo (< 80 %) y no se logre la mejora esperada.

Por esta razón, se necesita una prueba técnica que mida el impacto real de las optimizaciones antes de implementarlas.

## 3. Pregunta principal del Spike

¿Es posible mantener consultas ≤ 3 s y resúmenes ≤ 5 s con el volumen máximo definido (10,000 transacciones, 500 fincas, 2,000 lotes), utilizando índices compuestos, agregaciones en servidor, paginación y caché de resúmenes?

## 4. Hipótesis

Si implementamos:

- Índices compuestos `(user_id, fecha, tipo)` en `transactions`.
- Índices en `farms(user_id)` y `lots(farm_id)`.
- Agregaciones `SUM` + `GROUP BY` en PostgreSQL (no en cliente).
- Paginación de 20-50 registros por página.
- Caché de resúmenes (en memoria o Redis) con TTL de 5 min e invalidación al modificar.

Entonces:

- Las consultas de fincas/lotes/cultivos se mantendrán ≤ 3 s.
- Los resúmenes económicos se mantendrán ≤ 5 s.
- La caché reducirá el tiempo de respuesta a ≤ 200 ms en consultas repetidas.
- El hit ratio de caché superará el 80 % en períodos recurrentes.

## 5. Alcance

### 5.1 Incluye

- Generación de datos de prueba: 10,000 transacciones, 500 fincas, 2,000 lotes (período: 2 años).
- Creación de índices en PostgreSQL.
- Consultas optimizadas con `EXPLAIN ANALYZE`.
- Agregaciones en servidor (`SUM`, `GROUP BY`).
- Paginación en listados.
- Implementación de caché (en memoria o Redis) con invalidación.
- Medición de tiempos con y sin optimizaciones.
- Comparación de escenarios: sin índices, con índices, con índices + agregaciones, con índices + agregaciones + caché.

### 5.2 No incluye

- Optimización de todos los endpoints (solo consultas y resúmenes críticos).
- Pruebas de carga con más de 10,000 registros.
- Monitoreo en producción (solo medición en entorno de prueba).
- Migración de datos históricos.
- Optimización de la app móvil más allá de paginación e indicadores de carga.

## 6. Caso de prueba principal

**Volumen de datos:**

- 10,000 transacciones (ingresos y gastos) para un usuario.
- 500 fincas.
- 2,000 lotes.
- Período: 2 años de historial.

**Consultas a medir:**

1. Listado de fincas del usuario.
2. Listado de lotes por finca.
3. Resumen económico del mes actual.
4. Resumen económico de los últimos 12 meses.
5. Listado paginado de transacciones.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Medición sin optimizaciones (baseline)

**Objetivo:** Establecer la línea base de tiempos sin índices, sin caché y con agregaciones en cliente.

#### Procedimiento
1. Cargar los 10,000 registros sin índices.
2. Ejecutar cada consulta 3 veces y promediar.
3. Registrar tiempos con `EXPLAIN ANALYZE`.

#### Resultado esperado
- Registrar los tiempos base para comparar con los escenarios optimizados.
- Confirmar que la estrategia sin optimización **no cumple** con los umbrales (consultas > 5 s, resúmenes > 8 s).
- Documentar los cuellos de botella identificados.

---

### 7.2 Prueba 2 — Medición con índices y paginación

**Objetivo:** Medir el impacto de índices compuestos y paginación.

#### Procedimiento
1. Crear índices `idx_transactions_user_date_type`, `idx_farms_user_id`, `idx_lots_farm_id`.
2. Implementar paginación de 20 registros.
3. Ejecutar las mismas consultas.
4. Comparar con la Prueba 1.

#### Resultado esperado
- Consultas ≤ 3 s.
- Resúmenes ≤ 5 s.
- Mejora significativa vs baseline (documentar porcentaje de mejora).

---

### 7.3 Prueba 3 — Medición con agregaciones en servidor

**Objetivo:** Medir el impacto de calcular sumas en PostgreSQL en lugar del cliente.

#### Procedimiento
1. Implementar `SELECT tipo, SUM(monto) FROM transactions WHERE user_id = ? AND fecha BETWEEN ? AND ? GROUP BY tipo`.
2. Ejecutar los resúmenes.
3. Comparar con Prueba 2.

#### Resultado esperado
- Resúmenes ≤ 3 s (mejora adicional).
- Transferencia de datos reducida drásticamente.
- Documentar el volumen de datos transferidos antes y después.

---

### 7.4 Prueba 4 — Medición con caché

**Objetivo:** Medir el impacto de cachear resúmenes de períodos recurrentes.

#### Procedimiento
1. Implementar caché (en memoria o Redis) para resúmenes del mes actual y mes anterior.
2. TTL de 5 minutos.
3. Invalidar al crear/modificar/eliminar transacción.
4. Ejecutar los resúmenes 5 veces seguidas.
5. Medir el hit ratio y los tiempos.

#### Resultado esperado
- Primera consulta: ≤ 3 s (sin caché).
- Consultas siguientes: ≤ 200 ms (desde caché).
- Hit ratio > 80 % para períodos recurrentes.
- Documentar el porcentaje de mejora con caché.

---

### 7.5 Prueba 5 — Invalidación de caché

**Objetivo:** Validar que la caché se invalida correctamente al modificar datos.

#### Procedimiento
1. Consultar resumen del mes (se cachea).
2. Registrar una nueva transacción en el mes.
3. Consultar el resumen nuevamente.
4. Verificar que el resumen incluye la nueva transacción.

#### Resultado esperado
- La caché se invalida correctamente.
- El resumen refleja el dato actualizado en < 1 s.
- No hay datos obsoletos.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Consultas productivas**: ≤ 3 s con 10,000 transacciones, 500 fincas, 2,000 lotes.
2. **Resúmenes económicos**: ≤ 5 s en el peor caso (sin caché) y ≤ 200 ms con caché.
3. **Escalabilidad**: los tiempos se mantienen al crecer hasta el volumen máximo definido.
4. **Invalidación correcta**: la caché refleja cambios en < 1 s tras modificar datos.
5. **Hit ratio**: > 80 % en períodos recurrentes (mes actual, mes anterior).
6. **Documentación**: se documentan índices, consultas optimizadas y configuración de caché.

El Spike se considerará **RECHAZADO** si:

- Las consultas productivas superan los 3 s con el volumen máximo.
- Los resúmenes superan los 5 s en el peor caso.
- La caché no se invalida correctamente (datos obsoletos > 1 s).
- El hit ratio es < 80 % en períodos recurrentes.
- Los índices ralentizan significativamente las escrituras (> 20 % de degradación).

## 9. Entorno técnico del spike

- **Base de datos**: PostgreSQL 15+.
- **Backend**: Spring Boot o Node.js (según el stack de AgroTrack) con consultas optimizadas.
- **Caché**: Redis (o caché en memoria con `Caffeine` para el spike).
- **Datos de prueba**: script de generación de 10,000 transacciones, 500 fincas, 2,000 lotes.
- **Medición**: `EXPLAIN ANALYZE`, logs de tiempo, métricas de hit ratio.
- **Cliente**: React Native o Flutter (según el stack de AgroTrack) para validar paginación e indicadores de carga.

## 10. Riesgos y mitigación

- **Riesgo**: Los índices compuestos pueden ralentizar las escrituras.
  - **Mitigación**: Medir el impacto en INSERT/UPDATE. Si es significativo (> 20 %), evaluar índices parciales.

- **Riesgo**: La caché en memoria no es distribuida y puede perderse al reiniciar.
  - **Mitigación**: Para el spike es suficiente. En producción, evaluar Redis.

- **Riesgo**: El volumen máximo definido puede ser superado en producción.
  - **Mitigación**: Documentar el límite y planificar archivado de datos antiguos (> 2 años).

- **Riesgo**: La invalidación de caché puede fallar si hay concurrencia.
  - **Mitigación**: Usar invalidación atómica (hooks en el servicio de transacciones). Probar con transacciones concurrentes.

- **Riesgo**: El hit ratio de caché puede ser menor al 80 % esperado.
  - **Mitigación**: Medir el hit ratio real y ajustar el TTL o las claves de caché según los patrones de consulta observados.

## 11. Entregables del Spike

1. **Repositorio de código** (branch del spike) con:
   - Scripts de creación de índices.
   - Consultas optimizadas.
   - Implementación de caché con invalidación.
   - Script de generación de datos de prueba.
2. **Reporte de métricas**:
   - Tiempos de cada consulta en los 4 escenarios (baseline, índices, agregaciones, caché).
   - Hit ratio de caché.
   - Comparativa visual (tabla o gráfico).
   - Impacto en escrituras (INSERT/UPDATE).
3. **Documentación de índices y configuración de caché** para el equipo de operaciones.
4. **Evidencia visual**:
   - Capturas de `EXPLAIN ANALYZE` antes y después.
   - Gráfico comparativo de tiempos por escenario.
5. **Este documento actualizado** con la sección de "Conclusión del Spike" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Se cumplieron los tiempos ≤ 3 s y ≤ 5 s?
  - ✅ / ❌ ¿La caché redujo los tiempos a ≤ 200 ms?
  - ✅ / ❌ ¿La invalidación funcionó correctamente?
  - ✅ / ❌ ¿El hit ratio superó el 80 %?
  - ✅ / ❌ ¿Los índices ralentizaron significativamente las escrituras?

- **Lecciones aprendidas**:
  - (Ejemplo: "Los índices compuestos mejoraron las agregaciones de 8 s a 1.5 s.")
  - (Ejemplo: "La caché redujo la carga del servidor en un 70 %.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Usar Redis para caché distribuida.")
  - (Ejemplo: "Monitorear tiempos de respuesta desde el día 1.")
  - (Ejemplo: "Considerar archivado de datos > 2 años.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)