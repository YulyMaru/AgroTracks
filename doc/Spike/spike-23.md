# SPIKE-023: Validar tamaños táctiles, contraste y legibilidad

## Información general

- **ID:** SPIKE-023
- **Nombre:** Validar tamaños táctiles, contraste y respeto por el tamaño de fuente del sistema
- **ADR relacionado:** ADR-023 — Garantizar tamaños táctiles, contraste y legibilidad en la interfaz móvil
- **ADR complementarios:** ADR-003 (Presentar resultados económicos en tarjetas), ADR-010 (Estandarizar táctil y valores con unidades), ADR-017 (Usar React Native con TypeScript como stack del frontend móvil)
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Completado — Aprobado con cambios
- **Fecha de ejecución:** 2026-10-30
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
  - `Boton` (48x48 dp mínimo).
  - `BotonIcono` (48x48 dp mínimo).
  - `CampoTexto` (48x48 dp mínimo).
  - `Tarjeta` (con contraste verificado).
  - `ElementoLista` (48x48 dp mínimo).
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
| Tarjeta "Ingresos" | Contraste ≥ 4.5:1 |
| Tarjeta "Gastos" | Contraste ≥ 4.5:1 |
| Tarjeta "Resultado" | Contraste ≥ 4.5:1 |
| CampoTexto "Descripción" | Contraste ≥ 4.5:1, legible con fuente grande |
| CampoTexto "Valor" | Contraste ≥ 4.5:1, legible con fuente grande |

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

## 12. Conclusión del Spike

- **Fecha de ejecución**: 2026-10-30
- **Cómo se validó**: Se validó sobre el código real de AgroTrack (backend y app móvil), no sobre un PoC aparte. Mediciones en el PC de desarrollo (Windows 11): backend con JDK 26 y base H2 en modo PostgreSQL; app móvil con Jest 29, Node 24 y el SQLite real de Node. Los tiempos de un celular de gama baja pueden ser mayores y se confirman en las pruebas en dispositivos (ADR-012).

- **Resumen de resultados**:
  - ✅ ¿Tamaños táctiles 48x48 dp? Sí, después de corregir: el botón de cerrar aviso (40 → 48), "Salir" (40 → 48), las sugerencias (44 → 48) y el botón del ojo de la clave (44 → 48).
  - ✅ ¿Separación ≥ 8 dp? Sí, después de subir de 6 a 8 dp la separación del selector Entrar / Crear cuenta.
  - ✅ ¿Contraste WCAG 2.1 AA? Sí, en los 47 pares de letra y fondo revisados, después de corregir 7 que no cumplían (ver cambios).
  - ⏳ ¿El layout aguanta `fontScale` al 200 %? Pendiente (celular). Los textos permiten escalar (valor por defecto de React Native) y las pantallas usan `ScrollView`.
  - ✅ ¿Todos los componentes usan el sistema de diseño? Sí. Los colores salen de `COLORES` y los tamaños de `estilos`; ningún texto mide menos de 12 px.

- **Evidencia**:
  - `agrotrack-movil/__tests__/spikesInterfaz.test.ts` — 47 pares de contraste, 15 controles táctiles, botón del ojo, separaciones y tamaño mínimo de letra.

- **Cambios respecto a lo propuesto**:
  - Hallazgos corregidos en `src/pantallas/componentes.tsx` y `PantallaAnotar.tsx`:
    - Naranja de "Anotar rápido" y de la insignia de Envíos: `#F97316` (2,8:1 con letra blanca) → `#C2410C` (5,2:1).
    - Verde claro de los subtítulos sobre verde: `#A7F3D0` (4,3:1) → `#D1FAE5` (4,8:1).
    - Botón "Gasté dinero": rojo vivo `#EF4444` (3,8:1) → `#DC2626` (4,8:1).
    - Botón "Coseché": ámbar `#F59E0B` (2,2:1) → `#B45309` (5,0:1).
    - Ayuda de los botones de color: se quitó la transparencia del 85 % (bajaba a 3,8-4,4:1).
    - Valor de un gasto sobre fondo rojo suave: `#DC2626` (4,4:1) → `#B91C1C` (5,9:1).
    - Detalle de los movimientos: gris `#64748B` (4,35:1) → `#475569` (7,2:1).

- **Lecciones aprendidas**:
  - Una prueba que calcula el contraste de cada par evita que un color nuevo rompa la accesibilidad sin que nadie lo note.

- **Recomendaciones para implementación en producción**:
  - Probar con `fontScale` al 200 % en el celular de gama baja.

- **Decisión final**: ✅ **Aprobado con cambios** (se corrigieron 7 contrastes y 5 tamaños o separaciones).
