# SPIKE-004: Validar estados vacíos y comunicación de ausencia de datos

## Información general

- **ID:** SPIKE-004
- **Nombre:** Validar estados vacíos y mensajes de ausencia de información
- **ADR relacionado:** ADR-004 — Comunicar ausencia de datos con estados vacíos
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Media-Alta
- **Timebox estimado:** 2 días hábiles (16 horas hombre)

## 1. Objetivo

Validar técnica y cualitativamente que el componente de estado vacío contextual permite al usuario identificar claramente que no hay datos para una consulta, diferenciarlo de un error, y lo guía hacia una acción útil, tal como lo exige el escenario de calidad ESC-CAL-US-13.

El Spike busca comprobar que el componente `EmptyState` es fácil de integrar, se comporta correctamente en diferentes módulos, y que los mensajes personalizados son comprendidos por el usuario objetivo.

## 2. Problema que se busca validar

AgroTrack debe comunicar explícitamente cuando una consulta no tiene resultados, pero existen riesgos de que:

- El usuario confunda una pantalla vacía con un error de la aplicación.
- El usuario no sepa qué hacer a continuación (falta de orientación).
- Los mensajes sean genéricos y no contextuales, generando confusión.
- No se distinga entre "no hay datos" y "falló la carga" (error de red, timeout).
- El componente no sea reutilizable y se duplique código innecesariamente.

Por esta razón, se necesita un prototipo que implemente el componente en al menos dos pantallas diferentes y se valide con usuarios.

## 3. Pregunta principal del Spike

¿Un componente `EmptyState` con icono, mensaje contextual y acción sugerida, junto con un `ErrorState` diferenciado, permite que el 100 % de los usuarios objetivo identifiquen correctamente que no hay datos y sepan qué acción tomar, evitando la confusión con errores de sistema?

## 4. Hipótesis

Si implementamos un componente `EmptyState` con las siguientes características:

- Icono/ilustración amigable (ej. lupa, calendario, lista vacía).
- Título claro: "No hay [X] registrados".
- Descripción contextual: "Para el período [Y] y el cultivo [Z]".
- Botón de acción sugerida: "Registrar [X]" o "Seleccionar otro período".

Entonces:

- El 100 % de los usuarios identificará que no hay datos (y no un error).
- Al menos el 90 % de los usuarios hará clic en la acción sugerida o expresará su intención de hacerlo.
- Los desarrolladores podrán reutilizar el componente con menos de 5 líneas de código por pantalla.

Además, si mostramos un `ErrorState` (con un icono de advertencia y botón "Reintentar") cuando hay un fallo de red, el 100 % de los usuarios distinguirá ambos estados.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Creación del componente `EmptyState` (icono, título, descripción, botón de acción).
- Creación del componente `ErrorState` (icono de error, mensaje, botón "Reintentar").
- Integración en al menos 2 pantallas:
  1. **Lista de gastos** (vacía).
  2. **Resultados económicos** (sin movimientos).
- Datos de prueba: un escenario con datos, otro sin datos, y otro con simulación de error de red.
- Lógica de estado en las pantallas: `loading`, `success (con datos)`, `empty`, `error`.
- Pruebas de usabilidad con 3 participantes (campesinos o simuladores) para evaluar comprensión.
- Registro de tiempos de implementación para medir reusabilidad.

### 5.2 No incluye

El Spike no implementará:

- Ilustraciones complejas (se usarán iconos vectoriales básicos).
- Animaciones avanzadas.
- Integración con el sistema de sincronización offline (asume que la consulta ya devolvió un resultado).
- Mensajes internacionalizados (solo español).
- Personalización de estilos por módulo más allá del texto y acción (se usará un diseño consistente).
- Pruebas con más de 3 participantes (se documentará como limitación del spike).

## 6. Caso de prueba principal

Se utilizarán dos módulos de ejemplo:

**Módulo 1: Gastos**
- Escenario vacío: "No hay gastos registrados para enero de 2026. ¡Registra tu primer gasto!".

**Módulo 2: Resultados económicos**
- Escenario vacío: "No hay movimientos en este período. Los resultados se mostrarán cuando registres ingresos o gastos.".

**Escenario de error (simulado)**: desconectar el internet y forzar un fallo de red. Se debe mostrar el `ErrorState` con "No pudimos cargar la información. Verifica tu conexión e intenta de nuevo.".

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Distinción entre estado vacío y estado con datos

**Objetivo:** Validar que el componente `EmptyState` se muestra solo cuando no hay datos, y que los datos se muestran correctamente cuando existen.

#### Procedimiento
1. Cargar la pantalla de gastos con datos de prueba (al menos 3 registros).
2. Verificar que se muestra la lista de gastos (no el `EmptyState`).
3. Limpiar los datos (simular que no hay gastos).
4. Recargar la pantalla.
5. Verificar que se muestra el `EmptyState` con el mensaje correspondiente.

#### Resultado esperado
- La transición entre ambos estados debe ser clara.
- El `EmptyState` solo aparece cuando el arreglo de datos está vacío.

---

### 7.2 Prueba 2 — Distinción entre estado vacío y estado de error

**Objetivo:** Validar que el usuario (y el sistema) distingue claramente entre "no hay datos" y "falló la carga".

#### Procedimiento
1. Con conexión activa, ir a la pantalla de gastos. (Debería mostrar datos o estado vacío).
2. Desactivar la conexión a Internet.
3. Forzar un reintento de carga (pull-to-refresh o recarga).
4. Observar el componente mostrado.
5. Activar nuevamente la conexión y hacer clic en "Reintentar".
6. Observar que los datos (o el estado vacío) vuelven a aparecer.

#### Resultado esperado
- En el paso 3, debe mostrarse el `ErrorState` (no el `EmptyState`).
- El `ErrorState` debe tener un mensaje diferente (ej. "Error de conexión") y un botón de "Reintentar".
- En el paso 5, debe recuperarse el estado correcto (datos o vacío).

---

### 7.3 Prueba 3 — Comprensión del estado vacío (Usabilidad)

**Objetivo:** Validar que los usuarios identifican correctamente el estado vacío y entienden la acción sugerida.

#### Procedimiento
1. Mostrar a 3 participantes la pantalla de gastos en estado vacío (con el componente `EmptyState`).
2. Preguntar: "¿Qué significa lo que ves en la pantalla?".
3. Preguntar: "¿Qué crees que puedes hacer ahora?".
4. Repetir con la pantalla de resultados en estado vacío (otro mensaje).
5. Registrar las respuestas.

#### Resultado esperado
- El 100 % de los participantes debe identificar que la pantalla de `EmptyState` significa que no hay registros (no que la app está dañada).
- Al menos el 90 % debe mencionar la acción sugerida (ej. "Darle a registrar gasto") o expresar que debe agregar información.

---

### 7.4 Prueba 4 — Diferenciación entre estado vacío y estado de error (Usabilidad)

**Objetivo:** Validar que los usuarios distinguen claramente un estado vacío de un error del sistema.

#### Procedimiento
1. Mostrar a los mismos 3 participantes la pantalla con `ErrorState` (simulando error de red).
2. Preguntar: "¿Es lo mismo que viste antes? ¿Qué crees que pasó?".
3. Preguntar: "¿Qué harías en este caso?".
4. Registrar las respuestas.

#### Resultado esperado
- El 100 % de los participantes debe diferenciar el `EmptyState` del `ErrorState`.
- El 100 % debe identificar el `ErrorState` como un problema de conexión (no como "no hay datos").
- Al menos el 80 % debe mencionar el botón "Reintentar" como acción esperada.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Diferenciación de estados**: El sistema muestra correctamente `EmptyState` para listas vacías y `ErrorState` para fallos de red/servidor, sin confundirlos.
2. **Reusabilidad**: El componente `EmptyState` se integra en al menos 2 pantallas diferentes con menos de 5 líneas de código cada una.
3. **Comprensión de vacío**: El 100 % de los participantes identifica que `EmptyState` significa "sin datos".
4. **Diferenciación de error**: El 100 % de los participantes identifica que `ErrorState` significa "problema técnico".
5. **Orientación a la acción**: Al menos el 90 % de los participantes entiende la acción sugerida y expresa su disposición a realizarla.
6. **Tiempo de implementación**: El desarrollo del componente base no supera las 4 horas de trabajo.

El Spike se considerará **RECHAZADO** si:

- Alguno de los participantes confunde `EmptyState` con `ErrorState`.
- El componente no es reutilizable (más de 5 líneas por pantalla).
- El tiempo de implementación del componente base supera las 6 horas.
- Los mensajes no son comprendidos por los usuarios.

## 9. Entorno técnico del spike

Para la ejecución de este Spike, se utilizará el siguiente stack:

- **Cliente móvil**: React Native / Flutter (el que use AgroTrack).
- **Componentes**:
  - `EmptyState`: recibe `iconName`, `title`, `description`, `actionLabel`, `onAction`.
  - `ErrorState`: recibe `errorTitle`, `errorDescription`, `onRetry`.
- **Manejo de estado**: Estados locales `loading`, `data`, `error`, `empty` en el componente contenedor.
- **Simulación**: Datos mock en un archivo JSON, y un interruptor para simular fallo de red.
- **Pruebas**: Uso de `console.log` o herramientas de debugging para verificar transiciones de estado.
- **Documentación de usabilidad**: Formato de registro de respuestas por participante.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Los mensajes de texto pueden no ser lo suficientemente claros para el usuario.
  - **Mitigación**: Los mensajes serán redactados en colaboración con el Product Owner y validados en las pruebas de usabilidad. Se ajustarán según feedback.

- **Riesgo**: El icono elegido puede no ser intuitivo (ej. una lupa puede interpretarse como "buscar" en lugar de "sin resultados").
  - **Mitigación**: Usar iconos comúnmente asociados con vacío (ej. carpeta vacía, lista vacía, calendario sin marcas). Validar en las pruebas.

- **Riesgo**: El componente `EmptyState` se use en contextos donde no tiene sentido una acción (ej. una consulta histórica fija).
  - **Mitigación**: La acción será opcional; si no se provee, solo se muestra el mensaje.

- **Riesgo**: La muestra de 3 participantes puede no ser representativa.
  - **Mitigación**: Documentar las limitaciones del spike. En la implementación final, ampliar a al menos 10 participantes de diferentes perfiles.

- **Riesgo**: Los participantes pueden confundir "no hay datos" con "no hay resultados por un filtro mal aplicado".
  - **Mitigación**: Incluir en los mensajes la referencia al período y filtros aplicados (ej. "No hay gastos para enero de 2026 con los filtros seleccionados").

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con los componentes `EmptyState` y `ErrorState`, y su integración en las 2 pantallas de ejemplo.
2. **Reporte de pruebas**:
   - Resultados de las pruebas de transición de estados (diferencia entre vacío y error).
   - Resultados de las pruebas de usabilidad (respuestas de los participantes, con métricas y observaciones cualitativas).
   - Tiempo de implementación del componente base.
3. **Evidencia visual**:
   - Capturas de pantalla de los 4 estados (`loading`, `success`, `empty`, `error`).
   - Video (máx 2 minutos) mostrando los diferentes estados en acción y las respuestas de los usuarios.
4. **Este documento actualizado** con la sección de "Conclusión" llenada, incluyendo recomendaciones sobre los mensajes y acciones para cada módulo en la implementación definitiva.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El sistema diferenció correctamente `EmptyState` y `ErrorState`?
  - ✅ / ❌ ¿El componente se integró en 2 pantallas con < 5 líneas?
  - ✅ / ❌ ¿El 100 % de los participantes identificó "sin datos"?
  - ✅ / ❌ ¿El 100 % de los participantes identificó "problema técnico"?
  - ✅ / ❌ ¿Al menos el 90 % entendió la acción sugerida?
  - ✅ / ❌ ¿El componente base se desarrolló en < 4 horas?

- **Lecciones aprendidas**:
  - (Ejemplo: "El icono de lupa se interpretó como 'buscar', no como 'sin resultados'.")
  - (Ejemplo: "El lenguaje coloquial ('No hay gastos') funciona mejor que el técnico ('Sin transacciones').")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Definir un set de mensajes estandarizados por módulo desde el inicio.")
  - (Ejemplo: "Incluir la referencia al período y filtros en los mensajes.")
  - (Ejemplo: "Ampliar las pruebas de usabilidad a al menos 10 participantes.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)