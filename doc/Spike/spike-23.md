# SPIKE-023: Validar tamaños táctiles, contraste y legibilidad

## Información general

- **ID:** SPIKE-023
- **Nombre:** Validar tamaños táctiles, contraste y respeto por el tamaño de fuente del sistema
- **ADR relacionado:** ADR-023 — Garantizar tamaños táctiles, contraste y legibilidad en la interfaz móvil
- **ADR complementarios:** ADR-003 (Presentar resultados económicos en tarjetas), ADR-010 (Estandarizar táctil y valores con unidades), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Media
- **Timebox estimado:** 2 días hábiles

## 1. Objetivo

Validar técnicamente que los componentes de AgroTrack cumplen tamaños táctiles mínimos (48x48 dp), contraste suficiente (WCAG 2.1 AA) y respetan el tamaño de fuente del sistema sin romper el layout, cumpliendo con ESC-CAL-ACC-02 y aportando a ESC-CAL-ACC-06.

El Spike busca comprobar que los estándares básicos seleccionados en ADR-023 son viables antes de implementarlos completamente en AgroTrack.

## 2. Problema que se busca validar

AgroTrack debe ser usable por campesinos con manos grandes, posible baja visión leve y uso bajo el sol. Existen riesgos de que:

- Los controles sean demasiado pequeños para manos grandes o con tierra.
- El contraste sea insuficiente bajo el sol.
- El layout se rompa con fuentes grandes del sistema.
- Los componentes nuevos no respeten los estándares.
- Los tamaños táctiles no se midan correctamente.
- Los colores de la paleta no cumplan contraste.

Por esta razón, se necesita un prototipo que implemente los estándares básicos de tamaños, contraste y fuente, y valide su comportamiento en condiciones realistas.

## 3. Pregunta principal del Spike

¿Los componentes de AgroTrack cumplen tamaños táctiles ≥ 48x48 dp, contraste ≥ 4.5:1 y respetan `fontScale` del sistema sin romper el layout, en dispositivos Android de gama baja, media y alta?

## 4. Hipótesis

Si implementamos:

- Sistema de diseño con tamaños mínimos de 48x48 dp.
- Separación mínima de 8 dp entre controles.
- Paleta de colores verificada con WebAIM Contrast Checker.
- `allowFontScaling` en componentes `Text`.
- Layout con `flex` y `ScrollView`.
- Pruebas en 3 dispositivos con Layout Inspector.

Entonces:

- El 100 % de los controles cumplirá 48x48 dp.
- El 100 % de los pares de colores cumplirá contraste WCAG 2.1 AA.
- El layout no se romperá con `fontScale` al 200 %.
- Los componentes nuevos respetarán los estándares.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- Sistema de diseño con componentes base:
  - `Button` (48x48 dp mínimo).
  - `IconButton` (48x48 dp mínimo).
  - `Input` (48x48 dp mínimo).
  - `Card` (con contraste verificado).
  - `ListItem` (48x48 dp mínimo).
- Paleta de colores con contraste verificado con WebAIM Contrast Checker.
- Tipografía legible con `allowFontScaling`.
- Pantallas de prueba que usan los componentes.
- Pruebas en 3 dispositivos Android (gama baja, media, alta).
- Pruebas con `fontScale` al 100 %, 150 % y 200 %.
- Medición de tamaños con Layout Inspector.
- Verificación de contraste con WebAIM.

### 5.2 No incluye

El Spike no implementará:

- TalkBack ni lectores de pantalla.
- Pruebas con usuarios con daltonismo.
- WCAG 2.1 AAA.
- Accesibilidad en el backend.
- Publicación en Google Play ni despliegue en producción.
- Pruebas en iOS (solo Android).
- Accesibilidad avanzada (subtítulos, transcripciones, modo de alto contraste).

## 6. Caso de prueba principal

**Componentes a validar:**

| Componente | Criterio |
|------------|----------|
| Botón "Guardar" | 48x48 dp mínimo |
| Botón "Eliminar" | 48x48 dp mínimo |
| Elemento de navegación | 48x48 dp mínimo |
| Card "Ingresos" | Contraste ≥ 4.5:1 |
| Card "Gastos" | Contraste ≥ 4.5:1 |
| Card "Resultado" | Contraste ≥ 4.5:1 |
| Input "Descripción" | Contraste ≥ 4.5:1, legible con fuente grande |
| Input "Valor" | Contraste ≥ 4.5:1, legible con fuente grande |

**Datos de prueba:**

- Usuario mock autenticado.
- 20 fincas.
- 100 transacciones (50 ingresos, 50 gastos).

**Dispositivos de prueba:**

- Android gama baja: Samsung Galaxy A12 (o similar, RAM 4 GB, Android 11).
- Android gama media: Xiaomi Redmi Note 10 (o similar, RAM 6 GB, Android 12).
- Android gama alta: Samsung Galaxy S22 (o similar, RAM 8 GB, Android 13).

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Tamaños táctiles

**Objetivo:** Validar que los controles cumplen 48x48 dp.

#### Procedimiento
1. Abrir la app en el dispositivo de prueba.
2. Usar Layout Inspector para medir el ancho y alto de cada control interactivo.
3. Verificar que todos los controles miden al menos 48x48 dp.
4. Verificar que la separación entre controles adyacentes es ≥ 8 dp.
5. Repetir en los tres dispositivos.

#### Resultado esperado
- El 100 % de los controles cumple 48x48 dp.
- La separación entre controles es ≥ 8 dp.
- No hay controles superpuestos o demasiado cerca.
- La medición es consistente en los tres dispositivos.

---

### 7.2 Prueba 2 — Contraste de colores

**Objetivo:** Validar que el contraste cumple WCAG 2.1 AA.

#### Procedimiento
1. Identificar todos los pares de colores (texto/fondo, icono/fondo).
2. Medir el ratio de contraste con WebAIM Contrast Checker.
3. Verificar que el texto normal tiene ratio ≥ 4.5:1.
4. Verificar que el texto grande tiene ratio ≥ 3:1.
5. Verificar que los iconos tienen ratio ≥ 3:1.
6. Documentar los ratios de cada par.

#### Resultado esperado
- El 100 % de los pares cumple el ratio requerido.
- No hay texto ilegible.
- No hay iconos con bajo contraste.
- Los ratios están documentados.

---

### 7.3 Prueba 3 — Fuente grande del sistema

**Objetivo:** Validar que el layout no se rompe con `fontScale` al 150 % y 200 %.

#### Procedimiento
1. Cambiar el tamaño de fuente del sistema a 150 %.
2. Abrir la app y navegar por las pantallas principales.
3. Verificar que el texto es legible y no se corta.
4. Verificar que el layout no se rompe.
5. Verificar que los botones siguen siendo presionables.
6. Cambiar el tamaño de fuente a 200 % y repetir.
7. Repetir en los tres dispositivos.

#### Resultado esperado
- El texto es legible con fuente grande.
- El layout no se rompe.
- Los botones siguen siendo presionables.
- No hay texto cortado o superpuesto.
- Funciona en los tres dispositivos.

---

### 7.4 Prueba 4 — Consistencia del sistema de diseño

**Objetivo:** Validar que todos los componentes usan los mismos tamaños y colores.

#### Procedimiento
1. Revisar el código de los componentes base.
2. Verificar que los tamaños están definidos en el sistema de diseño, no hardcodeados.
3. Verificar que los colores vienen de la paleta, no hardcodeados.
4. Verificar que todos los componentes usan las mismas constantes.
5. Documentar cualquier excepción.

#### Resultado esperado
- No hay tamaños hardcodeados.
- No hay colores hardcodeados.
- Todos los componentes usan las constantes del sistema de diseño.
- La consistencia se mantiene en toda la app.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Tamaños táctiles**: El 100 % de los controles cumple 48x48 dp.
2. **Separación**: ≥ 8 dp entre controles adyacentes.
3. **Contraste**: El 100 % de los pares cumple WCAG 2.1 AA (≥ 4.5:1 texto normal, ≥ 3:1 texto grande e iconos).
4. **Fuente grande**: El layout no se rompe con `fontScale` al 200 %.
5. **Consistencia**: Todos los componentes usan el sistema de diseño sin excepciones.

El Spike se considerará **RECHAZADO** si:

- Algún control no cumple 48x48 dp.
- Algún par de colores no cumple el contraste.
- El layout se rompe con `fontScale` al 200 %.
- Hay tamaños o colores hardcodeados.
- Los componentes nuevos no respetan los estándares.

## 9. Entorno técnico del spike

- **Frontend**: React Native + TypeScript.
- **Sistema de diseño**: componentes base con tamaños y colores estandarizados.
- **Medición de tamaños**: Layout Inspector (Android Studio).
- **Medición de contraste**: WebAIM Contrast Checker.
- **Pruebas de fuente**: `fontScale` del sistema Android (100 %, 150 %, 200 %).
- **Dispositivos**: Samsung Galaxy A12, Xiaomi Redmi Note 10, Samsung Galaxy S22.
- **Datos de prueba**: 20 fincas, 100 transacciones.

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: El layout puede romperse con `fontScale` al 200 %.
  - **Mitigación**: Usar `flex` y `ScrollView`. Probar con `fontScale` al 200 % desde el inicio.

- **Riesgo**: Los colores de la paleta pueden no cumplir contraste.
  - **Mitigación**: Verificar con WebAIM antes de implementar componentes.

- **Riesgo**: Los componentes nuevos pueden no respetar los estándares.
  - **Mitigación**: Definir los estándares en el sistema de diseño y documentarlos. Revisar en cada PR.

- **Riesgo**: Los tamaños táctiles pueden variar entre dispositivos.
  - **Mitigación**: Usar `dp` en lugar de píxeles. Probar en los tres dispositivos.

- **Riesgo**: El timebox de 2 días puede ser insuficiente para las 4 pruebas.
  - **Mitigación**: Priorizar pruebas 1, 2 y 3. Si el tiempo no alcanza, documentar la prueba 4 como pendiente.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Repositorio de código** (branch del spike) con:
   - Sistema de diseño con componentes base.
   - Paleta de colores verificada.
   - Tipografía con `allowFontScaling`.
   - Pantallas de prueba que usan los componentes.
2. **Reporte de métricas**:
   - Resultado de Layout Inspector (tamaños).
   - Resultado de WebAIM Contrast Checker (contraste).
   - Resultado de pruebas con `fontScale` al 100 %, 150 % y 200 %.
   - Resultado de la revisión de consistencia.
3. **Evidencia**:
   - Capturas de Layout Inspector mostrando tamaños.
   - Capturas de WebAIM mostrando ratios de contraste.
   - Capturas de las pantallas con `fontScale` al 200 %.
   - Capturas del sistema de diseño.
4. **Este documento actualizado** con la sección de "Conclusión" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿El 100 % de los controles cumplió 48x48 dp?
  - ✅ / ❌ ¿La separación fue ≥ 8 dp entre controles?
  - ✅ / ❌ ¿El 100 % de los pares cumplió contraste WCAG 2.1 AA?
  - ✅ / ❌ ¿El layout no se rompió con `fontScale` al 200 %?
  - ✅ / ❌ ¿Todos los componentes usaron el sistema de diseño?

- **Lecciones aprendidas**:
  - (Ejemplo: "Definir la paleta antes de implementar componentes ahorra retrabajo.")
  - (Ejemplo: "`fontScale` al 200 % es el caso más exigente.")
  - (Ejemplo: "Usar `dp` en lugar de píxeles garantiza consistencia entre dispositivos.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Definir el sistema de diseño desde el día 1.")
  - (Ejemplo: "Verificar contraste antes de aprobar nuevos colores.")
  - (Ejemplo: "Probar con `fontScale` al 200 % en cada release.")
  - (Ejemplo: "Evaluar TalkBack en una futura iteración si el negocio lo requiere.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)