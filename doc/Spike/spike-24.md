# SPIKE-024: Validar manejo centralizado de errores y recuperación

## Información general

- **ID:** SPIKE-024
- **Nombre:** Validar manejo centralizado de errores, reintentos y conservación de datos
- **ADR relacionado:** ADR-024 — Estandarizar manejo de errores y recuperación en backend y frontend
- **ADR complementarios:** ADR-001 (Sincronización offline con retry y backoff), ADR-002 (Validar formularios con reglas centralizadas), ADR-004 (Comunicar ausencia de datos con estados vacíos), ADR-007 (Garantizar idempotencia y consistencia en sync), ADR-011 (Bloquear acceso no autenticado con middleware), ADR-021 (Implementar monitoreo y observabilidad)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles

## 1. Objetivo

Validar técnicamente que el manejo centralizado de errores en backend y frontend permite interpretar correctamente cada tipo de error (400, 401, 403, 404, 409, 500, 503, timeout), aplicar la estrategia de recuperación adecuada (reintento, refresco de token, mensaje al usuario), y conservar los datos ante interrupciones sin generar duplicados, cumpliendo con ESC-CAL-CF-05, ESC-CAL-INT-03, ESC-CAL-SEG-01 y ESC-CAL-US-03.

El Spike busca comprobar que el manejo centralizado seleccionado en ADR-024 es viable antes de implementarlo completamente en AgroTrack.

## 2. Problema que se busca validar

AgroTrack debe manejar errores de forma consistente para no confundir al usuario ni perder datos. Existen riesgos de que:

- Cada endpoint devuelva errores con estructura diferente.
- El frontend no sepa cómo interpretar cada error.
- Los errores transitorios no se reintenten.
- Los 401 no disparen refresco de token.
- Los datos se pierdan ante interrupciones.
- Los reintentos generen duplicados.
- Los mensajes sean técnicos e incomprensibles.
- No haya trazabilidad de los errores.
- Los errores 409 de idempotencia se confundan con errores reales.

Por esta razón, se necesita un prototipo que implemente el manejo centralizado, simule cada tipo de error y valide su comportamiento en condiciones realistas.

## 3. Pregunta principal del Spike

¿El manejo centralizado de errores con estructura única y estrategias de recuperación permite interpretar correctamente cada tipo de error, conservar los datos ante interrupciones y evitar duplicados en dispositivos Android de gama baja, media y alta?

## 4. Hipótesis

Si implementamos:

- Backend con un manejador global de excepciones que devuelve una estructura única de error (con código, mensaje, detalles, marca de tiempo e identificador de traza).
- Códigos estandarizados para cada tipo de error (validación, autenticación, permiso, no encontrado, conflicto, idempotencia, error interno, servicio no disponible).
- Frontend con un interceptor de Axios que decide según el código y el estado HTTP.
- Reintentos con backoff para errores transitorios.
- Refresco silencioso para 401.
- Conservación de registros en estado pendiente hasta confirmación.
- Idempotencia con identificador único local.
- Identificador de traza propagado en cada error.

Entonces:

- El 100 % de los errores tendrá estructura única.
- El interceptor interpretará correctamente cada código.
- Los errores transitorios se reintentarán con backoff.
- Los 401 dispararán refresco o redirección.
- Los datos no se perderán ante interrupciones.
- Los reintentos no generarán duplicados.
- Los mensajes serán claros y accionables.
- Cada error incluirá identificador de traza.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Backend (Spring Boot)**:
  - Manejador global de excepciones que captura todas las excepciones.
  - Estructura única de error con código, mensaje, detalles, marca de tiempo e identificador de traza.
  - Códigos estandarizados para: validación, autenticación, permiso, no encontrado, conflicto, idempotencia, error interno, servicio no disponible.
  - Mensajes en español colombiano, claros y accionables.
  - Identificador de traza propagado en cada respuesta de error.
  - Endpoints de prueba que simulan cada error.
- **Frontend (React Native)**:
  - Interceptor de Axios que captura errores y decide según código y estado HTTP.
  - Manejo de 400/422, 401, 403, 404, 409, 500, 503 y timeout.
  - Conservación de registros en estado pendiente hasta confirmación.
  - Reintentos con backoff exponencial.
  - Refresco silencioso de token.
  - Mensajes claros y accionables.
  - Identificador de traza enviado en el header de cada solicitud.
- **Pruebas**:
  - Simulación de errores 400, 401, 403, 404, 409, 500, 503 y timeout.
  - Pruebas de conservación de datos en estado pendiente.
  - Pruebas de idempotencia con identificador único local.
  - Pruebas de refresco de token.
  - Pruebas de identificador de traza en errores.
  - Medición de tiempos de reintento.
  - Pruebas en 3 dispositivos Android.

### 5.2 No incluye

El Spike no implementará:

- Circuit Breaker (se deja como pendiente).
- Sagas (no aplica a monolito).
- Pruebas en iOS (solo Android).
- Publicación en producción.
- Errores de validación complejos (ADR-002 los cubre).
- Errores de autenticación avanzados (solo 401 y 403).
- Recuperación de errores en el backend (solo en el frontend).
- Notificaciones al usuario sobre errores (solo mensajes en pantalla).

## 6. Caso de prueba principal

**Errores a simular:**

| Código HTTP | Tipo de error | Estrategia |
|-------------|---------------|------------|
| 400 | Error de validación | Mostrar mensaje de validación |
| 401 | Autenticación requerida | Refrescar token o redirigir a login |
| 403 | Acceso prohibido | Mostrar mensaje de permiso |
| 404 | No encontrado | Mostrar estado vacío |
| 409 | Idempotencia (ya procesado) | Tratar como éxito |
| 500 | Error interno | Reintentar con backoff |
| 503 | Servicio no disponible | Reintentar con backoff |
| Timeout | Tiempo de espera agotado | Reintentar con backoff |

**Estructura de error esperada:**

Cada respuesta de error del backend debe contener:
- Un código de error identificable.
- Un mensaje en español colombiano, claro y accionable.
- Detalles adicionales cuando aplique (por ejemplo, el campo que falló).
- Una marca de tiempo del momento del error.
- Un identificador de traza para rastrearlo en logs.

**Datos de prueba:**

- Usuario mock autenticado.
- 20 fincas.
- 100 transacciones (50 ingresos, 50 gastos).
- 5 operaciones pendientes.

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Estructura única de error en backend

**Objetivo:** Validar que todos los errores devuelven la misma estructura.

#### Procedimiento
1. Configurar el manejador global de excepciones en Spring Boot.
2. Simular errores 400, 401, 403, 404, 409, 500, 503.
3. Consumir cada endpoint con Postman o curl.
4. Verificar que todos devuelven la estructura única esperada.
5. Verificar que los códigos de error son los esperados.
6. Verificar que los mensajes están en español.

#### Resultado esperado
- El 100 % de los errores tiene estructura única.
- Los códigos de error son correctos.
- Los mensajes están en español y son claros.
- Cada error incluye el identificador de traza.

---

### 7.2 Prueba 2 — Interceptor de Axios en frontend

**Objetivo:** Validar que el interceptor interpreta correctamente cada error.

#### Procedimiento
1. Configurar el interceptor de Axios.
2. Consumir endpoints que devuelven cada error.
3. Verificar que el interceptor aplica la estrategia correcta:
   - Error de validación → muestra mensaje de validación.
   - Autenticación requerida → intenta refrescar token.
   - Acceso prohibido → muestra mensaje de permiso.
   - No encontrado → muestra estado vacío.
   - Idempotencia → trata como éxito.
   - Error interno o servicio no disponible → reintenta con backoff.
4. Verificar que el comportamiento es consistente en los tres dispositivos.

#### Resultado esperado
- El interceptor interpreta correctamente cada código.
- Las estrategias se aplican según el error.
- No hay errores no manejados.
- Funciona en los tres dispositivos.

---

### 7.3 Prueba 3 — Reintentos con backoff

**Objetivo:** Validar que los errores transitorios se reintentan con backoff.

#### Procedimiento
1. Simular errores 500, 503 y timeout.
2. Observar el comportamiento del interceptor.
3. Medir la cantidad de intentos en el primer minuto.
4. Medir los intervalos entre intentos.
5. Verificar que no hay ráfagas de solicitudes.

#### Resultado esperado
- El sistema reintenta con backoff exponencial.
- Se realizan 10 intentos o menos en el primer minuto.
- Los intervalos crecen exponencialmente.
- No hay ráfagas.

---

### 7.4 Prueba 4 — Refresco de token ante 401

**Objetivo:** Validar que los 401 disparan refresco o redirección.

#### Procedimiento
1. Simular token expirado (401).
2. Verificar que el interceptor intenta refrescar el token.
3. Verificar que la solicitud original se reintenta con el nuevo token.
4. Simular fallo en el refresco.
5. Verificar que se redirige a login.

#### Resultado esperado
- El 401 dispara refresco silencioso.
- La solicitud original se reintenta.
- Si el refresco falla, se redirige a login.
- No hay múltiples refrescos simultáneos.

---

### 7.5 Prueba 5 — Conservación de datos ante interrupción

**Objetivo:** Validar que los datos no se pierden ante interrupciones.

#### Procedimiento
1. Registrar una operación offline.
2. Iniciar sincronización.
3. Cortar la conexión antes de recibir la confirmación.
4. Verificar el estado del registro en la base local.
5. Reconectar y verificar que se sincroniza correctamente.

#### Resultado esperado
- El registro permanece en estado pendiente.
- Al reconectar, se sincroniza sin pérdida.
- No hay duplicados.
- No hay corrupción.

---

### 7.6 Prueba 6 — Idempotencia ante reintentos

**Objetivo:** Validar que los reintentos no generan duplicados.

#### Procedimiento
1. Simular 5 reintentos con el mismo identificador único local.
2. Verificar que el backend crea exactamente 1 registro.
3. Verificar que los reintentos devuelven la misma respuesta.
4. Verificar que el estado local pasa a sincronizado una sola vez.

#### Resultado esperado
- Solo se crea 1 registro.
- Las respuestas son idénticas.
- El estado local se actualiza una sola vez.
- No hay duplicados.

---

### 7.7 Prueba 7 — Mensajes claros y accionables

**Objetivo:** Validar que los mensajes son claros y accionables.

#### Procedimiento
1. Revisar los mensajes de cada error.
2. Verificar que están en español colombiano.
3. Verificar que son claros y accionables.
4. Verificar que no tienen tecnicismos.
5. Probar con 3 usuarios (o simuladores) y verificar comprensión.

#### Resultado esperado
- Los mensajes están en español.
- Son claros y accionables.
- No tienen tecnicismos.
- Los usuarios los comprenden.

---

### 7.8 Prueba 8 — Trazabilidad con identificador de traza

**Objetivo:** Validar que cada error incluye identificador de traza y que se puede rastrear.

#### Procedimiento
1. Generar un identificador de traza en el frontend.
2. Enviarlo en el header de cada solicitud.
3. Provocar un error en el backend.
4. Verificar que el identificador de traza aparece en:
   - La respuesta de error.
   - Los logs del backend.
   - La consola del frontend.
5. Rastrear un flujo completo.

#### Resultado esperado
- El identificador de traza se propaga correctamente.
- Aparece en la respuesta, logs y consola.
- Se puede rastrear un flujo de extremo a extremo.
- No hay errores de propagación.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Estructura única**: El 100 % de los errores devuelve la misma estructura.
2. **Interceptor**: El interceptor interpreta correctamente cada código.
3. **Reintentos**: Los errores transitorios se reintentan con backoff (10 intentos o menos en el primer minuto).
4. **Refresco de token**: Los 401 disparan refresco o redirección.
5. **Conservación**: Los datos no se pierden ante interrupciones.
6. **Idempotencia**: Los reintentos no generan duplicados.
7. **Mensajes**: Los mensajes son claros y accionables.
8. **Trazabilidad**: Cada error incluye identificador de traza.

El Spike se considerará **RECHAZADO** si:

- Algún error no tiene estructura única.
- El interceptor no interpreta correctamente algún código.
- Los errores transitorios no se reintentan.
- Los 401 no disparan refresco.
- Los datos se pierden ante interrupciones.
- Los reintentos generan duplicados.
- Los mensajes son técnicos o confusos.
- Los errores no incluyen identificador de traza.

## 9. Entorno técnico del spike

- **Backend**: Spring Boot 3 + Java 17.
- **Manejo de errores backend**: manejador global de excepciones con estructura única.
- **Frontend**: React Native + TypeScript.
- **HTTP**: Axios con interceptor.
- **Base de datos local**: SQLite con tabla de operaciones pendientes.
- **Motor de sincronización**: mock o real (ADR-001).
- **Idempotencia**: identificador único local (ADR-007).
- **Refresco de token**: JWT con access token y refresh token (ADR-011).
- **Trazabilidad**: identificador de traza en header de cada solicitud.
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Medición**: temporizadores de alto rendimiento, Postman, logs del backend.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: El refresco de token puede disparar múltiples solicitudes simultáneas.
  - **Mitigación**: Implementar una cola de solicitudes durante el refresco para que solo una se ejecute a la vez.

- **Riesgo**: Los reintentos pueden saturar el backend.
  - **Mitigación**: Backoff con límite máximo (10 intentos o menos en el primer minuto). Circuit Breaker en el futuro.

- **Riesgo**: Los errores de idempotencia pueden confundirse con errores reales.
  - **Mitigación**: Tratar la idempotencia como éxito. Documentar el comportamiento.

- **Riesgo**: El identificador de traza puede no propagarse correctamente.
  - **Mitigación**: Usar un filtro en el backend para leer el header y añadirlo al contexto de logs. Probar con múltiples solicitudes.

- **Riesgo**: Los mensajes pueden no ser claros para el usuario.
  - **Mitigación**: Probar con usuarios reales. Usar lenguaje coloquial.

- **Riesgo**: El timebox de 3 días puede ser insuficiente para las 8 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2, 3, 4 y 5. Si el tiempo no alcanza, documentar 6, 7 y 8 como pendientes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Backend con manejador global de excepciones y estructura única de error.
   - Frontend con interceptor de Axios.
   - Simulación de errores 400, 401, 403, 404, 409, 500, 503 y timeout.
   - Pruebas de conservación de datos en estado pendiente.
   - Pruebas de idempotencia con identificador único local.
   - Pruebas de refresco de token.
   - Pruebas de identificador de traza.
2. **Reporte de métricas**:
   - Resultado de la estructura única de error.
   - Resultado de la interpretación del interceptor.
   - Tiempos de reintento.
   - Resultado de conservación de datos.
   - Resultado de idempotencia.
   - Resultado de trazabilidad con identificador de traza.
3. **Evidencia**:
   - Capturas de cada error con su estructura.
   - Capturas del interceptor manejando cada error.
   - Capturas de los datos pendientes tras interrupción.
   - Capturas de los logs con identificador de traza.
   - Video del flujo completo.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El 100 % de los errores tuvo estructura única?
  - ✅ / ❌ ¿El interceptor interpretó correctamente cada código?
  - ✅ / ❌ ¿Los errores transitorios se reintentaron con backoff?
  - ✅ / ❌ ¿Los 401 dispararon refresco o redirección?
  - ✅ / ❌ ¿Los datos se conservaron ante interrupciones?
  - ✅ / ❌ ¿Los reintentos no generaron duplicados?
  - ✅ / ❌ ¿Los mensajes fueron claros y accionables?
  - ✅ / ❌ ¿Cada error incluyó identificador de traza?

- **Lecciones aprendidas**:
  - (Ejemplo: "El interceptor debe manejar el refresco de token de forma atómica para evitar múltiples solicitudes simultáneas.")
  - (Ejemplo: "Tratar la idempotencia como éxito evita confusión en el frontend.")
  - (Ejemplo: "El backoff debe tener límite máximo para no esperar demasiado.")
  - (Ejemplo: "El identificador de traza debe generarse en el frontend y propagarse en todas las solicitudes.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Estandarizar la estructura de error desde el día 1.")
  - (Ejemplo: "Incluir identificador de traza en todas las respuestas de error.")
  - (Ejemplo: "Documentar los códigos de error y sus estrategias.")
  - (Ejemplo: "Probar cada tipo de error en los tres dispositivos.")
  - (Ejemplo: "Considerar Circuit Breaker en el futuro si el backend se sobrecarga.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)