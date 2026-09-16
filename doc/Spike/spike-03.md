# SPIKE-003: Validar presentación y comprensión de resultados económicos

## Información general

- **ID:** SPIKE-003
- **Nombre:** Validar comprensión y rendimiento del panel de resultados económicos
- **ADR relacionado:** ADR-003 — Presentar resultados económicos en tarjetas
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Alta
- **Timebox estimado:** 3 días hábiles (24 horas hombre)

## 1. Objetivo

Validar técnica y cualitativamente que el panel de control de resultados económicos (tres tarjetas diferenciadas) permite al campesino identificar correctamente los ingresos, gastos y resultado, tal como lo exige el escenario de calidad ESC-CAL-US-06.

El Spike busca comprobar dos cosas:

1. **Comprensión del usuario**: que la separación visual, el uso de colores, iconos y mensajes textuales es suficiente para lograr una comprensión del 100 % en usuarios objetivo.
2. **Rendimiento y exactitud**: que el cálculo y renderizado son rápidos y precisos con hasta 500 registros.

## 2. Problema que se busca validar

AgroTrack debe presentar información económica de manera que el campesino entienda su situación financiera, pero existen riesgos de que:

- El usuario confunda ingresos con gastos si no se diferencian claramente.
- El usuario no comprenda si el resultado es positivo o negativo.
- El usuario se sienta abrumado si se muestra demasiada información.
- Los cálculos sean incorrectos debido a errores en la suma o en la categorización.
- El tiempo de carga sea alto al procesar muchos registros.
- Los colores verde/rojo no sean distinguibles para usuarios con daltonismo.

Por esta razón, se necesita un prototipo funcional que se pueda poner frente a usuarios reales para medir su comprensión.

## 3. Pregunta principal del Spike

¿Un panel de control con tres tarjetas diferenciadas (Ingresos, Gastos, Resultado), usando colores semánticos, iconos y una etiqueta textual clara (Ganancia/Pérdida), logra que el 100 % de los usuarios objetivo identifiquen correctamente cada concepto en una consulta de resultados económicos, y el cálculo/renderizado se completa en < 300 ms para 500 registros?

## 4. Hipótesis

Si presentamos los resultados en tres tarjetas separadas:

- La tarjeta de **Ingresos** tendrá fondo verde claro, icono de flecha hacia arriba y etiqueta "Ingresos totales".
- La tarjeta de **Gastos** tendrá fondo rojo claro, icono de flecha hacia abajo y etiqueta "Gastos totales".
- La tarjeta de **Resultado** tendrá un tamaño mayor, bordeado, con el número en grande y una etiqueta dinámica: "Ganancia" (verde) o "Pérdida" (rojo).

Entonces:

- Los usuarios podrán señalar sin error cuál es el ingreso, cuál es el gasto y cuál es el resultado.
- Entenderán si el período fue positivo o negativo.
- El cálculo de estos totales a partir de 500 registros no superará los 200 ms en el dispositivo y 500 ms en el backend (en modo online).
- El renderizado completo del panel no superará los 300 ms en el dispositivo.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Datos de prueba (10 ingresos y 10 gastos) con diferentes montos y fechas dentro de un periodo ficticio.
- Cálculo en cliente (offline) y en servidor (online) de los totales.
- Componentes UI para las tres tarjetas con colores, iconos y etiquetas.
- Indicación del periodo consultado (ej. "Enero 2026").
- Un botón "Ver detalle" que no lleva a ninguna parte (placeholder) para validar que no interfiere con la comprensión.
- Pruebas de usabilidad con al menos 3 campesinos (o personal que simule el perfil) para medir identificación de conceptos.
- Registro de tiempos de cálculo y renderizado en cliente (con 50, 200 y 500 registros).

### 5.2 No incluye

El Spike no implementará:

- Gráficos complejos (barras, líneas, circulares).
- Comparativa con períodos anteriores.
- Filtros avanzados (por cultivo, por categoría).
- La vista detallada de movimientos (solo el placeholder del botón).
- Exportación de datos (PDF, Excel).
- Internacionalización de etiquetas (solo español).
- Persistencia de la selección de período (se usará uno fijo para pruebas).

## 6. Caso de prueba principal

Se utilizará un conjunto de datos de ejemplo que represente un mes de actividad en una finca.

**Datos de ejemplo:**

- Ingresos: venta de café ($80.000), venta de plátano ($45.000), total = $125.000.
- Gastos: fertilizante ($30.000), mano de obra ($20.000), transporte ($10.000), total = $60.000.
- Resultado = $125.000 - $60.000 = $65.000 (Ganancia).

**Escenarios adicionales:**

- Resultado = $0 → etiqueta "Punto de equilibrio".
- Resultado negativo (ej. -$15.000) → etiqueta "Pérdida".

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Corrección del cálculo (offline y online)

**Objetivo:** Validar que la suma de ingresos y gastos, y el cálculo del resultado, son exactos en ambos entornos.

#### Procedimiento
1. Cargar los datos de ejemplo en el almacenamiento local del dispositivo (simulando registros previos).
2. Desactivar la conexión y consultar el panel de resultados.
3. Anotar los valores mostrados.
4. Activar la conexión y consultar nuevamente el panel (obteniendo los datos del servidor).
5. Comparar los valores locales vs los del servidor.
6. Repetir con el escenario de resultado $0 y el escenario negativo.

#### Resultado esperado
- Ambos cálculos (offline y online) deben coincidir exactamente con los datos de prueba.
- Para el escenario principal: resultado $65.000 y etiqueta "Ganancia".
- Para el escenario $0: etiqueta "Punto de equilibrio" con color neutro.
- Para el escenario negativo: etiqueta "Pérdida" con color rojo.

---

### 7.2 Prueba 2 — Comprensión visual (Usabilidad)

**Objetivo:** Verificar que el usuario identifica correctamente Ingresos, Gastos y Resultado en el panel.

#### Procedimiento
1. Mostrar el panel a 3 participantes (campesinos o personal con perfil similar).
2. Sin dar explicaciones previas, pedirles que señalen con el dedo o digan:
   - "¿Cuánto dinero entró?" (ingresos).
   - "¿Cuánto dinero salió?" (gastos).
   - "¿Ganaste o perdiste dinero? ¿Cuánto?" (resultado).
3. Registrar si la respuesta es correcta o no.
4. Preguntarles qué significa el color verde y rojo en el contexto.
5. Preguntarles si distinguen bien los colores (para detectar daltonismo).

#### Resultado esperado
- El 100 % de los participantes debe identificar correctamente los tres conceptos.
- Al menos el 90 % debe asociar el verde con "ganancia/bueno" y el rojo con "gasto/malo" (o si es resultado, "pérdida").
- Ningún participante debe depender únicamente del color para diferenciar los conceptos (deben poder usar iconos o etiquetas).

---

### 7.3 Prueba 3 — Rendimiento (tiempo de cálculo y renderizado)

**Objetivo:** Medir el tiempo que tarda el dispositivo en calcular y renderizar el panel con diferentes volúmenes de datos.

#### Procedimiento
1. Generar conjuntos de datos de 50, 200 y 500 movimientos.
2. Medir con herramientas de perfilado (ej. React DevTools o logs) el tiempo desde que se solicita el resultado hasta que se renderizan las tarjetas.
3. Repetir 3 veces cada conjunto y promediar.

#### Resultado esperado
- Para 50 registros: < 50 ms.
- Para 200 registros: < 150 ms.
- Para 500 registros: < 300 ms.
- La UI no debe "tartamudear" (frames congelados) durante el cálculo.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Exactitud de datos**: El cálculo de ingresos, gastos y resultado es exacto en un 100 % comparado con los datos fuente (tanto offline como online).
2. **Comprensión de usuarios**: En las pruebas de usabilidad, el 100 % de los participantes identifica correctamente ingresos, gastos y resultado.
3. **Claridad de etiquetas**: El 100 % de los participantes entiende el significado de las etiquetas "Ganancia", "Pérdida" y "Punto de equilibrio".
4. **Rendimiento**: El tiempo de cálculo y renderizado para 500 registros no supera los 300 ms.
5. **Separación visual**: Los colores, iconos y posición permiten diferenciar los conceptos sin necesidad de leer las etiquetas (evaluado cualitativamente).
6. **Accesibilidad**: Ningún participante depende exclusivamente del color para diferenciar los conceptos.

El Spike se considerará **RECHAZADO** si:

- Alguno de los cálculos no coincide con los datos fuente.
- Más del 10 % de los participantes confunde ingresos con gastos o no entiende el resultado.
- El tiempo de renderizado para 500 registros supera los 300 ms.
- Los usuarios con daltonismo no pueden diferenciar los conceptos.

## 9. Entorno técnico del spike

Para la ejecución de este Spike, se utilizará el siguiente stack:

- **Cliente móvil**: React Native / Flutter (el que use AgroTrack). Se utilizarán componentes funcionales con estado local.
- **Lógica de cálculo**: Función pura `calculateEconomicResult(transactions)` que recibe un arreglo de transacciones y devuelve `{ totalIncome, totalExpense, netResult }`.
- **Datos de prueba**: Archivo JSON estático con movimientos, cargado localmente para las pruebas offline.
- **Servidor (mock)**: Endpoint simple que devuelve el mismo JSON o que aplica la misma función de cálculo.
- **Diseño**: Uso de la librería de iconos del framework (ej. `react-native-vector-icons`) y estilos inline o con `StyleSheet`.
- **Medición de rendimiento**: React DevTools Profiler, `console.time` / `console.timeEnd`, o logs de tiempo.
- **Documentación de usabilidad**: Formato de registro de respuestas por participante.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Los colores elegidos (verde/rojo) pueden no ser distinguibles para usuarios con daltonismo.
  - **Mitigación**: Incluir iconos (↑, ↓, ⚖️) y patrones de borde (línea sólida, punteada, doble) para complementar el color. Preguntar explícitamente en las pruebas de usabilidad si hay problemas de diferenciación.

- **Riesgo**: El resultado de $0 (equilibrio) puede confundir.
  - **Mitigación**: Mostrar etiqueta "Punto de equilibrio" y un color neutro (gris o azul) para ese caso. Validar en las pruebas con un escenario $0.

- **Riesgo**: Los usuarios pueden confundir "Ganancia" con "Ingresos".
  - **Mitigación**: Usar siempre "Ingresos totales" y "Resultado (Ganancia)" para enfatizar la diferencia. Validar en las pruebas.

- **Riesgo**: La muestra de 3 participantes puede no ser representativa.
  - **Mitigación**: Documentar las limitaciones del spike. En la implementación final, ampliar a al menos 10 participantes de diferentes perfiles.

- **Riesgo**: El cálculo en cliente con 500 registros puede degradar la experiencia en dispositivos de gama baja.
  - **Mitigación**: Medir el rendimiento en al menos un dispositivo de gama baja. Si es necesario, delegar el cálculo al servidor (online) y usar el cliente solo para caché.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con el cliente y mock de servidor.
2. **Reporte de pruebas**:
   - Resultados de las pruebas de cálculo (exactitud en offline y online).
   - Resultados de las pruebas de usabilidad (comprensión), incluyendo métricas y observaciones cualitativas.
   - Resultados de las pruebas de rendimiento (tiempos para 50, 200 y 500 registros).
3. **Evidencia visual**:
   - Capturas de pantalla de las tres tarjetas en los 3 escenarios (ganancia, pérdida, equilibrio).
   - Video (máx 2 minutos) mostrando el panel en acción y las respuestas de los usuarios durante las pruebas.
4. **Este documento actualizado** con la sección de "Conclusión" llenada (recomendaciones finales sobre colores, iconos y etiquetas para la implementación definitiva).

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Los cálculos offline y online coincidieron con los datos fuente?
  - ✅ / ❌ ¿El 100 % de los participantes identificó ingresos, gastos y resultado?
  - ✅ / ❌ ¿El 100 % entendió las etiquetas "Ganancia" y "Pérdida"?
  - ✅ / ❌ ¿El tiempo de renderizado para 500 registros fue < 300 ms?
  - ✅ / ❌ ¿Los usuarios con daltonismo pudieron diferenciar los conceptos?

- **Lecciones aprendidas**:
  - (Ejemplo: "El color por sí solo no es suficiente; los iconos y las etiquetas son clave.")
  - (Ejemplo: "El orden Ingresos → Gastos → Resultado cuenta una historia lógica.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Usar iconos (↑, ↓, =) además del color para accesibilidad.")
  - (Ejemplo: "Definir un color neutro para el punto de equilibrio.")
  - (Ejemplo: "Ampliar las pruebas de usabilidad a al menos 10 participantes.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)