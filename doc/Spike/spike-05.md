# SPIKE-005: Validar registro offline con cola de pendientes

## Información general

- **ID:** SPIKE-005
- **Nombre:** Validar registro offline con almacenamiento local y cola de pendientes
- **ADR relacionado:** ADR-005 — Registrar offline con SQLite y cola de pendientes
- **ADR complementarios:** ADR-001 (Implementar sincronización offline con retry y backoff), ADR-002 (Validar formularios con reglas centralizadas)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 5 días hábiles (40 horas hombre)

## 1. Objetivo

Validar técnicamente que AgroTrack puede registrar información básica (ej. un gasto) cuando el dispositivo está sin conexión, almacenarla de forma persistente en una base de datos local, marcarla como pendiente de sincronización, y mostrar un feedback claro al usuario, tal como lo exige el escenario de calidad ESC-CAL-DP-01.

El Spike busca comprobar que la combinación de almacenamiento local, cola de operaciones pendientes y validación offline funciona de manera integrada y confiable antes de implementarla en todos los módulos de AgroTrack.

## 2. Problema que se busca validar

AgroTrack debe permitir el registro de información sin conexión, pero existen riesgos de que:

- Los datos no se persistan correctamente si el usuario cierra la aplicación.
- El usuario no reciba un feedback claro y piense que el dato se perdió.
- Las validaciones de formulario no funcionen sin conexión.
- El registro offline no se integre correctamente con la cola de sincronización (ADR-001).
- El sistema no pueda manejar múltiples registros offline simultáneamente.
- La base de datos local tenga problemas de rendimiento o corrupción.

Por esta razón, se necesita un prototipo que implemente el flujo completo de registro offline, desde la validación hasta el encolado, y se pruebe en escenarios realistas.

## 3. Pregunta principal del Spike

¿Es posible registrar un gasto sin conexión, validarlo localmente, almacenarlo en SQLite, marcarlo como pendiente, mostrar un mensaje de confirmación al usuario, garantizar que persista tras cerrar y abrir la app, y que además se integre correctamente con el motor de sincronización para su envío al recuperar la conexión?

## 4. Hipótesis

Si implementamos el registro offline con los siguientes componentes:

- **Base de datos local**: SQLite con una tabla `pending_operations`.
- **Validación offline**: usando el esquema centralizado de reglas (ADR-002).
- **Encolado**: el registro se añade a la cola de pendientes.
- **Feedback**: se muestra un toast/snackbar con mensaje de confirmación.
- **Persistencia**: el registro sobrevive al cierre y reapertura de la app.

Entonces:

- El 100 % de los registros offline se almacenarán de forma persistente.
- El usuario recibirá feedback claro en el 100 % de los casos.
- Los registros aparecerán en la cola de pendientes y serán procesados por el motor de sincronización al reconectar.
- El registro podrá visualizarse en la interfaz (ej. en el historial) con el estado "Pendiente".

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Configuración de una base de datos local (SQLite) con la tabla `pending_operations`.
- Creación del modelo de datos para un "Gasto" (descripción, valor, fecha, categoría).
- Implementación de la validación del formulario usando las reglas centralizadas (esquema JSON) en modo offline.
- Lógica de almacenamiento: al validar correctamente, guardar el registro en SQLite con `status = 'PENDING'`.
- Generación de un `localId` (UUID) para cada registro offline.
- Mensaje de confirmación (toast/snackbar) con el texto: "¡Guardado localmente! Se sincronizará automáticamente".
- Simulación de recuperación de conectividad y procesamiento de la cola (integrando con un mock del motor de sincronización).
- Verificación de que el registro persiste al cerrar y abrir la aplicación.
- Visualización del registro en una lista con indicador de estado "Pendiente" (ej. ícono de reloj).

### 5.2 No incluye

El Spike no implementará:

- Todos los tipos de operaciones de AgroTrack (solo "Gasto").
- La sincronización real con el backend (se usará un mock o log para simular el envío).
- La interfaz definitiva de la aplicación (se usará un formulario simple para pruebas).
- El sistema completo de autenticación (se usará un usuario mock).
- Migraciones de base de datos (se trabajará con un esquema fijo).
- Optimización de rendimiento para grandes volúmenes de datos (se probará con hasta 50 registros).
- Resolución de conflictos (versiones offline vs online).

## 6. Caso de prueba principal

Se utilizará el formulario de registro de **Gasto** (similar al de AgroTrack) para comprobar todo el ciclo offline.

**Campos del formulario:**

1. **Descripción**: Texto, obligatorio, máximo 100 caracteres.
   - Ejemplo válido: "Compra de fertilizante"
2. **Valor**: Número, obligatorio, mayor a 0.
   - Ejemplo válido: 50000
3. **Fecha**: Fecha, obligatoria, formato YYYY-MM-DD.
   - Ejemplo válido: "2026-01-15"
4. **Categoría**: Selección, obligatoria.
   - Ejemplo válido: "Insumos"

**Flujo offline:**

1. Usuario llena el formulario sin conexión.
2. El sistema valida localmente.
3. Si es válido, se guarda en SQLite con estado `PENDING`.
4. Se muestra el mensaje de confirmación.
5. El usuario cierra la aplicación.
6. El usuario abre la aplicación nuevamente.
7. El registro aparece en el historial con el estado "Pendiente".
8. El usuario recupera la conexión.
9. El motor de sincronización procesa la cola y envía el registro (mock).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Registro offline exitoso

**Objetivo:** Validar que se puede registrar un gasto sin conexión, almacenarlo y recibir feedback.

#### Procedimiento
1. Desactivar la conexión a Internet del dispositivo (modo avión).
2. Abrir AgroTrack y navegar al formulario de registro de gasto.
3. Llenar todos los campos con datos válidos.
4. Presionar "Guardar".
5. Observar el mensaje de confirmación.
6. Verificar en la base de datos local que el registro existe con `status = 'PENDING'`.
7. Verificar en la interfaz (ej. historial) que el registro aparece con el ícono de pendiente.

#### Resultado esperado
- El formulario se valida correctamente sin conexión.
- Se muestra el mensaje "¡Guardado localmente! Se sincronizará automáticamente".
- El registro existe en SQLite con todos los datos correctos.
- El registro aparece en la lista de gastos con el estado "Pendiente".

---

### 7.2 Prueba 2 — Persistencia al cerrar la aplicación

**Objetivo:** Validar que los registros offline no se pierden al cerrar y reabrir la aplicación.

#### Procedimiento
1. Completar la Prueba 1 (registro offline exitoso).
2. Cerrar completamente la aplicación (forzar cierre o swipar desde el task manager).
3. Volver a abrir la aplicación.
4. Navegar a la lista de gastos.
5. Verificar que el registro offline sigue apareciendo con el estado "Pendiente".
6. Verificar en la base de datos que el registro persiste.

#### Resultado esperado
- El registro aparece en la lista tras reabrir la aplicación.
- La base de datos mantiene el registro intacto.
- El estado sigue siendo "PENDIENTE".

---

### 7.3 Prueba 3 — Múltiples registros offline y cola de pendientes

**Objetivo:** Validar que el sistema puede manejar múltiples registros offline en la cola.

#### Procedimiento
1. Sin conexión, registrar 5 gastos diferentes.
2. Verificar que los 5 aparecen en la lista con estado "Pendiente".
3. Verificar en la base de datos que los 5 están en la tabla `pending_operations`.
4. Activar la conexión (simular reconexión).
5. Verificar que el motor de sincronización procesa la cola y envía los 5 registros.
6. Verificar que después de procesarlos, el estado cambia a "SYNCED" (o se eliminan de la cola).

#### Resultado esperado
- Los 5 registros se almacenan correctamente.
- Al reconectar, los 5 son procesados por el motor de sincronización.
- El estado de los registros se actualiza a "SYNCED" (o desaparecen de la cola de pendientes).
- No hay pérdida ni duplicación.

---

### 7.4 Prueba 4 — Validación offline con reglas centralizadas

**Objetivo:** Validar que las reglas de validación (ADR-002) funcionan sin conexión.

#### Procedimiento
1. Sin conexión, abrir el formulario de gasto.
2. Ingresar una descripción de 150 caracteres (excede el máximo).
3. Salir del campo y verificar el mensaje de error.
4. Ingresar un valor de -500 (negativo, inválido).
5. Verificar el mensaje de error.
6. Dejar la fecha vacía y presionar "Guardar".
7. Verificar que el sistema muestra los errores correspondientes y no permite guardar.

#### Resultado esperado
- El sistema valida la descripción y muestra: "La descripción no puede superar los 100 caracteres".
- El sistema valida el valor y muestra: "El valor debe ser un número mayor a 0".
- Al presionar "Guardar" con fecha vacía, el sistema resalta el campo de fecha y no guarda el registro.
- Todas las validaciones funcionan sin conexión, usando las reglas centralizadas empaquetadas en la app.

---

### 7.5 Prueba 5 — Rendimiento de almacenamiento

**Objetivo:** Medir el tiempo promedio de almacenamiento de un registro offline.

#### Procedimiento
1. Sin conexión, generar 50 registros de gastos.
2. Medir el tiempo desde que se presiona "Guardar" hasta que el registro queda en SQLite.
3. Repetir 3 veces y promediar.
4. Verificar que no hay bloqueos en la UI durante el proceso.

#### Resultado esperado
- Tiempo promedio de almacenamiento < 200 ms por registro.
- La UI no se congela durante la inserción.
- Los 50 registros quedan en la tabla `pending_operations` con `status = 'PENDING'`.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Registro offline**: El 100 % de los registros válidos realizados sin conexión se almacenan en la base de datos local con `status = 'PENDING'`.
2. **Feedback al usuario**: En el 100 % de los registros offline exitosos, se muestra el mensaje de confirmación claro.
3. **Persistencia**: El 100 % de los registros offline sobrevive al cierre y reapertura de la aplicación.
4. **Múltiples registros**: El sistema maneja correctamente al menos 5 registros offline en la cola.
5. **Validación offline**: El 100 % de las validaciones de formulario (reglas básicas) funcionan sin conexión, mostrando mensajes de error específicos.
6. **Integración con sincronización**: La cola de pendientes es procesada correctamente por el motor de sincronización mock al reconectar.
7. **Rendimiento**: El tiempo promedio de almacenamiento es < 200 ms por registro para hasta 50 registros.

El Spike se considerará **RECHAZADO** si:

- Algún registro offline se pierde al cerrar la aplicación.
- El mensaje de confirmación no se muestra en algún caso.
- La validación offline no funciona o no muestra mensajes específicos.
- La cola de pendientes no se procesa al reconectar.
- El tiempo promedio de almacenamiento supera los 200 ms.
- La base de datos local se corrompe durante las pruebas.

## 9. Entorno técnico del spike

Para la ejecución de este Spike, se utilizará el siguiente stack:

- **Cliente móvil**: React Native / Flutter (el que use AgroTrack).
- **Base de datos local**: SQLite (con librería `react-native-sqlite-storage` o `sqflite` en Flutter).
- **Modelo de datos**: Tabla `pending_operations` con columnas: `localId` (UUID), `operation_type` (text), `payload` (JSON), `status` (text: PENDING, SYNCED, ERROR), `created_at` (timestamp), `retry_count` (int), `last_attempt` (timestamp).
- **Validación**: Esquema JSON de validación (ADR-002) cargado localmente.
- **Sincronización mock**: Un servicio que simula el envío al backend (log en consola) y cambia el estado de los registros a `SYNCED`.
- **UI de prueba**: Formulario simple de gasto y lista de gastos con indicador de estado.
- **Simulación de red**: Alternar entre modo avión y conexión para probar los flujos.
- **Medición de rendimiento**: `console.time` / `console.timeEnd` o herramientas de perfilado del framework.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: La librería de SQLite puede tener problemas de rendimiento o compatibilidad en el dispositivo de prueba.
  - **Mitigación**: Probar primero con una configuración básica y, si falla, usar AsyncStorage como alternativa temporal (aunque menos robusta).

- **Riesgo**: El manejo de la cola puede tener problemas de concurrencia si se registran múltiples operaciones rápidamente.
  - **Mitigación**: Implementar un mecanismo de cola FIFO simple y probar con 5 registros simultáneos.

- **Riesgo**: El usuario podría desinstalar la aplicación antes de sincronizar, perdiendo los datos offline.
  - **Mitigación**: (Para el spike, se documenta como riesgo. En producción, se puede advertir al desinstalar o hacer respaldos periódicos).

- **Riesgo**: Los registros offline pueden tener conflictos con registros ya sincronizados (ej. el usuario crea un gasto offline que ya existe en el servidor).
  - **Mitigación**: Para el spike, no se maneja resolución de conflictos. En producción, se abordaría con un ADR separado.

- **Riesgo**: La base de datos local puede corromperse por un cierre abrupto durante una escritura.
  - **Mitigación**: Usar transacciones al insertar en SQLite. Implementar verificación de integridad al iniciar la app (si es posible).

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Configuración de SQLite.
   - Modelo de `pending_operations`.
   - Formulario de gasto con validación offline.
   - Lógica de almacenamiento y encolado.
   - Lista de gastos con indicador de estado.
   - Mock de sincronización.
2. **Reporte de pruebas**:
   - Resultados de las 5 pruebas (registro, persistencia, múltiples registros, validación, rendimiento).
   - Capturas de pantalla o video del flujo completo.
   - Logs de la base de datos mostrando el cambio de estado de los registros.
3. **Métrica**: Tiempo promedio de almacenamiento de un registro offline (debe ser < 200 ms para 50 registros).
4. **Este documento actualizado** con la sección de "Conclusión del Spike" llenada, incluyendo:
   - ¿Funcionó la integración de SQLite con el motor de sincronización?
   - ¿Los mensajes de confirmación fueron claros para los usuarios en pruebas?
   - Recomendaciones para la implementación en producción (ej. uso de transacciones, manejo de errores, migraciones).

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Se logró el registro offline persistente?
  - ✅ / ❌ ¿El feedback al usuario fue claro?
  - ✅ / ❌ ¿Los registros sobreviven al cierre de la app?
  - ✅ / ❌ ¿La validación offline funciona correctamente?
  - ✅ / ❌ ¿La cola de pendientes se integra con el motor de sincronización?
  - ✅ / ❌ ¿El tiempo de almacenamiento fue < 200 ms por registro?

- **Lecciones aprendidas**:
  - (Ejemplo: "El uso de SQLite requiere manejar migraciones; es mejor definirlas desde el principio.")
  - (Ejemplo: "Los mensajes de confirmación deben ser más cortos en dispositivos con pantalla pequeña.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Usar transacciones al insertar en SQLite para garantizar integridad.")
  - (Ejemplo: "Añadir un índice en `status` para consultas rápidas a la cola de pendientes.")
  - (Ejemplo: "Implementar un límite de tamaño de la base de datos local y un proceso de limpieza.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)