# SPIKE-010: Validar interacción táctil y presentación de valores con unidades

## Información general

- **ID:** SPIKE-010
- **Nombre:** Validar dimensiones táctiles y distinción de valores y unidades
- **ADR relacionado:** ADR-010 — Estandarizar táctil y valores con unidades
- **ADR complementarios:** ADR-003 (Presentar resultados económicos en tarjetas), ADR-006 (Consultar datos offline y detectar conectividad)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Media
- **Timebox estimado:** 2 días hábiles (16 horas hombre)

## 1. Objetivo

Validar que los controles táctiles en la aplicación cumplen con las dimensiones mínimas (48x48 dp en Android / 44x44 pt en iOS) y que los valores numéricos se presentan con concepto y unidad clara (ej. "Ingresos totales: $125,000 COP"), cumpliendo con los escenarios **ESC-CAL-ACC-02** y **ESC-CAL-ACC-06**.

El Spike busca comprobar que estos estándares mejoran la precisión de la interacción y la comprensión de los datos por parte del usuario.

## 2. Problema que se busca validar

AgroTrack debe ser fácil de usar en dispositivos táctiles, especialmente para usuarios con manos grandes o en condiciones de movimiento (ej. caminando por el campo). Además, los valores económicos y productivos deben ser inequívocos. Existen riesgos de que:

- Los botones sean demasiado pequeños y el usuario presione el incorrecto, generando frustración.
- Los valores no tengan unidad y el usuario no sepa si está viendo pesos, kilos, hectáreas, etc.
- Los conceptos (ingreso/gasto, producción/costo) no estén claros, llevando a malinterpretaciones.
- La falta de estándares táctiles cause una tasa alta de errores de navegación.
- La muestra de 3 participantes no sea representativa.

Por esta razón, se necesita un prototipo que implemente los componentes con los estándares propuestos y los valide con usuarios reales.

## 3. Pregunta principal del Spike

¿Los controles táctiles con dimensiones estándar (48x48 dp / 44x44 pt) reducen los errores de pulsación por debajo del 5 %, y la presentación de valores con concepto y unidad (ej. "Ingresos totales: $125,000 COP") elimina la ambigüedad en la interpretación de los datos económicos y productivos en el 100 % de los casos?

## 4. Hipótesis

Si implementamos:

- Botones y controles con un tamaño mínimo de 48x48 dp en Android (44x44 pt en iOS) mediante un sistema de diseño estandarizado.
- Un componente `ValueWithUnit` que muestra el formato "Concepto: $Valor Unidad" (ej. "Gastos totales: $60,000 COP").

Entonces:

- El 100 % de los controles principales cumplirán con las dimensiones estándar.
- La tasa de errores de pulsación (pulsaciones accidentales) será inferior al 5 %.
- El 100 % de los valores presentados incluirán concepto y unidad.
- El 100 % de los usuarios podrán identificar correctamente el concepto y el valor en las pruebas de usabilidad.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Creación de componentes UI reutilizables con dimensiones estándar:
  - `Button` (tamaño mínimo 48x48 dp).
  - `IconButton` (tamaño mínimo 48x48 dp).
  - `Checkbox` y `Radio` (área de toque mínima 48x48 dp).
- Creación del componente `ValueWithUnit` que recibe `concept`, `value`, `unit` y los muestra formateados.
- Integración en el resumen económico (ADR-003) y en un listado de gastos de ejemplo.
- Herramientas de medición:
  - En Android: Layout Inspector para medir dimensiones.
  - En iOS: View Hierarchy Debugger.
- Pruebas de usabilidad con 3 participantes para evaluar:
  - Precisión de pulsaciones (tasa de errores).
  - Comprensión de los valores (identificación de concepto y unidad).

### 5.2 No incluye

El Spike no implementará:

- Todos los controles de la app (solo botones principales, checkboxes y elementos de navegación).
- Accesibilidad avanzada (ej. lectores de pantalla, VoiceOver) — se hará en un spike separado si es necesario.
- Personalización de unidades por usuario (se usarán unidades estándar definidas por AgroTrack).
- Animaciones o transiciones complejas (solo funcionalidad básica).
- Pruebas con más de 3 participantes (se documentará como limitación del spike).

## 6. Caso de prueba principal

**Controles a evaluar:**

- Botón "Guardar" en el formulario de gasto.
- Botón "Ver resumen" en el dashboard.
- Botón "Eliminar" en la lista de gastos.
- Checkbox de "Aceptar términos" en el registro.
- Elementos de navegación en el bottom tab (ej. "Inicio", "Registros", "Resumen", "Perfil").

**Valores a evaluar:**

- "Ingresos totales: $125,000 COP" (concepto + valor + unidad).
- "Gastos totales: $60,000 COP".
- "Resultado neto: $65,000 COP (Ganancia)".
- "Área total sembrada: 2.5 ha" (hectáreas).
- "Producción: 1,500 kg" (kilogramos).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Medición de dimensiones táctiles

**Objetivo:** Validar que los controles cumplen con las dimensiones estándar.

#### Procedimiento
1. Abrir la app en un emulador o dispositivo de prueba (Android y/o iOS).
2. Usar herramientas de inspección (Layout Inspector en Android Studio, View Hierarchy Debugger en Xcode) para medir el ancho y alto de:
   - Botón "Guardar".
   - Botón "Cancelar".
   - Botón "Eliminar".
   - Elementos del bottom navigation.
   - Checkbox de "Aceptar términos".
   - Área de toque de los ítems en la lista de gastos.
3. Verificar que todos miden al menos 48x48 dp (Android) o 44x44 pt (iOS).
4. Medir la separación entre controles adyacentes (debe ser ≥ 8 dp).

#### Resultado esperado
- El 100 % de los controles principales cumple con las dimensiones mínimas.
- La separación entre controles es ≥ 8 dp en todos los casos.
- No hay controles que se superpongan o estén demasiado cerca.

---

### 7.2 Prueba 2 — Tasa de errores de pulsación (usabilidad)

**Objetivo:** Medir la precisión de la interacción táctil y comparar con un escenario sin estándares.

#### Procedimiento
1. Preparar dos versiones de la misma pantalla:
   - Versión A (control): botones con dimensiones pequeñas (ej. 30x30 dp).
   - Versión B (spike): botones con dimensiones estándar (48x48 dp).
2. Pedir a 3 participantes que realicen una tarea específica (ej. navegar a la pantalla de resumen, luego volver, y luego eliminar un ítem) en ambas versiones.
3. Registrar la cantidad de pulsaciones accidentales (errores) en cada versión.
4. Calcular la tasa de error (% de pulsaciones incorrectas sobre el total).

#### Resultado esperado
- Versión A (control): tasa de error > 10 %.
- Versión B (spike): tasa de error < 5 %.
- La mejora debe ser significativa, validando la necesidad de los estándares táctiles.

---

### 7.3 Prueba 3 — Comprensión de valores (concepto y unidad)

**Objetivo:** Validar que los usuarios identifican correctamente el concepto y la unidad de los valores presentados.

#### Procedimiento
1. Mostrar a 3 participantes el resumen económico con valores en formato "Concepto: $Valor Unidad" (ej. "Ingresos totales: $125,000 COP").
2. Preguntar:
   - "¿Cuánto dinero ingresó?".
   - "¿Cuánto dinero gastó?".
   - "¿Ganó o perdió? ¿Cuánto?".
   - "¿En qué unidad están estos valores?".
3. Repetir la prueba con un formato sin concepto y sin unidad (solo el número, ej. "125000") en otra pantalla.
4. Comparar los resultados.

#### Resultado esperado
- Con el formato completo (concepto + valor + unidad), el 100 % de los participantes responde correctamente a todas las preguntas.
- Con el formato sin concepto y sin unidad, el porcentaje de aciertos disminuye drásticamente (ej. < 50 %).
- Los participantes expresan que el formato completo es más claro y útil.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Dimensiones táctiles**: El 100 % de los controles principales cumplen con dimensiones ≥ 48x48 dp (Android) o ≥ 44x44 pt (iOS).
2. **Tasa de errores**: La tasa de pulsaciones accidentales es < 5 % en las pruebas con los estándares (vs > 10 % sin estándares).
3. **Comprensión de valores**: El 100 % de los participantes identifica correctamente el concepto y la unidad de los valores presentados con el formato completo.
4. **Preferencia de usuario**: Los participantes expresan preferencia por el formato completo sobre el formato sin concepto/unidad.
5. **Reusabilidad**: Los componentes creados (`Button` estándar y `ValueWithUnit`) son reutilizables y se integran en al menos dos pantallas diferentes.

El Spike se considerará **RECHAZADO** si:

- Alguno de los controles principales no cumple con las dimensiones mínimas.
- La tasa de errores de pulsación es ≥ 5 % con los estándares.
- Menos del 100 % de los participantes identifica correctamente concepto y unidad con el formato completo.
- Los componentes no son reutilizables en al menos dos pantallas.

## 9. Entorno técnico del spike

- **Cliente móvil**: React Native o Flutter (según el stack de AgroTrack).
- **Componentes**:
  - `Button`: con `minWidth: 48`, `minHeight: 48` (Android) y `minWidth: 44`, `minHeight: 44` (iOS), usando `StyleSheet` o `styled-components`.
  - `ValueWithUnit`: componente funcional que recibe `concept`, `value`, `unit` y renderiza `<Text>{concept}: ${formatCurrency(value)} ${unit}</Text>`.
- **Herramientas de medición**:
  - Android: Layout Inspector.
  - iOS: View Hierarchy Debugger.
  - Web (si se prueba en navegador): DevTools.
- **Pruebas de usabilidad**: Grabación de pantalla y observación directa de los participantes.
- **Documentación de usabilidad**: Formato de registro de respuestas por participante.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: Las dimensiones estándar pueden ocupar demasiado espacio en pantallas muy pequeñas (ej. dispositivos de gama baja con resolución 480x800).
  - **Mitigación**: Usar `flex` y `padding` en lugar de dimensiones fijas siempre que sea posible. En pantallas muy pequeñas, se puede reducir ligeramente el padding manteniendo el área de toque mínima.

- **Riesgo**: Los usuarios pueden no entender las unidades abreviadas (ej. "COP" vs "pesos colombianos").
  - **Mitigación**: Usar la unidad completa ("pesos colombianos") en lugar de la abreviatura, o combinarla (ej. "$125,000 COP (pesos colombianos)"). Validar en las pruebas de usabilidad.

- **Riesgo**: El componente `ValueWithUnit` puede alargar demasiado los textos, especialmente en dispositivos pequeños.
  - **Mitigación**: Usar tipografía responsive y permitir que el texto se envuelva en varias líneas si es necesario.

- **Riesgo**: La muestra de 3 participantes puede no ser representativa.
  - **Mitigación**: Documentar las limitaciones del spike. En la implementación final, ampliar a al menos 10 participantes de diferentes perfiles.

- **Riesgo**: Los usuarios con daltonismo pueden no distinguir los colores de ingresos/gastos.
  - **Mitigación**: Añadir iconos (↑, ↓) además del color. Validar en las pruebas.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Código** de los componentes `Button` (con estándar táctil) y `ValueWithUnit`.
2. **Reporte de mediciones**:
   - Dimensiones de los controles (capturas de Layout Inspector).
   - Tasa de errores de pulsación en la versión control y la versión spike.
3. **Resultados de pruebas de usabilidad**:
   - Respuestas de los participantes sobre la comprensión de valores.
   - Comentarios cualitativos sobre la claridad de la información.
4. **Video o capturas** mostrando:
   - Los botones con dimensiones estándar.
   - El formato completo de los valores.
   - Comparativa (opcional) con la versión sin estándares.
5. **Recomendaciones finales** para:
   - Estándares de unidades para toda la app (definir oficialmente `COP`, `kg`, `ha`, `L`, etc.).
   - Guía de estilo para el sistema de diseño (tamaños mínimos de controles).
   - Mejoras de accesibilidad (contraste, iconos complementarios).

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿Se cumplieron las dimensiones táctiles en el 100 % de los controles?
  - ✅ / ❌ ¿La tasa de errores de pulsación fue < 5 %?
  - ✅ / ❌ ¿El 100 % de los participantes identificó correctamente concepto y unidad?
  - ✅ / ❌ ¿Los componentes son reutilizables?

- **Lecciones aprendidas**:
  - (Ejemplo: "Las unidades abreviadas como 'COP' no eran claras para algunos usuarios; usaremos 'pesos colombianos' o '$' + 'COP'.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Añadir un sistema de configuración de unidades para poder cambiarlas fácilmente si el negocio se expande a otros países.")
  - (Ejemplo: "Incluir iconos de ingresos (↑) y gastos (↓) junto al concepto para reforzar la diferenciación.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)