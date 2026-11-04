# SPIKE-008: Validar detección de datos insuficientes para análisis

## Información general

- **ID:** SPIKE-008
- **Nombre:** Validar detección de información insuficiente en análisis económicos
- **ADR relacionado:** ADR-008 — Advertir análisis incompletos con datos faltantes
- **ADR complementarios:** ADR-003 (Presentar resultados económicos en tarjetas), ADR-004 (Comunicar ausencia de datos con estados vacíos)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Completado parcialmente — parte técnica aprobada, faltan pruebas con usuarios o dispositivos
- **Fecha de ejecución:** 2026-10-29
- **Prioridad:** Alta
- **Timebox estimado:** 2 días hábiles 

## 1. Objetivo

Validar que el sistema detecta cuándo un análisis económico no tiene todos los datos requeridos, muestra una advertencia clara y explícita, identifica los datos faltantes, y presenta el resultado parcial con un indicador de "incompleto" sin engañar al usuario, cumpliendo con el escenario de calidad ESC-CAL-CF-08.

El Spike busca comprobar que las reglas de integridad son fáciles de definir y que la interfaz de advertencia es comprensible para el usuario objetivo.

## 2. Problema que se busca validar

AgroTrack debe evitar que el campesino tome decisiones basadas en análisis incompletos, pero existen riesgos de que:

- El usuario vea un resultado positivo y asuma que todo está bien, sin saber que faltan gastos por registrar.
- El sistema muestre un resultado parcial sin indicar que está incompleto.
- El mensaje de advertencia sea genérico y no ayude al usuario a saber qué hacer.
- Las reglas de integridad no estén bien definidas y el sistema no detecte adecuadamente los faltantes.
- El usuario confunda "datos insuficientes" con "sin datos" (estado vacío, ADR-004).

Por esta razón, se necesita un prototipo que implemente la validación y advertencia para un análisis de ejemplo (Rentabilidad).

## 3. Pregunta principal del Spike

¿Un sistema que verifica los datos mínimos requeridos para un análisis, muestra una advertencia clara con los datos faltantes y presenta el resultado parcial con un indicador visual de "incompleto", permite que el usuario entienda que el análisis no es definitivo y sepa qué debe hacer para completarlo?

## 4. Hipótesis

Si implementamos una validación de integridad con las siguientes características:

- Verificación de datos mínimos (ej. para "Rentabilidad": ingresos y gastos del período).
- Mensaje de advertencia: "Análisis incompleto. Faltan datos de gastos para este período".
- Lista de datos faltantes: "Gastos de fertilizante, Gastos de mano de obra".
- Resultado parcial mostrado con borde naranja y etiqueta "Parcial".

Entonces:

- El 100 % de los usuarios identificará que el análisis no es definitivo.
- Al menos el 90 % de los usuarios sabrá qué datos debe registrar para completarlo.
- El resultado parcial se mostrará sin confundir al usuario.
- El usuario podrá diferenciar "datos insuficientes" de "sin datos" (estado vacío).

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Definición de reglas de integridad para el análisis de "Rentabilidad mensual" (requiere ingresos y gastos del mes).
- Un servicio de validación que retorne: `{ estaCompleto: boolean, datosFaltantes: string[] }`.
- Interfaz de ejemplo con:
  - Banner de advertencia si el análisis está incompleto.
  - Lista de datos faltantes.
  - Resultado parcial (ej. "Ingresos totales: $125,000") con indicador visual de "Parcial".
  - Botón para "Registrar datos faltantes" que redirija al formulario correspondiente.
- Diferenciación visual clara entre "datos insuficientes" y "sin datos" (estado vacío).
- Pruebas de usabilidad con 3 participantes para evaluar la comprensión.

### 5.2 No incluye

El Spike no implementará:

- Todos los tipos de análisis de AgroTrack (solo Rentabilidad mensual).
- La integración con el módulo de sincronización (se asume que los datos ya están almacenados localmente).
- La interfaz definitiva de la aplicación (se usará una pantalla de prueba).
- Gráficos complejos (solo números y etiquetas).
- Pruebas con más de 3 participantes (se documentará como limitación del spike).

## 6. Caso de prueba principal

**Análisis de ejemplo: Rentabilidad mensual**

**Datos mínimos requeridos:**
- Al menos 1 ingreso registrado en el mes.
- Al menos 1 gasto registrado en el mes.

**Escenarios:**
1. **Completo**: hay ingresos y gastos → mostrar resultado completo.
2. **Incompleto (faltan gastos)**: solo hay ingresos → mostrar advertencia y resultado parcial.
3. **Incompleto (faltan ingresos)**: solo hay gastos → mostrar advertencia y resultado parcial.
4. **Vacío**: no hay ni ingresos ni gastos → mostrar mensaje de ausencia de datos (ADR-004).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Detección de datos faltantes (gastos)

**Objetivo:** Validar que el sistema detecta la falta de gastos y muestra la advertencia correspondiente.

#### Procedimiento
1. Registrar en el sistema 2 ingresos para el mes de enero (ej. $80,000 y $45,000). No registrar gastos.
2. Navegar al análisis de Rentabilidad para enero.
3. Observar la pantalla.

#### Resultado esperado
- Se muestra el banner de advertencia: "Análisis incompleto".
- El mensaje dice: "Faltan datos de gastos para este período".
- La lista de datos faltantes muestra: "Gastos (ningún gasto registrado en enero)".
- El resultado parcial muestra: "Ingresos totales: $125,000" con un indicador "Parcial".
- No se muestra el resultado neto (o se muestra con un mensaje de "No disponible").
- El usuario tiene un botón para "Registrar gastos".


### 7.2 Prueba 2 — Detección de datos faltantes (ingresos)

**Objetivo:** Validar el caso simétrico cuando faltan ingresos.

#### Procedimiento
1. Registrar 3 gastos para el mes de febrero (ej. $30,000, $20,000, $10,000). No registrar ingresos.
2. Navegar al análisis de Rentabilidad para febrero.
3. Observar la pantalla.

#### Resultado esperado
- Banner de advertencia: "Análisis incompleto".
- Mensaje: "Faltan datos de ingresos para este período".
- Lista de datos faltantes: "Ingresos (ningún ingreso registrado en febrero)".
- Resultado parcial: "Gastos totales: $60,000" con indicador "Parcial".
- Botón para "Registrar ingresos".

### 7.3 Prueba 3 — Análisis completo (sin advertencia)

**Objetivo:** Validar que el sistema NO muestra advertencia cuando todos los datos están completos.

#### Procedimiento
1. Registrar 2 ingresos ($100,000, $50,000) y 3 gastos ($30,000, $20,000, $10,000) para marzo.
2. Navegar al análisis de Rentabilidad para marzo.
3. Observar la pantalla.

#### Resultado esperado
- No se muestra el banner de advertencia.
- Se muestran: Ingresos totales ($150,000), Gastos totales ($60,000), Resultado neto ($90,000 - Ganancia).
- No hay indicador de "Parcial".


### 7.4 Prueba 4 — Diferenciación entre "datos insuficientes" y "sin datos"

**Objetivo:** Validar que el usuario distingue claramente un análisis incompleto de un estado vacío.

#### Procedimiento
1. Mostrar al participante el escenario "vacío" (sin ingresos ni gastos) y preguntar: "¿Qué ves?".
2. Mostrar el escenario "incompleto (faltan gastos)" y preguntar: "¿Es lo mismo que antes? ¿Qué diferencia hay?".
3. Registrar las respuestas.

#### Resultado esperado
- El 100 % de los participantes diferencia "sin datos" de "datos insuficientes".
- El 100 % identifica que en el estado vacío no hay información, y en el incompleto hay información parcial.
- El 100 % menciona la advertencia como elemento diferenciador.

### 7.5 Prueba 5 — Comprensión de usuarios (usabilidad)

**Objetivo:** Validar que los usuarios entienden la advertencia y saben qué hacer.

#### Procedimiento
1. Mostrar a 3 participantes la pantalla del escenario incompleto (faltan gastos).
2. Preguntar: "¿Qué significa el mensaje que ves en la pantalla?".
3. Preguntar: "¿Crees que este análisis es definitivo o está incompleto? ¿Por qué?".
4. Preguntar: "¿Qué deberías hacer para ver el análisis completo?".
5. Preguntar: "¿Qué harías si vieras este mensaje en tu finca?".

#### Resultado esperado
- El 100 % de los participantes identifica que el análisis está incompleto.
- El 100 % de los participantes menciona que faltan gastos.
- Al menos el 90 % menciona que debe registrar gastos o hacer clic en el botón "Registrar gastos".
- Al menos el 80 % expresa que NO tomaría decisiones definitivas basándose en el resultado parcial.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Detección precisa**: El sistema detecta correctamente la ausencia de ingresos, de gastos, o de ambos en el 100 % de los casos probados.
2. **Advertencia clara**: El 100 % de los participantes en pruebas de usabilidad identifica que el análisis está incompleto.
3. **Orientación a la acción**: Al menos el 90 % de los participantes entiende qué datos faltan y qué debe hacer para completarlos.
4. **Resultado parcial diferenciado**: El resultado parcial se muestra con un indicador visual que lo distingue claramente de un resultado completo.
5. **Diferenciación de estados**: El 100 % de los participantes distingue "datos insuficientes" de "sin datos" (estado vacío).
6. **Tiempo de validación**: La validación de integridad se ejecuta en menos de 100 ms para 500 registros.

El Spike se considerará **RECHAZADO** si:

- El sistema no detecta la ausencia de ingresos o gastos en algún escenario.
- Menos del 90 % de los participantes identifica que el análisis está incompleto.
- El usuario confunde "datos insuficientes" con "sin datos".
- La validación de integridad supera los 100 ms para 500 registros.
- El resultado parcial no se distingue visualmente del completo.

## 9. Entorno técnico del spike

- **Cliente móvil**: React Native + TypeScript.
- **Lógica de validación**: Función pura `validarAnalisis(tipo, transacciones)` que retorna `{ estaCompleto, datosFaltantes }`.
- **Reglas de integridad**: Archivo JSON de configuración `reglas-integridad.json` con la lista de tipos de datos requeridos para cada análisis.
- **UI de prueba**: Pantalla simple con banner, lista de faltantes, y tarjeta de resultado parcial.
- **Pruebas de usabilidad**: Se realizan con 3 participantes (campesinos o simuladores).
- **Documentación de usabilidad**: Formato de registro de respuestas por participante.

## 10. Riesgos y mitigación

- **Riesgo**: El usuario puede ignorar la advertencia y confiar en el resultado parcial.
  - **Mitigación**: Hacer la advertencia visualmente prominente (color naranja/rojo, ícono grande, texto en negrita). Repetir la advertencia en el resultado.

- **Riesgo**: Las reglas de integridad son difíciles de definir para todos los análisis.
  - **Mitigación**: Comenzar con un solo análisis (Rentabilidad) y expandir gradualmente en colaboración con el equipo de producto.

- **Riesgo**: El usuario puede confundir "datos insuficientes" con "sin datos" (estado vacío).
  - **Mitigación**: Usar estilos visuales distintos (naranja para incompleto, gris para vacío) y mensajes diferentes. Validar en las pruebas.

- **Riesgo**: La muestra de 3 participantes puede no ser representativa.
  - **Mitigación**: Documentar las limitaciones del spike. En la implementación final, ampliar a al menos 10 participantes.

- **Riesgo**: La advertencia puede ocupar demasiado espacio en pantallas pequeñas.
  - **Mitigación**: Diseñar el banner de forma compacta, con opción de expandir la lista de datos faltantes.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Servicio de validación de integridad.
   - Reglas de integridad en JSON.
   - UI de advertencia con banner, lista de faltantes y resultado parcial.
   - Diferenciación visual entre "datos insuficientes" y "sin datos".
2. **Reporte de pruebas**:
   - Resultados de las 5 pruebas.
   - Resultados de las pruebas de usabilidad (respuestas de los participantes).
   - Tiempos de validación.
3. **Evidencia visual**:
   - Capturas o video mostrando los diferentes estados (completo, incompleto, vacío).
   - Capturas de la diferenciación visual.
4. **Este documento actualizado** con la sección de "Conclusión del Spike" llenada, incluyendo recomendaciones para la implementación en producción (ej. reglas de integridad para otros análisis).


## 12. Conclusión del Spike

- **Fecha de ejecución**: 2026-10-29
- **Cómo se validó**: Se validó sobre el código real de AgroTrack (backend y app móvil), no sobre un PoC aparte. Mediciones en el PC de desarrollo (Windows 11): backend con JDK 26 y base H2 en modo PostgreSQL; app móvil con Jest 29, Node 24 y el SQLite real de Node. Los tiempos de un celular de gama baja pueden ser mayores y se confirman en las pruebas en dispositivos (ADR-012).

- **Resumen de resultados**:
  - ✅ ¿El sistema detectó la ausencia de ingresos y gastos en el 100 % de los casos? Sí. Sin gastos no calcula "por cada $1.000"; sin cosechas, sin gastos o con unidades mezcladas no calcula el costo por kilo.
  - ⏳ ¿El 100 % identificó el análisis como incompleto? Pendiente (prueba con usuarios).
  - ⏳ ¿Al menos el 90 % supo qué datos faltaban? Pendiente (prueba con usuarios).
  - ⏳ ¿El 100 % distinguió "datos insuficientes" de "sin datos"? Pendiente (prueba con usuarios).
  - ✅ ¿La validación se ejecutó en < 100 ms para 500 registros? Sí. 1,75 ms.

- **Evidencia**:
  - `agrotrack-movil/__tests__/spikesRendimiento.test.ts` — bloque SPIKE-008.
  - `agrotrack-movil/__tests__/casosAnalisis.test.ts` — "un cultivo sin gastos ni labores no inventa costo ni trabajo".

- **Cambios respecto a lo propuesto**:
  - No hay banner "Análisis incompleto". La app no muestra el dato que no puede calcular y explica qué falta ("Todavía no has anotado cosechas. Cuando las anotes, aquí verás cuánto produce cada cultivo.").
  - No hay archivo `reglas-integridad.json`: las condiciones están en las funciones del análisis (`porCadaMil`, `costoPorUnidad`).

- **Lecciones aprendidas**:
  - No mostrar un número dudoso es más seguro que mostrarlo con advertencia para un usuario con poca experiencia digital.

- **Recomendaciones para implementación en producción**:
  - En la prueba con usuarios, revisar si entienden por qué falta un dato; si no, agregar un enlace directo al formulario que falta.

- **Decisión final**: ⚠️ **Aprobado parcialmente**: la detección pasa con cambios; falta la prueba con usuarios.
