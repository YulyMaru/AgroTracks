# SPIKE-006: Validar consulta offline, persistencia y conectividad

## Información general

- **ID:** SPIKE-006
- **Nombre:** Validar consulta offline, persistencia al cerrar y detección de conectividad
- **ADR relacionado:** ADR-006 — Consultar datos offline y detectar conectividad
- **ADR complementarios:** ADR-001 (Implementar sincronización offline con retry y backoff), ADR-005 (Registrar offline con SQLite y cola de pendientes)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles (24 horas hombre)

## 1. Objetivo

Validar que el usuario puede consultar información previamente almacenada sin conexión, que los datos persisten después de cerrar la aplicación, y que al recuperar la conectividad el sistema detecta automáticamente los registros pendientes e inicia la sincronización, cumpliendo con los escenarios ESC-CAL-DP-02, ESC-CAL-DP-06 y ESC-CAL-DP-03.

El Spike busca comprobar que el repositorio local (SQLite) y el monitor de conectividad funcionan de forma integrada antes de implementarlos en todos los módulos de AgroTrack.

## 2. Problema que se busca validar

AgroTrack debe permitir al campesino consultar su información sin conexión y sincronizarla automáticamente al recuperar la red, pero existen riesgos de que:

- Las consultas offline sean lentas (> 2 s) y degraden la experiencia.
- Los datos no persistan al cerrar la aplicación.
- El monitor de conectividad no detecte la recuperación de red.
- La sincronización no se active automáticamente al reconectar.
- El usuario no sepa si está viendo datos locales o sincronizados.
- La red rural aparezca y desaparezca varias veces, disparando sincronizaciones innecesarias.

Por esta razón, se necesita un prototipo que implemente el repositorio local persistente y el monitor de conectividad, y se pruebe en escenarios realistas de red intermitente.

## 3. Pregunta principal del Spike

¿La base de datos local permite consultar información sin conexión en menos de 2 segundos de forma persistente, y el monitor de conectividad detecta correctamente la recuperación de la red para activar la sincronización automática de los registros pendientes?

## 4. Hipótesis

Si implementamos un repositorio local basado en SQLite y un monitor de conectividad, entonces:

- Las consultas sin conexión devolverán datos en < 2 segundos para hasta 100 registros.
- Los datos persistirán al cerrar y reabrir la app.
- La sincronización se activará automáticamente al recuperar la red.
- El usuario verá un indicador de "datos locales" cuando no haya conexión.
- El sistema tolerará apariciones y desapariciones frecuentes de red sin disparar sincronizaciones innecesarias.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Consulta de lista de gastos desde SQLite (sin conexión).
- Verificación de persistencia al cerrar y abrir la app.
- Monitor de conectividad (`NetInfo`) que detecta cambios de red.
- Activación automática de sincronización mock al recuperar la red.
- Indicador visual de estado de conectividad (ej. "Sin conexión - datos locales").
- Fecha y hora de la última sincronización exitosa visible para el usuario.
- Medición del tiempo de consulta offline con 50 y 100 registros.

### 5.2 No incluye

El Spike no implementará:

- Sincronización real con el backend (se usará un mock).
- Todas las entidades de AgroTrack (solo gastos para pruebas).
- Resolución de conflictos entre datos locales y remotos.
- Optimización de rendimiento para más de 100 registros.
- Sistema completo de autenticación (se usará un usuario mock).
- Notificaciones push ni WebSockets.

## 6. Caso de prueba principal

Se utilizará la lista de gastos y el resumen económico para comprobar el ciclo offline completo.

**Datos de prueba:**

- 50 gastos de ejemplo con diferentes montos y fechas.
- 100 gastos de ejemplo para la prueba de rendimiento.
- Al menos 3 registros con estado `PENDING` (creados en SPIKE-005) para la prueba de sincronización.

**Escenarios:**

1. **Consulta offline con datos locales**: el usuario abre la lista de gastos sin conexión y ve los datos almacenados.
2. **Persistencia al cerrar**: el usuario cierra la app y la reabre; los datos siguen visibles.
3. **Detección de red**: el usuario recupera la conexión y el monitor detecta el cambio.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Consulta offline con datos locales

**Objetivo:** Validar que la lista de gastos se muestra desde SQLite sin conexión en < 2 segundos.

#### Procedimiento
1. Desactivar la conexión a Internet del dispositivo (modo avión).
2. Abrir la lista de gastos.
3. Cronometrar el tiempo desde que se solicita la pantalla hasta que se renderizan los datos.
4. Repetir 3 veces con 50 registros y 3 veces con 100 registros.
5. Promediar los tiempos.

#### Resultado esperado
- La lista muestra los datos locales (no un estado vacío ni un error).
- El tiempo de carga es < 1 s para 50 registros y < 2 s para 100 registros.
- La UI no se congela durante la consulta.

---

### 7.2 Prueba 2 — Persistencia al cerrar la app

**Objetivo:** Validar que los datos sobreviven al cierre y reapertura de la aplicación.

#### Procedimiento
1. Con datos cargados (gastos sincronizados y pendientes), cerrar completamente la app (forzar cierre o swipar desde el task manager).
2. Volver a abrir la aplicación.
3. Navegar a la lista de gastos.
4. Verificar que los datos siguen visibles.
5. Verificar en la base de datos que los registros persisten.

#### Resultado esperado
- La lista muestra los mismos datos que antes de cerrar.
- Los registros `PENDING` siguen marcados como pendientes.
- La base de datos mantiene la integridad.

---

### 7.3 Prueba 3 — Detección de conectividad y activación de sincronización

**Objetivo:** Validar que el monitor detecta la recuperación de red y activa la sincronización automática.

#### Procedimiento
1. Tener al menos 3 registros pendientes (creados en modo offline).
2. Estar sin conexión.
3. Activar la conexión a Internet.
4. Observar el comportamiento del monitor de conectividad.
5. Verificar que la sincronización se activa automáticamente.
6. Confirmar que los registros pasan de `PENDING` a `SYNCED`.

#### Resultado esperado
- El monitor detecta la recuperación de red en < 5 s.
- La sincronización se activa sin intervención del usuario.
- Los 3 registros pendientes se sincronizan correctamente.
- El estado local cambia a `SYNCED`.

---

### 7.4 Prueba 4 — Indicador visual de conectividad

**Objetivo:** Validar que el usuario ve un indicador claro del estado de conexión.

#### Procedimiento
1. Con conexión activa, abrir la app.
2. Verificar que el indicador muestra "Conectado" o similar.
3. Desactivar la conexión.
4. Verificar que el indicador cambia a "Sin conexión - datos locales".
5. Verificar que se muestra la fecha y hora de la última sincronización exitosa.
6. Reactivar la conexión.
7. Verificar que el indicador vuelve a "Conectado".

#### Resultado esperado
- El indicador refleja el estado real de conexión.
- El mensaje es claro y no técnico.
- La fecha de última sincronización es visible y actualizada.
- La transición entre estados es inmediata (< 2 s).

---

### 7.5 Prueba 5 — Tolerancia a red intermitente

**Objetivo:** Validar que el monitor tolera apariciones y desapariciones frecuentes de red sin disparar sincronizaciones innecesarias.

#### Procedimiento
1. Con 3 registros pendientes, activar y desactivar la conexión 5 veces en 1 minuto.
2. Observar cuántas veces se dispara la sincronización.
3. Verificar que no hay sincronizaciones duplicadas ni errores.

#### Resultado esperado
- El monitor no dispara sincronización en cada cambio de red.
- La sincronización se ejecuta una sola vez cuando la red es estable.
- No hay errores ni duplicación de registros.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Consulta offline**: La lista de gastos se carga desde SQLite en < 2 s para 100 registros.
2. **Persistencia**: El 100 % de los datos sobrevive al cierre y reapertura de la app.
3. **Detección de conectividad**: El monitor detecta la recuperación de red en < 5 s.
4. **Sincronización automática**: Los registros `PENDING` se sincronizan automáticamente al recuperar la conexión.
5. **Indicador visual**: El usuario ve un indicador claro de "datos locales" / "conectado" y la última fecha de sincronización.
6. **Tolerancia a red intermitente**: El sistema no dispara sincronizaciones innecesarias ante cambios frecuentes de red.

El Spike se considerará **RECHAZADO** si:

- La consulta offline supera los 2 s para 100 registros.
- Algún dato se pierde al cerrar la app.
- El monitor no detecta la recuperación de red.
- La sincronización no se activa automáticamente.
- Se generan sincronizaciones duplicadas por cambios frecuentes de red.

## 9. Entorno técnico del spike

Para la ejecución de este Spike, se utilizará el siguiente stack:

- **Cliente móvil**: React Native o Flutter (el que use AgroTrack).
- **Base de datos local**: SQLite (con `react-native-sqlite-storage` o `sqflite`).
- **Monitor de conectividad**: `@react-native-community/netinfo` (React Native) o `connectivity_plus` (Flutter).
- **Sincronización mock**: Un servicio que simula el envío al backend (log en consola) y cambia el estado de los registros a `SYNCED`.
- **UI de prueba**: Lista de gastos con indicador de estado de conexión.
- **Medición**: `console.time` / `console.timeEnd` o herramientas de perfilado del framework.
- **Datos de prueba**: Script de generación de 50 y 100 gastos de ejemplo.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: El monitor de conectividad puede no detectar cambios de red en algunos dispositivos.
  - **Mitigación**: Probar en al menos 3 dispositivos de gama diferente. Considerar polling adicional si es necesario.

- **Riesgo**: La red rural puede aparecer y desaparecer varias veces en minutos, disparando sincronizaciones innecesarias.
  - **Mitigación**: Implementar un debounce (esperar 5-10 s de red estable antes de sincronizar).

- **Riesgo**: SQLite puede tener problemas de rendimiento con consultas sobre 100 registros en dispositivos de gama baja.
  - **Mitigación**: Crear índices en `status` y `created_at`. Medir en dispositivo de gama baja.

- **Riesgo**: La fecha de última sincronización puede quedar desactualizada si la sincronización falla silenciosamente.
  - **Mitigación**: Actualizar la fecha solo cuando la sincronización sea confirmada por el backend.

- **Riesgo**: El indicador visual puede no ser claro para el usuario.
  - **Mitigación**: Probar los mensajes con usuarios reales. Usar lenguaje coloquial ("Sin conexión, mostrando datos guardados").

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Repositorio local (SQLite) con consultas optimizadas.
   - Monitor de conectividad (`NetInfo`) configurado.
   - Lógica de sincronización automática al recuperar red.
   - Indicador visual de estado de conexión.
2. **Reporte de pruebas**:
   - Resultados de las 5 pruebas (consulta, persistencia, detección, indicador, tolerancia).
   - Tiempos de consulta para 50 y 100 registros.
   - Capturas o video del flujo completo.
3. **Evidencia**:
   - Capturas de pantalla del indicador en los 2 estados (conectado / sin conexión).
   - Logs de la base de datos mostrando cambios de estado.
   - Video demostrando los 3 flujos principales (consulta, persistencia, sincronización).
4. **Este documento actualizado** con la sección de "Conclusión del Spike" llenada, incluyendo recomendaciones para la implementación en producción.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿La consulta offline se completó en < 2 s para 100 registros?
  - ✅ / ❌ ¿Los datos persistieron al cerrar y reabrir la app?
  - ✅ / ❌ ¿El monitor detectó la recuperación de red en < 5 s?
  - ✅ / ❌ ¿La sincronización se activó automáticamente?
  - ✅ / ❌ ¿El indicador visual fue claro para el usuario?
  - ✅ / ❌ ¿El sistema toleró la red intermitente sin disparar sync innecesarias?

- **Lecciones aprendidas**:
  - (Ejemplo: "El debounce de 5 s es suficiente para evitar sincronizaciones duplicadas.")
  - (Ejemplo: "Los mensajes técnicos como 'Sin conexión' no son claros para el usuario; usar 'Mostrando datos guardados'.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Añadir índices en `status` y `created_at` para consultas rápidas.")
  - (Ejemplo: "Implementar un límite de antigüedad de la fecha de última sincronización.")
  - (Ejemplo: "Considerar un mecanismo de sincronización manual como respaldo.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)