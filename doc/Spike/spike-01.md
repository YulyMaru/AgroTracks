# SPIKE-001: Validar sincronización offline automática

## Información general

- **ID:** SPIKE-001
- **Nombre:** Validar sincronización offline automática
- **ADR relacionado:** ADR-001 — Implementar sincronización offline con retry y backoff
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 5 días hábiles (40 horas hombre)

## 1. Objetivo

Validar técnicamente que AgroTrack puede registrar información cuando el dispositivo se encuentra sin conexión a Internet y sincronizarla automáticamente con el backend cuando se recupere la conectividad, cumpliendo con el escenario ESC-CAL-DP-01.

El Spike busca comprobar que la estrategia seleccionada en el ADR-001, basada en sincronización automática, retry, backoff exponencial e idempotencia, es viable antes de realizar la implementación completa de la funcionalidad offline.

## 2. Problema que se busca validar

AgroTrack debe permitir que el campesino continúe registrando información aunque no tenga conexión a Internet.

El principal riesgo es que las operaciones realizadas sin conexión:

- Se pierdan.
- Se registren varias veces.
- No se sincronicen correctamente.
- Generen errores cuando vuelva la conexión.
- Sobrecarguen el backend debido a múltiples reintentos.
- Requieran intervención manual del usuario.

Por esta razón, se necesita realizar una prueba técnica pequeña que permita comprobar el comportamiento de la estrategia antes de implementarla completamente.

## 3. Pregunta principal del Spike

¿Es posible registrar una operación sin conexión, almacenarla localmente y sincronizarla automáticamente cuando se recupere la conectividad, utilizando retry, backoff exponencial e idempotencia sin generar pérdida ni duplicación de información?

## 4. Hipótesis

Si una operación es registrada sin conexión y se almacena localmente con un identificador único en una cola de pendientes, entonces:

- Al recuperar la conectividad, el sistema detectará la red y enviará automáticamente las operaciones pendientes al backend.
- Si ocurre un error transitorio, el sistema reintentará con backoff exponencial, sin superar los 10 intentos en el primer minuto.
- Si una operación se envía más de una vez por un reintento, el backend reconocerá su identificador único y evitará duplicados (N reintentos → 1 registro remoto).
- Al finalizar, el 100 % de las operaciones registradas offline aparecerá en el backend.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá únicamente los elementos necesarios para validar la estrategia:

- Registro de una operación sencilla (Gasto).
- Almacenamiento local de la operación en SQLite.
- Identificador único (`localId`) para cada operación.
- Cola de operaciones pendientes.
- Detección de pérdida de conectividad.
- Detección de recuperación de conectividad (`NetInfo`).
- Sincronización automática.
- Retry ante errores temporales.
- Backoff exponencial.
- Validación de idempotencia en el backend.
- Simulación de errores del backend (500, 503, timeout).
- Registro básico de los intentos de sincronización.
- Validación de operaciones sincronizadas.

### 5.2 No incluye

El Spike no implementará:

- Todos los módulos de AgroTrack.
- Todos los tipos de operaciones del sistema.
- Interfaz definitiva de la aplicación.
- Sistema completo de sincronización para producción.
- WebSockets.
- Firebase Cloud Messaging.
- RabbitMQ.
- Otros Message Brokers.
- Sincronización en tiempo real.
- Resolución avanzada de conflictos entre dispositivos.
- Sistema completo de monitoreo.
- Optimización definitiva de rendimiento.

## 6. Caso de prueba principal

Se utilizará una operación sencilla de AgroTrack para comprobar todo el ciclo de sincronización.

**Datos de ejemplo:**

- **Tipo**: Gasto
- **Descripción**: Compra de fertilizante
- **Valor**: $50.000 COP
- **Fecha**: 2026-01-15
- **Categoría**: Insumos
- **localId**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890` (UUID generado por el cliente)

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Registro sin conexión

**Objetivo:** Comprobar que una operación puede registrarse correctamente cuando el dispositivo no tiene conexión a Internet.

#### Procedimiento

1. Desactivar la conexión a Internet del dispositivo (modo avión).
2. Abrir AgroTrack.
3. Registrar la operación del caso de prueba.
4. Guardar la información.
5. Consultar el almacenamiento local (tabla `pending_operations`).

#### Resultado esperado

- La operación se almacena localmente con `status = 'PENDING'`.
- El `localId` se conserva en la base local.
- El usuario recibe un mensaje de confirmación ("Guardado localmente, se sincronizará automáticamente").

---

### 7.2 Prueba 2 — Sincronización automática al reconectar

**Objetivo:** Comprobar que al recuperar la conexión, el sistema detecta la red y sincroniza las operaciones pendientes.

#### Procedimiento

1. Partir de la Prueba 1 (operación en `PENDING`).
2. Activar la conexión a Internet.
3. Esperar a que el monitor de conectividad (`NetInfo`) detecte el cambio.
4. Observar el procesamiento de la cola.
5. Consultar el backend mock.

#### Resultado esperado

- El monitor detecta la recuperación de red en < 5 s.
- La operación pendiente se envía automáticamente al backend.
- El backend registra la operación con el mismo `localId`.
- El estado local cambia a `SYNCED`.

---

### 7.3 Prueba 3 — Idempotencia ante reintentos

**Objetivo:** Validar que los reintentos con el mismo `localId` no generan duplicados.

#### Procedimiento

1. Registrar una operación offline con `localId = "abc-123"`.
2. Forzar 5 reintentos de sincronización con el mismo `localId` (simular fallos de red).
3. Consultar el backend.

#### Resultado esperado

- El backend crea **exactamente 1 registro** correspondiente al `localId`.
- En los reintentos 2 a 5, el backend devuelve la misma respuesta (sin crear nuevos registros).
- El estado local pasa a `SYNCED` una sola vez.

---

### 7.4 Prueba 4 — Backoff exponencial

**Objetivo:** Validar que el backoff controla la frecuencia de los reintentos y evita saturar el backend.

#### Procedimiento

1. Configurar el backend mock para que devuelva error 503 en las primeras solicitudes.
2. Registrar una operación offline.
3. Activar la conexión.
4. Medir la cantidad de intentos en el primer minuto y los intervalos entre ellos.

#### Resultado esperado

- El sistema realiza **≤ 10 intentos en el primer minuto**.
- Los intervalos crecen exponencialmente (ej. 1 s, 2 s, 4 s, 8 s, 16 s, 32 s...).
- No hay ráfagas de solicitudes.

---

### 7.5 Prueba 5 — Simulación de errores del backend

**Objetivo:** Validar que el sistema maneja errores del backend sin perder la operación.

#### Procedimiento

1. Configurar el backend mock para devolver error 500 en la primera solicitud.
2. Registrar una operación offline.
3. Activar la conexión.
4. Observar el comportamiento del sistema.
5. Desactivar el error en el backend.
6. Esperar el siguiente reintento.

#### Resultado esperado

- La operación permanece en `PENDING` tras el error.
- El sistema reintenta con backoff exponencial.
- Al desaparecer el error, la operación se sincroniza correctamente.
- No hay pérdida ni duplicación.

---

### 7.6 Prueba 6 — Interrupción de conexión durante la sincronización

**Objetivo:** Validar que los registros no confirmados se conservan si la conexión se interrumpe.

#### Procedimiento

1. Registrar una operación offline.
2. Iniciar la sincronización.
3. Desactivar la conexión antes de recibir la confirmación del backend.
4. Observar el estado del registro.

#### Resultado esperado

- El registro permanece en `PENDING`.
- Al reconectar, el sistema reintenta y sincroniza correctamente.
- No hay pérdida de información.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si:

1. **Sincronización completa**: el 100 % de las operaciones registradas sin conexión aparecen en el backend al reconectar.
2. **Idempotencia**: ninguna operación se duplica durante los reintentos (validado enviando la misma operación 5 veces).
3. **Control de tráfico**: el backoff exponencial evita que se hagan más de 10 intentos en el primer minuto.
4. **Detección de conectividad**: el monitor detecta la recuperación de red en < 5 s.
5. **Conservación ante interrupción**: el 100 % de los registros no confirmados permanece en `PENDING`.

El Spike se considerará **RECHAZADO** si:

- Alguna operación se pierde o se duplica.
- El backoff no controla la frecuencia de reintentos.
- El monitor de conectividad no detecta la recuperación de red.
- Los registros no confirmados no se conservan ante una interrupción.

## 9. Entorno técnico del spike

- **Cliente**: React Native.
- **Base de datos local**: SQLite (`react-native-sqlite-storage` o equivalente).
- **Detección de conectividad**: `@react-native-community/netinfo`.
- **Servidor**: API REST en Spring Boot (mock con endpoints de error simulables).
- **HTTP client**: `axios` con interceptor para reintentos y manejo de `retry-after`.
- **Generación de UUID**: `react-native-uuid` o equivalente.
- **Medición**: logs de tiempo, cantidad de reintentos e intervalos.

## 10. Timebox

**Duración máxima:** 5 días hábiles (40 horas hombre).

## 11. Riesgos y mitigación

- **Riesgo**: SQLite puede tener problemas de rendimiento o compatibilidad en el dispositivo de prueba.
  - **Mitigación**: Probar primero con una configuración básica; si falla, usar AsyncStorage como alternativa temporal (menos robusta).

- **Riesgo**: El monitor de conectividad (`NetInfo`) puede no detectar cambios de red en algunos dispositivos.
  - **Mitigación**: Probar en al menos 3 dispositivos de gama diferente; considerar polling adicional si es necesario.

- **Riesgo**: El backoff exponencial puede no estar bien configurado y saturar el backend.
  - **Mitigación**: Definir límites máximos (≤ 10 intentos en el primer minuto) y probar con errores simulados.

- **Riesgo**: La idempotencia puede fallar si el backend no verifica correctamente el `localId`.
  - **Mitigación**: Implementar verificación estricta del `localId` en el backend mock y probar con 5 reintentos.

- **Riesgo**: El timebox de 5 días puede ser insuficiente para cubrir las 6 pruebas.
  - **Mitigación**: Priorizar las pruebas 1, 2, 3 y 4; si el tiempo no alcanza, documentar las pruebas 5 y 6 como pendientes para la implementación final.

## 12. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Código funcional del PoC**:
   - Cola local de operaciones pendientes en SQLite.
   - Monitor de conectividad con `NetInfo`.
   - Motor de sincronización con retry y backoff exponencial.
   - Backend mock con verificación de idempotencia.
2. **Reporte de métricas**:
   - Tiempos de sincronización.
   - Cantidad de reintentos por operación.
   - Intervalos de backoff medidos.
   - Tasa de duplicación (debe ser 0).
3. **Evidencia**:
   - Capturas o video del flujo completo (registro offline, reconexión, sync).
   - Logs de la base de datos mostrando cambios de estado.
   - Logs del backend mostrando la verificación de `localId`.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 13. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El 100 % de las operaciones offline se sincronizó?
  - ✅ / ❌ ¿Los reintentos generaron duplicados?
  - ✅ / ❌ ¿El backoff mantuvo ≤ 10 intentos en el primer minuto?
  - ✅ / ❌ ¿El monitor detectó la recuperación de red?
  - ✅ / ❌ ¿Los registros no confirmados se conservaron?

- **Lecciones aprendidas**:
  - (Ejemplo: "El uso de SQLite requiere manejar migraciones desde el inicio.")
  - (Ejemplo: "El backoff debe tener un límite máximo para evitar esperas excesivas.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Usar transacciones al insertar en SQLite para garantizar integridad.")
  - (Ejemplo: "Añadir un índice en `status` para consultas rápidas a la cola de pendientes.")
  - (Ejemplo: "Implementar un límite de tamaño de la base local y un proceso de limpieza.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)