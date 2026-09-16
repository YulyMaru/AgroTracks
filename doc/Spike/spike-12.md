# SPIKE-012: Validar funcionamiento en dispositivos Android soportados

## Información general

- **ID:** SPIKE-012
- **Nombre:** Validar compatibilidad en dispositivos Android objetivo
- **ADR relacionado:** ADR-012 — Validar app en dispositivos Android soportados
- **Tipo:** Spike / Proof of Concept (PoC)
- **Estado:** Propuesto
- **Prioridad:** Media
- **Timebox estimado:** 3 días hábiles (24 horas hombre)

## 1. Objetivo

Validar que la aplicación se instala, ejecuta y permite utilizar las funciones principales en los dispositivos Android representativos del mercado objetivo, cumpliendo con el escenario ESC-CAL-POR-01.

El Spike busca comprobar que las pruebas manuales en dispositivos clave son efectivas y que la configuración de Firebase Test Lab funciona correctamente para automatizar pruebas de compatibilidad en Android.

## 2. Problema que se busca validar

AgroTrack será usada por campesinos con dispositivos Android de gama variada. Existe el riesgo de que la app no funcione correctamente en dispositivos de gama baja o con versiones antiguas de sistema operativo, lo que limitaría su adopción y generaría malas calificaciones en Google Play. Además, la fragmentación de Android (múltiples fabricantes, versiones de SO, resoluciones y densidades) hace que sea imposible probar en todos los dispositivos manualmente.

Por esta razón, se necesita un prototipo que valide la compatibilidad en al menos 3 dispositivos Android físicos y configure Firebase Test Lab para pruebas automatizadas en múltiples dispositivos.

## 3. Pregunta principal del Spike

¿La aplicación funciona correctamente (instalación, ejecución, funcionalidad, adaptación UI, rendimiento) en al menos 3 dispositivos Android representativos del mercado objetivo (gama baja, media y alta)? Además, ¿la configuración de Firebase Test Lab permite ejecutar pruebas automatizadas en al menos 10 dispositivos Android sin errores de configuración?

## 4. Hipótesis

Si desarrollamos la app con diseño responsive (usando `dp`, `flex`, `SafeAreaView`) y la probamos en dispositivos Android reales (gama baja, media, alta) y en Firebase Test Lab, entonces:

- La instalación será exitosa en el 100 % de los dispositivos.
- La app no crasheará en el 100 % de los dispositivos.
- Las funciones principales (login, registro de gastos, consulta, resumen) serán utilizables en el 100 % de los dispositivos.
- La UI se adaptará correctamente a diferentes resoluciones y densidades, sin elementos cortados o superpuestos.
- Firebase Test Lab ejecutará las pruebas automatizadas correctamente en al menos 10 dispositivos Android.

## 5. Alcance

### 5.1 Incluye

El Spike incluirá:

- **Selección de dispositivos de prueba** (definida en colaboración con el equipo de producto):
  - **Android gama baja**: Samsung Galaxy A12 (o similar, Android 11, RAM 4GB).
  - **Android gama media**: Xiaomi Redmi Note 10 (o similar, Android 12, RAM 6GB).
  - **Android gama alta**: Samsung Galaxy S22 (o similar, Android 13, RAM 8GB).
- **Pruebas manuales** en los 3 dispositivos:
  - Instalación de la app (APK).
  - Inicio de la app y navegación por todas las pantallas principales.
  - Ejecución de las funciones principales: login, registro de gastos, consulta de gastos, resumen económico.
  - Verificación de adaptación de UI en orientación vertical y horizontal (si aplica).
  - Medición de tiempos de respuesta básicos (ej. tiempo de carga del resumen).
- **Configuración de pruebas automatizadas en Firebase Test Lab**:
  - Subir el APK y ejecutar una prueba Robo (exploración automática) o una prueba de integración con Maestro/Espresso en al menos 10 dispositivos Android.
- **Registro de resultados** (incidencias, capturas de pantalla, logs, vídeos de ejecución).

### 5.2 No incluye

El Spike no implementará:

- Pruebas en iOS (AgroTrack solo soporta Android en esta versión).
- Pruebas de rendimiento exhaustivas (se harán en SPIKE-009).
- Pruebas de usabilidad con usuarios (se harán en otros spikes).
- Automatización completa de todas las pruebas (solo se configurará una prueba básica en Firebase Test Lab).
- Pruebas en todos los dispositivos del mercado (solo los representativos y los de Firebase Test Lab).

## 6. Caso de prueba principal

**Dispositivos de prueba (físicos):**

| Dispositivo | SO | Resolución | RAM | Gama | Nota |
|-------------|-----|------------|-----|------|------|
| Samsung Galaxy A12 | Android 11 | HD+ (1600x720) | 4GB | Baja | Común en el mercado rural |
| Xiaomi Redmi Note 10 | Android 12 | FHD+ (2400x1080) | 6GB | Media | Popular en Latinoamérica |
| Samsung Galaxy S22 | Android 13 | FHD+ (2340x1080) | 8GB | Alta | Dispositivo de referencia |

**Dispositivos en Firebase Test Lab:**

- Al menos 10 dispositivos Android, incluyendo los 3 anteriores más otros de diferentes fabricantes (Motorola, Huawei, OnePlus, etc.) y versiones de SO (Android 8, 9, 10, 11, 12, 13).

**Pruebas a realizar en cada dispositivo (manual y automático):**

1. Instalación.
2. Inicio y navegación.
3. Login con credenciales de prueba.
4. Registro de un gasto (descripción, valor, fecha, categoría).
5. Consulta de la lista de gastos.
6. Visualización del resumen económico.
7. Cierre de sesión.

## 7. Pruebas a realizar

### 7.1 Prueba 1 — Instalación y ejecución en dispositivos físicos

**Objetivo:** Validar que la app se instala y abre sin errores en los dispositivos Android representativos.

#### Procedimiento
1. Generar el APK de la app (build de desarrollo o debug).
2. En cada dispositivo físico, transferir el APK (USB, correo, nube) e instalarlo.
   - Habilitar "Instalar desde fuentes desconocidas" si es necesario.
3. Abrir la app.
4. Observar si hay errores de instalación (ej. "No se pudo instalar") o de ejecución (ej. crash al abrir).

#### Resultado esperado
- La instalación es exitosa en el 100 % de los dispositivos.
- La app inicia sin crashes en el 100 % de los dispositivos.
- No hay mensajes de error relacionados con compatibilidad.

---

### 7.2 Prueba 2 — Navegación y funciones principales en dispositivos físicos

**Objetivo:** Validar que las funciones principales son utilizables en todos los dispositivos Android.

#### Procedimiento
1. En cada dispositivo, iniciar sesión con credenciales de prueba.
2. Navegar a todas las pantallas principales:
   - Dashboard (inicio).
   - Registro de gastos (llenar y guardar).
   - Lista de gastos (consultar, scrollear).
   - Resumen económico (generar y visualizar).
3. En cada pantalla, interactuar con los controles (botones, formularios, listas) y observar el comportamiento.
4. Anotar cualquier error, lentitud o comportamiento inesperado.

#### Resultado esperado
- El 100 % de las navegaciones son exitosas.
- El 100 % de las interacciones responden correctamente.
- No hay bloqueos, crashes o errores visibles.
- El rendimiento es aceptable (no hay congelamientos prolongados).

---

### 7.3 Prueba 3 — Adaptación de UI a resoluciones y densidades

**Objetivo:** Validar que la UI se adapta correctamente a diferentes tamaños de pantalla y densidades en Android.

#### Procedimiento
1. En cada dispositivo físico, abrir la app y navegar a las pantallas principales.
2. Observar la interfaz en orientación vertical (por defecto) y horizontal (si el dispositivo lo permite y la app lo soporta).
3. Verificar que los elementos no se superpongan, recorten o desaparezcan.
4. Verificar que los textos sean legibles (tamaño de fuente adecuado).
5. Verificar que los botones y áreas de toque tengan el tamaño adecuado (según ADR-010, mínimo 48x48 dp).
6. Prestar atención a la `StatusBar` y a la `NavigationBar` de Android (safe areas).

#### Resultado esperado
- La UI es legible y funciona en todas las resoluciones probadas.
- No hay elementos cortados o superpuestos.
- Los textos son legibles en todos los dispositivos.
- Los controles táctiles tienen dimensiones adecuadas (≥ 48x48 dp).

---

### 7.4 Prueba 4 — Configuración y ejecución en Firebase Test Lab

**Objetivo:** Validar que Firebase Test Lab está correctamente configurado y ejecuta pruebas básicas en múltiples dispositivos Android reales.

#### Procedimiento
1. Crear un proyecto en Firebase Console.
2. Subir el APK de la app.
3. Configurar una prueba Robo (exploración automática de la UI) o una prueba de integración con Maestro/Espresso.
4. Configurar la ejecución para al menos 10 dispositivos Android (incluyendo diferentes versiones de SO y fabricantes).
5. Ejecutar la prueba y esperar los resultados.
6. Descargar los reportes (logs, capturas de pantalla, vídeos de la ejecución).

#### Resultado esperado
- Firebase Test Lab acepta el APK sin errores y ejecuta las pruebas en todos los dispositivos Android configurados.
- La tasa de éxito de las pruebas es > 90 %.
- Los reportes se generan correctamente y son descargables.
- No hay fallos de compilación o configuración.

---

### 7.5 Prueba 5 — Comparación entre dispositivos físicos y Firebase Test Lab

**Objetivo:** Validar que los resultados obtenidos en dispositivos físicos son consistentes con los de Firebase Test Lab.

#### Procedimiento
1. Comparar los resultados de las pruebas manuales en los 3 dispositivos físicos vs los de Firebase Test Lab.
2. Identificar cualquier diferencia en:
   - Comportamiento de la UI (ej. animaciones, transiciones).
   - Rendimiento (ej. tiempo de carga de pantallas).
   - Comportamiento de los controles (ej. desplazamiento de listas).
3. Documentar las diferencias y evaluar si son aceptables o requieren corrección.

#### Resultado esperado
- El comportamiento es consistente entre dispositivos físicos y Firebase Test Lab.
- Cualquier diferencia es mínima y no afecta la usabilidad.

## 8. Criterios de aceptación del Spike

El Spike se considerará **EXITOSO** si se cumplen todos los siguientes puntos:

1. **Instalación y ejecución**: La app se instala y abre sin crashes en el 100 % de los dispositivos físicos de prueba (3 Android).
2. **Funcionalidad principal**: Las funciones principales son utilizables en el 100 % de los dispositivos físicos de prueba.
3. **Adaptación de UI**: La UI se adapta correctamente a todas las resoluciones y densidades probadas, sin elementos cortados o superpuestos.
4. **Firebase Test Lab**: La configuración es exitosa y ejecuta pruebas en al menos 10 dispositivos Android sin errores de configuración.
5. **Documentación de incidencias**: Se documentan todas las incidencias de compatibilidad encontradas y se priorizan para corrección.

El Spike se considerará **RECHAZADO** si:

- La app no se instala o crashea en alguno de los dispositivos físicos.
- Las funciones principales no son utilizables en algún dispositivo.
- La UI presenta elementos cortados o superpuestos.
- Firebase Test Lab no puede configurarse o no ejecuta en 10 dispositivos.
- No se documentan las incidencias de compatibilidad.

## 9. Entorno técnico del spike

- **Dispositivos físicos**: Los 3 dispositivos Android listados en el caso de prueba (gama baja, media, alta).
- **Herramientas de medición de UI**: Inspección visual directa y Layout Inspector en Android Studio.
- **Device Farm**:
  - **Android**: Firebase Test Lab (proyecto de Firebase con acceso a Test Lab, plan de pago por uso o gratuito con límites).
- **Pruebas automatizadas**: Maestro (recomendado por su sintaxis YAML) o Espresso (nativo Android).
- **Reportes**: Google Play Console (para obtener datos de dispositivos populares).

## 10. Riesgos y mitigación (para el Spike)

- **Riesgo**: No se dispone de todos los dispositivos físicos para las pruebas.
  - **Mitigación**: Priorizar los dispositivos más comunes en el mercado objetivo según datos de Google Play Console. Si no se tienen físicos, se pueden alquilar o usar Firebase Test Lab para esas pruebas específicas.

- **Riesgo**: Las pruebas automáticas en Firebase Test Lab pueden ser lentas y costosas.
  - **Mitigación**: Configurar ejecuciones solo en PRs a la rama principal y en releases, no en cada commit. Usar los planes gratuitos de Firebase Test Lab (si es suficiente).

- **Riesgo**: La app puede tener problemas de rendimiento en dispositivos de gama baja que no se detecten en pruebas cortas.
  - **Mitigación**: Incluir pruebas de rendimiento básicas (ej. tiempo de carga del resumen) y monitorear en producción con Crashlytics.

- **Riesgo**: La fragmentación de Android puede hacer que aparezcan bugs solo en dispositivos específicos no incluidos en el laboratorio.
  - **Mitigación**: Usar Firebase Test Lab para cubrir una mayor variedad de dispositivos y monitorear crashes en producción con Crashlytics para detectar dispositivos problemáticos.

## 11. Entregables del Spike

Al finalizar el timebox, el equipo deberá entregar:

1. **Lista de dispositivos probados** (físicos y en Firebase Test Lab) con resultados detallados.
2. **Reporte de incidencias de compatibilidad** (si las hay):
   - Descripción del problema.
   - Dispositivo(s) afectado(s).
   - Prioridad para corrección.
3. **Capturas de pantalla** de la UI en cada dispositivo (para validar adaptación).
4. **Configuración funcional de Firebase Test Lab** documentada, incluyendo pasos para ejecutar pruebas en Android.
5. **Recomendaciones finales** para:
   - Ajustes de diseño para mejorar la adaptación a dispositivos de gama baja.
   - Mejora del rendimiento en dispositivos con poca RAM.
   - Estrategia de mantenimiento de las pruebas automáticas (actualización periódica de scripts).
   - Actualización de la política de dispositivos soportados (si se encuentra que algún dispositivo no funciona bien).
6. **Este documento actualizado** con la sección de "Conclusión del Spike" llenada.

---

## 12. Conclusión del Spike (para llenar al finalizar)

*(Esta sección se llena al completar el spike)*

- **Resumen de resultados**:
  - ✅ / ❌ ¿La app se instaló en el 100 % de los dispositivos físicos?
  - ✅ / ❌ ¿La app no crasheó en el 100 % de los dispositivos físicos?
  - ✅ / ❌ ¿Las funciones principales funcionaron en el 100 % de los dispositivos?
  - ✅ / ❌ ¿La UI se adaptó correctamente a todas las resoluciones?
  - ✅ / ❌ ¿Firebase Test Lab se configuró correctamente y ejecutó pruebas en múltiples dispositivos Android?

- **Lecciones aprendidas**:
  - (Ejemplo: "Los dispositivos de gama baja tienen menos memoria, por lo que la carga de imágenes debe optimizarse.")
  - (Ejemplo: "Android 8.0 tiene algunas limitaciones en animaciones que no se ven en versiones superiores.")

- **Recomendaciones para implementación en producción**:
  - (Ejemplo: "Reducir el uso de sombras y efectos visuales en dispositivos de gama baja para mejorar el rendimiento.")
  - (Ejemplo: "Añadir pruebas de compatibilidad a la pipeline de CI para que se ejecuten automáticamente en cada release.")

- **Decisión final**: ✅ **Aprobado** / ❌ **Rechazado** (para pasar a desarrollo completo)